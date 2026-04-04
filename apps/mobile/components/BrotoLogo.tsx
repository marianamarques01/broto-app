import { Text, View } from 'react-native'
import { colors, fonts } from '@/theme/tokens'

type Size = 'header' | 'hero'

export function BrotoLogo({ size = 'header' }: { size?: Size }) {
  const fontSize = size === 'hero' ? 32 : 18
  return (
    <View accessible accessibilityRole="text" accessibilityLabel="Broto">
      <Text style={{ fontSize, fontFamily: fonts.logo, color: colors.text.primary }}>broto</Text>
    </View>
  )
}
