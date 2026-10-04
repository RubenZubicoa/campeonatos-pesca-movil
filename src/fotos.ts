import AsyncStorage from '@react-native-async-storage/async-storage'
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator'

const clave = 'thelake-fotos'

async function mapa() {
  const raw = await AsyncStorage.getItem(clave)
  if (!raw) return {} as Record<string, string>
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function guardarFoto(capturaId: string, uri: string) {
  const procesada = await manipulateAsync(uri, [{ resize: { width: 900 } }], {
    compress: 0.65,
    format: SaveFormat.JPEG,
    base64: true,
  })
  const dataUrl = procesada.base64 ? `data:image/jpeg;base64,${procesada.base64}` : procesada.uri
  const fotos = await mapa()
  fotos[capturaId] = dataUrl
  await AsyncStorage.setItem(clave, JSON.stringify(fotos))
  return dataUrl
}

export async function fotosDe(ids: string[]) {
  const fotos = await mapa()
  const salida: Record<string, string> = {}
  for (const id of ids) {
    if (fotos[id]) salida[id] = fotos[id]
  }
  return salida
}
