import Constants from 'expo-constants'
import { Platform } from 'react-native'
import type { Acceso, Captura, Clasificacion, Escenario } from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function urlBase() {
  const entorno = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')
  if (entorno) return entorno

  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000'
  return 'http://localhost:4000'
}

export function obtenerAcceso(idAcceso: string) {
  return pedir<Acceso>(`/api/acceso/${encodeURIComponent(idAcceso)}`)
}

export function obtenerEscenario(campeonatoId: string) {
  return pedir<Escenario>(`/api/campeonatos/${campeonatoId}/escenario`)
}

export function obtenerClasificacion(campeonatoId: string) {
  return pedir<Clasificacion>(`/api/campeonatos/${campeonatoId}/clasificacion`)
}

export function listarCapturas(campeonatoId: string, filtro: { participanteId: string; mangaId: string }) {
  const params = new URLSearchParams(filtro)
  return pedir<Captura[]>(`/api/campeonatos/${campeonatoId}/capturas?${params}`)
}

export function crearCaptura(
  campeonatoId: string,
  datos: { participanteId: string; mangaId: string; longitud: number; fechaHora: string },
) {
  return pedir<Captura>(`/api/campeonatos/${campeonatoId}/capturas`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${urlBase()}${ruta}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'No se ha podido conectar con la API.')
  }

  if (respuesta.status === 204) return undefined as T
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: string }
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos.error ?? 'No se ha podido completar la operación.')
  }
  return datos as T
}
