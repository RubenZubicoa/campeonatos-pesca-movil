import { Redirect, router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { obtenerClasificacion, obtenerEscenario } from '@/src/api'
import { Aviso, Boton, Chip, Kicker, Tarjeta, Texto, Titulo } from '@/src/components/ui'
import { mangaEnCurso, rangoDeTurno, textoRango } from '@/src/fecha'
import { useSesion } from '@/src/sesion'
import { colores, radios } from '@/src/theme'
import type { Clasificacion, Escenario, MangaAcceso } from '@/src/types'

type Seccion = 'mangas' | 'escenario' | 'clasificacion'

export default function CampeonatoScreen() {
  const { listo, acceso, mangaActivaId, recargar, salir, iniciarManga } = useSesion()
  const [seccion, setSeccion] = useState<Seccion>('mangas')
  const [escenario, setEscenario] = useState<Escenario>({ sectores: [], tramos: [] })
  const [clasificacion, setClasificacion] = useState<Clasificacion>({ mangas: [], final: [] })
  const [error, setError] = useState('')
  const [refrescando, setRefrescando] = useState(false)

  const cargar = useCallback(async () => {
    if (!acceso) return
    const [escenarioCargado, clasificacionCargada] = await Promise.all([
      obtenerEscenario(acceso.campeonato.id),
      obtenerClasificacion(acceso.campeonato.id),
    ])
    setEscenario(escenarioCargado)
    setClasificacion(clasificacionCargada)
  }, [acceso])

  useEffect(() => {
    if (!acceso) return
    let activo = true
    cargar()
      .then(() => {
        if (activo) setError('')
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : 'No se ha podido cargar el campeonato.')
      })
    return () => {
      activo = false
    }
  }, [acceso, cargar])

  if (!listo) return null
  if (!acceso) return <Redirect href="/" />

  const mangaActiva = acceso.mangas.find((manga) => manga.id === mangaActivaId) ?? null
  const siguiente = acceso.mangas.find(mangaEnCurso) ?? acceso.mangas[0] ?? null

  async function refrescar() {
    setRefrescando(true)
    try {
      await recargar()
      await cargar()
      setError('')
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido actualizar el campeonato.')
    } finally {
      setRefrescando(false)
    }
  }

  async function empezar(manga: MangaAcceso) {
    await iniciarManga(manga.id)
    router.push('/manga')
  }

  return (
    <SafeAreaView style={estilos.fondo}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.oro} />}
      >
        <View style={estilos.cabecera}>
          <Kicker>The Lake</Kicker>
          <Titulo estilo={estilos.titulo}>{acceso.campeonato.nombre}</Titulo>
          <Texto suave>
            {acceso.campeonato.fecha} · {acceso.campeonato.lugar}
          </Texto>
          <Texto>
            Hola, {acceso.participante.nombre}. Este es tu puesto y tu asignación en la prueba.
          </Texto>
        </View>

        {mangaActiva && (
          <Tarjeta estilo={estilos.banner}>
            <Kicker>Manga en curso</Kicker>
            <Texto>{mangaActiva.nombre}</Texto>
            <Boton titulo="Seguir registrando capturas" onPress={() => router.push('/manga')} />
          </Tarjeta>
        )}

        <View style={estilos.chips}>
          <Chip titulo="Mangas" activo={seccion === 'mangas'} onPress={() => setSeccion('mangas')} />
          <Chip titulo="Escenario" activo={seccion === 'escenario'} onPress={() => setSeccion('escenario')} />
          <Chip titulo="Clasificación" activo={seccion === 'clasificacion'} onPress={() => setSeccion('clasificacion')} />
        </View>

        <Aviso>{error}</Aviso>

        {seccion === 'mangas' && <ListaMangas mangas={acceso.mangas} onIniciar={empezar} />}
        {seccion === 'escenario' && <VistaEscenario escenario={escenario} mangas={acceso.mangas} />}
        {seccion === 'clasificacion' && (
          <VistaClasificacion clasificacion={clasificacion} participanteId={acceso.participante.id} />
        )}

        <View style={estilos.acciones}>
          {siguiente && !mangaActiva && (
            <Boton titulo={acceso.mangas.length === 1 ? 'Iniciar manga' : `Iniciar ${siguiente.nombre}`} onPress={() => empezar(siguiente)} />
          )}
          <Boton titulo="Cambiar de identificador" variante="secundario" onPress={() => void salir()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function ListaMangas({
  mangas,
  onIniciar,
}: {
  mangas: MangaAcceso[]
  onIniciar: (manga: MangaAcceso) => void
}) {
  if (mangas.length === 0) {
    return (
      <Tarjeta>
        <Texto suave>Todavía no hay mangas visibles. La organización las publicará cuando estén listas.</Texto>
      </Tarjeta>
    )
  }

  return (
    <View style={estilos.lista}>
      {mangas.map((manga) => {
        const rango = rangoDeTurno(manga)
        const enCurso = mangaEnCurso(manga)
        return (
          <Tarjeta key={manga.id}>
            <View style={estilos.filaTitulo}>
              <Text style={estilos.nombreBloque}>{manga.nombre}</Text>
              {enCurso && <Text style={estilos.etiqueta}>En curso</Text>}
            </View>
            <Texto suave>
              Turno {manga.asignacion.turno} · {rango ? textoRango(rango.inicio, rango.fin) : 'Sin horario'}
            </Texto>
            <Texto>
              {manga.asignacion.sector ?? 'Sector'} · {manga.asignacion.tramo ?? 'Tramo'}
            </Texto>
            <Boton titulo="Iniciar manga" onPress={() => onIniciar(manga)} />
          </Tarjeta>
        )
      })}
    </View>
  )
}

function VistaEscenario({ escenario, mangas }: { escenario: Escenario; mangas: MangaAcceso[] }) {
  const asignados = new Set(mangas.flatMap((manga) => [manga.asignacion.tramoId, manga.asignacion.sectorId]))
  if (escenario.sectores.length === 0 && escenario.tramos.length === 0) {
    return (
      <Tarjeta>
        <Texto suave>Todavía no hay escenario publicado para este campeonato.</Texto>
      </Tarjeta>
    )
  }

  return (
    <View style={estilos.lista}>
      {escenario.sectores.map((sector) => {
        const tramos = escenario.tramos.filter((tramo) => tramo.sectorId === sector.id)
        return (
          <Tarjeta key={sector.id}>
            <View style={estilos.filaTitulo}>
              <Text style={estilos.nombreBloque}>{sector.nombre}</Text>
              {asignados.has(sector.id) && <Text style={estilos.etiqueta}>Tu sector</Text>}
            </View>
            {tramos.length === 0 ? (
              <Texto suave>Este sector todavía no tiene tramos.</Texto>
            ) : (
              tramos.map((tramo) => (
                <Pressable
                  key={tramo.id}
                  onPress={() => void Linking.openURL(`https://maps.google.com/?q=${tramo.latitud},${tramo.longitud}`)}
                  style={estilos.tramo}
                >
                  <View style={estilos.flex}>
                    <Texto>{tramo.nombre}</Texto>
                    {asignados.has(tramo.id) && <Texto suave>Es tu tramo asignado</Texto>}
                  </View>
                  <Texto suave>Ver mapa</Texto>
                </Pressable>
              ))
            )}
          </Tarjeta>
        )
      })}
    </View>
  )
}

function VistaClasificacion({
  clasificacion,
  participanteId,
}: {
  clasificacion: Clasificacion
  participanteId: string
}) {
  if (clasificacion.mangas.length === 0) {
    return (
      <Tarjeta>
        <Texto suave>Todavía no hay mangas para clasificar.</Texto>
      </Tarjeta>
    )
  }

  return (
    <View style={estilos.lista}>
      {clasificacion.mangas.map((manga) => (
        <Tarjeta key={manga.id}>
          <Text style={estilos.nombreBloque}>{manga.nombre}</Text>
          {manga.filas.length === 0 ? (
            <Texto suave>No hay participantes en esta clasificación.</Texto>
          ) : (
            manga.filas.map((fila) => (
              <View key={fila.participanteId} style={[estilos.puesto, fila.participanteId === participanteId && estilos.yo]}>
                <Text style={estilos.puestoNumero}>{textoValor(fila.puesto)}</Text>
                <View style={estilos.flex}>
                  <Texto>{fila.nombre ?? 'Participante'}</Texto>
                  <Texto suave>Puntos: {textoValor(fila.puntos)}</Texto>
                </View>
              </View>
            ))
          )}
        </Tarjeta>
      ))}

      <Tarjeta>
        <Text style={estilos.nombreBloque}>Clasificación final</Text>
        <Texto suave>El puesto final sale de los puestos de cada manga.</Texto>
        {clasificacion.final.map((fila) => (
          <View key={fila.participanteId} style={[estilos.puesto, fila.participanteId === participanteId && estilos.yo]}>
            <Text style={estilos.puestoNumero}>{textoValor(fila.puesto)}</Text>
            <View style={estilos.flex}>
              <Texto>{fila.nombre ?? 'Participante'}</Texto>
              <Texto suave>
                Suma de puestos: {textoValor(fila.suma)} · Puntos: {textoValor(fila.puntosTotales)}
              </Texto>
            </View>
          </View>
        ))}
      </Tarjeta>
    </View>
  )
}

function textoValor(valor: number | null) {
  return valor === null ? '—' : String(valor)
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  cabecera: {
    gap: 8,
  },
  titulo: {
    fontSize: 36,
    lineHeight: 38,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lista: {
    gap: 12,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nombreBloque: {
    color: colores.texto,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 1.2,
    flex: 1,
  },
  etiqueta: {
    color: colores.fondo,
    backgroundColor: colores.oro,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tramo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colores.linea,
  },
  flex: {
    flex: 1,
  },
  puesto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colores.linea,
  },
  yo: {
    backgroundColor: 'rgba(209, 176, 74, 0.08)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: radios.sm,
  },
  puestoNumero: {
    color: colores.oroClaro,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  banner: {
    borderColor: colores.lineaFuerte,
    gap: 12,
  },
  acciones: {
    gap: 10,
    marginTop: 8,
  },
})
