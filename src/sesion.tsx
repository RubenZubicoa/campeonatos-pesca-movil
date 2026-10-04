import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { obtenerAcceso } from './api'
import type { Acceso } from './types'

const claveAcceso = 'thelake-id-acceso'
const claveManga = 'thelake-manga-activa'

type ContextoSesion = {
  listo: boolean
  cargando: boolean
  error: string
  acceso: Acceso | null
  mangaActivaId: string | null
  entrar: (id: string) => Promise<void>
  recargar: () => Promise<void>
  salir: () => Promise<void>
  iniciarManga: (mangaId: string) => Promise<void>
  cerrarManga: () => Promise<void>
}

const Sesion = createContext<ContextoSesion | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [acceso, setAcceso] = useState<Acceso | null>(null)
  const [mangaActivaId, setMangaActivaId] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    AsyncStorage.multiGet([claveAcceso, claveManga])
      .then(async ([[, id], [, mangaId]]) => {
        if (!activo) return
        if (mangaId) setMangaActivaId(mangaId)
        if (!id) return
        const datos = await obtenerAcceso(id)
        if (activo) setAcceso(datos)
      })
      .catch((causa: unknown) => {
        if (activo) {
          setAcceso(null)
          setError(causa instanceof Error ? causa.message : 'No se ha podido recuperar la sesión.')
        }
      })
      .finally(() => {
        if (activo) setListo(true)
      })
    return () => {
      activo = false
    }
  }, [])

  const valor = useMemo<ContextoSesion>(
    () => ({
      listo,
      cargando,
      error,
      acceso,
      mangaActivaId,
      async entrar(id) {
        const limpio = id.trim().toUpperCase()
        if (!limpio) {
          const mensaje = 'Introduce el identificador que te ha dado la organización.'
          setError(mensaje)
          throw new Error(mensaje)
        }
        setCargando(true)
        setError('')
        try {
          const datos = await obtenerAcceso(limpio)
          await AsyncStorage.setItem(claveAcceso, limpio)
          setAcceso(datos)
        } catch (causa: unknown) {
          setAcceso(null)
          setError(causa instanceof Error ? causa.message : 'No se ha podido entrar con ese identificador.')
          throw causa
        } finally {
          setCargando(false)
        }
      },
      async recargar() {
        const id = acceso?.participante.id
        if (!id) return
        const datos = await obtenerAcceso(id)
        setAcceso(datos)
      },
      async salir() {
        await AsyncStorage.multiRemove([claveAcceso, claveManga])
        setAcceso(null)
        setMangaActivaId(null)
        setError('')
      },
      async iniciarManga(mangaId) {
        await AsyncStorage.setItem(claveManga, mangaId)
        setMangaActivaId(mangaId)
      },
      async cerrarManga() {
        await AsyncStorage.removeItem(claveManga)
        setMangaActivaId(null)
      },
    }),
    [acceso, cargando, error, listo, mangaActivaId],
  )

  return <Sesion.Provider value={valor}>{children}</Sesion.Provider>
}

export function useSesion() {
  const contexto = useContext(Sesion)
  if (!contexto) throw new Error('useSesion tiene que usarse dentro de SesionProvider.')
  return contexto
}
