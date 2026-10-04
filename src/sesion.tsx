import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { obtenerAcceso } from './api'
import type { Acceso } from './types'

const claveAcceso = 'thelake-id-acceso'
const claveManga = 'thelake-manga-activa'
const claveCerradas = 'thelake-mangas-cerradas'

type MangasCerradas = Record<string, string[]>

type ContextoSesion = {
  listo: boolean
  cargando: boolean
  error: string
  acceso: Acceso | null
  mangaActivaId: string | null
  mangasCerradas: string[]
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
  const [mangasCerradas, setMangasCerradas] = useState<string[]>([])

  useEffect(() => {
    let activo = true
    AsyncStorage.multiGet([claveAcceso, claveManga])
      .then(async ([[, id], [, mangaId]]) => {
        if (!activo) return
        if (!id) {
          if (mangaId) setMangaActivaId(mangaId)
          return
        }
        const [datos, cerradas] = await Promise.all([obtenerAcceso(id), leerCerradas(id)])
        if (!activo) return
        setAcceso(datos)
        setMangasCerradas(cerradas)
        setMangaActivaId(mangaId && !cerradas.includes(mangaId) ? mangaId : null)
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
      mangasCerradas,
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
          const [datos, cerradas] = await Promise.all([obtenerAcceso(limpio), leerCerradas(limpio)])
          await AsyncStorage.setItem(claveAcceso, limpio)
          setAcceso(datos)
          setMangasCerradas(cerradas)
          setMangaActivaId((actual) => (actual && cerradas.includes(actual) ? null : actual))
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
        setMangasCerradas([])
        setError('')
      },
      async iniciarManga(mangaId) {
        if (mangasCerradas.includes(mangaId)) {
          throw new Error('Esta manga ya está cerrada.')
        }
        await AsyncStorage.setItem(claveManga, mangaId)
        setMangaActivaId(mangaId)
      },
      async cerrarManga() {
        const participanteId = acceso?.participante.id
        if (mangaActivaId && participanteId) {
          const siguiente = [...new Set([...mangasCerradas, mangaActivaId])]
          await guardarCerradas(participanteId, siguiente)
          setMangasCerradas(siguiente)
        }
        await AsyncStorage.removeItem(claveManga)
        setMangaActivaId(null)
      },
    }),
    [acceso, cargando, error, listo, mangaActivaId, mangasCerradas],
  )

  return <Sesion.Provider value={valor}>{children}</Sesion.Provider>
}

export function useSesion() {
  const contexto = useContext(Sesion)
  if (!contexto) throw new Error('useSesion tiene que usarse dentro de SesionProvider.')
  return contexto
}

async function leerCerradas(participanteId: string) {
  const raw = await AsyncStorage.getItem(claveCerradas)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as MangasCerradas
    return Array.isArray(parsed[participanteId]) ? parsed[participanteId] : []
  } catch {
    return []
  }
}

async function guardarCerradas(participanteId: string, ids: string[]) {
  const raw = await AsyncStorage.getItem(claveCerradas)
  let todas: MangasCerradas = {}
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MangasCerradas
      if (parsed && typeof parsed === 'object') todas = parsed
    } catch {
      todas = {}
    }
  }
  todas[participanteId] = ids
  await AsyncStorage.setItem(claveCerradas, JSON.stringify(todas))
}
