import { Link, Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Texto, Titulo } from '@/src/components/ui'
import { colores } from '@/src/theme'

export default function NoEncontrada() {
  return (
    <View style={estilos.caja}>
      <Stack.Screen options={{ headerShown: false }} />
      <Titulo>Página no encontrada</Titulo>
      <Link href="/" style={estilos.enlace}>
        <Texto>Volver al inicio</Texto>
      </Link>
    </View>
  )
}

const estilos = StyleSheet.create({
  caja: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  enlace: {
    paddingVertical: 8,
  },
})
