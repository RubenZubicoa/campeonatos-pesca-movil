import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

const logo = require('../../assets/images/logo-the-lake.png')

export function Logo({
  tamano = 'grande',
  estilo,
}: {
  tamano?: 'grande' | 'compacto'
  estilo?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[estilos.caja, tamano === 'compacto' ? estilos.compacto : estilos.grande, estilo]} accessibilityLabel="The Lake">
      <Image source={logo} style={estilos.imagen} resizeMode="contain" />
    </View>
  )
}

const estilos = StyleSheet.create({
  caja: {
    alignSelf: 'flex-start',
  },
  grande: {
    height: 92,
    width: 220,
  },
  compacto: {
    height: 56,
    width: 140,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
})
