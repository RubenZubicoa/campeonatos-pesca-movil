import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Aviso, Boton, Campo, Kicker, Texto, Titulo } from '@/src/components/ui'
import { useSesion } from '@/src/sesion'
import { colores } from '@/src/theme'

export default function AccesoScreen() {
  const { listo, acceso, cargando, error, entrar } = useSesion()
  const [id, setId] = useState('')

  if (!listo) return null
  if (acceso) return <Redirect href="/campeonato" />

  async function enviar() {
    try {
      await entrar(id)
      router.replace('/campeonato')
    } catch {
      // El error ya queda en el contexto de sesión.
    }
  }

  return (
    <SafeAreaView style={estilos.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.marca}>
            <Kicker>The Lake</Kicker>
            <Titulo>Campeonatos</Titulo>
            <Texto estilo={estilos.lead}>
              Introduce el identificador que te ha dado la organización. Con él entras al campeonato en el que estás inscrito.
            </Texto>
          </View>

          <Campo
            etiqueta="Identificador de acceso"
            value={id}
            onChangeText={(valor) => setId(valor.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            placeholder="ABC23XYZ"
            maxLength={16}
            returnKeyType="go"
            onSubmitEditing={enviar}
          />
          <Aviso>{error}</Aviso>
          <Boton titulo="Entrar al campeonato" onPress={enviar} cargando={cargando} />
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  marca: {
    gap: 10,
    marginBottom: 8,
  },
  lead: {
    marginTop: 4,
  },
})
