import { Redirect, router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { crearCaptura, listarCapturas } from '@/src/api'
import { Aviso, Boton, Campo, Kicker, Tarjeta, Texto, Titulo } from '@/src/components/ui'
import { fechaHoraLocal, rangoDeTurno, textoFechaHora, textoRango } from '@/src/fecha'
import { fotosDe, guardarFoto } from '@/src/fotos'
import { useSesion } from '@/src/sesion'
import { colores, radios } from '@/src/theme'
import type { Captura } from '@/src/types'

export default function MangaScreen() {
  const { listo, acceso, mangaActivaId, mangasCerradas, cerrarManga } = useSesion()
  const [capturas, setCapturas] = useState<Captura[]>([])
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [centimetros, setCentimetros] = useState('')
  const [fotoPendiente, setFotoPendiente] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const manga = acceso?.mangas.find((item) => item.id === mangaActivaId) ?? null

  useEffect(() => {
    if (!acceso || !manga) return
    let activo = true
    listarCapturas(acceso.campeonato.id, {
      participanteId: acceso.participante.id,
      mangaId: manga.id,
    })
      .then(async (lista) => {
        if (!activo) return
        setCapturas(lista)
        setFotos(await fotosDe(lista.map((captura) => captura.id)))
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : 'No se han podido cargar las capturas.')
      })
    return () => {
      activo = false
    }
  }, [acceso, manga])

  if (!listo) return null
  if (!acceso) return <Redirect href="/" />
  if (!manga || mangasCerradas.includes(manga.id)) return <Redirect href="/campeonato" />

  const sesion = acceso
  const mangaActiva = manga
  const rango = rangoDeTurno(mangaActiva)

  async function elegirFoto() {
    if (Platform.OS === 'web') {
      await abrirGaleria()
      return
    }
    Alert.alert('Foto de la captura', '¿De dónde quieres tomar la foto?', [
      { text: 'Cámara', onPress: () => void abrirCamara() },
      { text: 'Galería', onPress: () => void abrirGaleria() },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  async function abrirCamara() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync()
    if (!permiso.granted) {
      setError('Necesitas dar permiso a la cámara para fotografiar la captura.')
      return
    }
    const resultado = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!resultado.canceled) setFotoPendiente(resultado.assets[0]?.uri ?? null)
  }

  async function abrirGaleria() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permiso.granted) {
      setError('Necesitas dar permiso a la galería para adjuntar la foto.')
      return
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!resultado.canceled) setFotoPendiente(resultado.assets[0]?.uri ?? null)
  }

  async function registrar() {
    const longitud = Number(centimetros.replace(',', '.'))
    if (!Number.isFinite(longitud) || longitud <= 0) {
      setError('Indica la longitud del pez en centímetros.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const creada = await crearCaptura(sesion.campeonato.id, {
        participanteId: sesion.participante.id,
        mangaId: mangaActiva.id,
        longitud,
        fechaHora: fechaHoraLocal(),
      })
      if (fotoPendiente) {
        const guardada = await guardarFoto(creada.id, fotoPendiente)
        setFotos((actual) => ({ ...actual, [creada.id]: guardada }))
      }
      setCapturas((actual) => [...actual, creada])
      setCentimetros('')
      setFotoPendiente(null)
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido registrar la captura.')
    } finally {
      setGuardando(false)
    }
  }

  async function terminar() {
    await cerrarManga()
    router.replace('/campeonato')
  }

  return (
    <SafeAreaView style={estilos.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.cabecera}>
            <Kicker>Manga iniciada</Kicker>
            <Titulo estilo={estilos.titulo}>{manga.nombre}</Titulo>
            <Texto suave>
              Turno {manga.asignacion.turno} · {rango ? textoRango(rango.inicio, rango.fin) : 'Sin horario'}
            </Texto>
            <Texto>
              {manga.asignacion.sector ?? 'Sector'} · {manga.asignacion.tramo ?? 'Tramo'}
            </Texto>
          </View>

          <Tarjeta estilo={estilos.formulario}>
            <Text style={estilos.bloque}>Registrar captura</Text>
            <Texto suave>Solo tienes que indicar los centímetros. La fecha y la hora se guardan solas.</Texto>
            <Campo
              etiqueta="Centímetros"
              value={centimetros}
              onChangeText={setCentimetros}
              keyboardType="decimal-pad"
              placeholder="42,5"
              returnKeyType="done"
              onSubmitEditing={() => void registrar()}
              estiloEntrada={{ letterSpacing: 0 }}
            />

            {fotoPendiente ? (
              <Pressable onPress={() => void elegirFoto()}>
                <Image source={{ uri: fotoPendiente }} style={estilos.foto} />
                <Texto suave estilo={estilos.centro}>
                  Toca para cambiar la foto
                </Texto>
              </Pressable>
            ) : (
              <Boton titulo="Añadir foto (opcional)" variante="secundario" onPress={() => void elegirFoto()} />
            )}

            <Aviso>{error}</Aviso>
            <Boton titulo="Guardar captura" onPress={() => void registrar()} cargando={guardando} />
          </Tarjeta>

          <View style={estilos.lista}>
            <Text style={estilos.bloque}>Tus capturas</Text>
            {capturas.length === 0 ? (
              <Tarjeta>
                <Texto suave>Aún no has registrado ninguna captura en esta manga.</Texto>
              </Tarjeta>
            ) : (
              [...capturas].reverse().map((captura) => (
                <Tarjeta key={captura.id} estilo={estilos.captura}>
                  {fotos[captura.id] && <Image source={{ uri: fotos[captura.id] }} style={estilos.mini} />}
                  <View style={estilos.flex}>
                    <Text style={estilos.medida}>{captura.longitud} cm</Text>
                    <Texto suave>{textoFechaHora(captura.fechaHora)}</Texto>
                  </View>
                </Tarjeta>
              ))
            )}
          </View>

          <Boton titulo="Ver campeonato" variante="secundario" onPress={() => router.replace('/campeonato')} />
          <Boton titulo="Cerrar manga" variante="peligro" onPress={() => void terminar()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  flex: {
    flex: 1,
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
  formulario: {
    gap: 12,
  },
  bloque: {
    color: colores.texto,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 1.2,
  },
  foto: {
    width: '100%',
    height: 180,
    borderRadius: radios.sm,
    backgroundColor: colores.panelFuerte,
  },
  centro: {
    textAlign: 'center',
    marginTop: 8,
  },
  lista: {
    gap: 10,
  },
  captura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mini: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colores.panelFuerte,
  },
  medida: {
    color: colores.oroClaro,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 1,
  },
})
