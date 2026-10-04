import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { colores, radios } from '../theme'

export function Kicker({ children }: { children: ReactNode }) {
  return <Text style={estilos.kicker}>{children}</Text>
}

export function Titulo({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  return <Text style={[estilos.titulo, estilo]}>{children}</Text>
}

export function Texto({
  children,
  suave = false,
  estilo,
}: {
  children: ReactNode
  suave?: boolean
  estilo?: StyleProp<TextStyle>
}) {
  return <Text style={[suave ? estilos.suave : estilos.texto, estilo]}>{children}</Text>
}

export function Tarjeta({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.tarjeta, estilo]}>{children}</View>
}

export function Boton({
  titulo,
  onPress,
  variante = 'principal',
  disabled = false,
  cargando = false,
}: {
  titulo: string
  onPress: () => void
  variante?: 'principal' | 'secundario' | 'peligro'
  disabled?: boolean
  cargando?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || cargando}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        variante === 'secundario' && estilos.botonSecundario,
        variante === 'peligro' && estilos.botonPeligro,
        (disabled || cargando) && estilos.botonInactivo,
        pressed && estilos.botonPulsado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'principal' ? colores.fondo : colores.oroClaro} />
      ) : (
        <Text style={[estilos.botonTexto, variante !== 'principal' && estilos.botonTextoClaro]}>{titulo}</Text>
      )}
    </Pressable>
  )
}

export function Campo({
  etiqueta,
  estilo,
  estiloEntrada,
  ...props
}: TextInputProps & { etiqueta: string; estilo?: StyleProp<ViewStyle>; estiloEntrada?: StyleProp<TextStyle> }) {
  return (
    <View style={estilo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor="rgba(212, 207, 196, 0.45)"
        style={[estilos.entrada, estiloEntrada]}
        {...props}
      />
    </View>
  )
}

export function Aviso({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <View style={estilos.aviso}>
      <Text style={estilos.avisoTexto}>{children}</Text>
    </View>
  )
}

export function Chip({
  titulo,
  activo,
  onPress,
}: {
  titulo: string
  activo: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[estilos.chip, activo && estilos.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{titulo}</Text>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  kicker: {
    color: colores.oroClaro,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 8,
  },
  titulo: {
    color: colores.texto,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 1.6,
    lineHeight: 44,
  },
  texto: {
    color: colores.textoSecundario,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  suave: {
    color: colores.textoSuave,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  tarjeta: {
    backgroundColor: colores.panel,
    borderColor: colores.linea,
    borderWidth: 1,
    borderRadius: radios.md,
    padding: 16,
    gap: 8,
  },
  boton: {
    backgroundColor: colores.oro,
    borderRadius: radios.sm,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colores.lineaFuerte,
  },
  botonPeligro: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.55)',
  },
  botonInactivo: {
    opacity: 0.55,
  },
  botonPulsado: {
    transform: [{ translateY: 1 }],
  },
  botonTexto: {
    color: colores.fondo,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  botonTextoClaro: {
    color: colores.oroClaro,
  },
  etiqueta: {
    color: colores.oroClaro,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  entrada: {
    backgroundColor: colores.panelFuerte,
    borderColor: colores.linea,
    borderWidth: 1,
    borderRadius: radios.sm,
    color: colores.texto,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    letterSpacing: 2,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  aviso: {
    backgroundColor: 'rgba(224, 122, 95, 0.12)',
    borderColor: 'rgba(224, 122, 95, 0.4)',
    borderWidth: 1,
    borderRadius: radios.sm,
    padding: 12,
  },
  avisoTexto: {
    color: colores.error,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  chip: {
    borderColor: colores.linea,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colores.panel,
  },
  chipActivo: {
    backgroundColor: colores.oro,
    borderColor: colores.oro,
  },
  chipTexto: {
    color: colores.textoSuave,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  chipTextoActivo: {
    color: colores.fondo,
  },
})
