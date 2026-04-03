/**
 * Marca visual — new_logo_icon.svg
 */
import type { ComponentType } from 'react'
import { Text, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import NewLogoIconImport from '@/assets/new-logo-icon.svg'
import { colors, fonts } from '@/theme/tokens'

type Size = 'header' | 'hero'

function resolveSvgImport(m: unknown): ComponentType<SvgProps> | null {
  if (typeof m === 'function') return m as ComponentType<SvgProps>
  if (
    m &&
    typeof m === 'object' &&
    'default' in m &&
    typeof (m as { default: unknown }).default === 'function'
  ) {
    return (m as { default: ComponentType<SvgProps> }).default
  }
  return null
}

const NewLogoIcon = resolveSvgImport(NewLogoIconImport as unknown)

/** viewBox 0 0 424.5 573 — altura guia, largura proporcional */
const HEIGHTS: Record<Size, number> = {
  header: 26,
  hero: 44,
}

export function BrotoLogo({ size = 'header' }: { size?: Size }) {
  const h = HEIGHTS[size]
  const w = h * (424.5 / 573)
  if (!NewLogoIcon) {
    const fontSize = size === 'hero' ? 32 : 18
    return (
      <View accessible accessibilityRole="text" accessibilityLabel="Broto">
        <Text style={{ fontSize, fontFamily: fonts.logo, color: colors.text.primary }}>broto</Text>
      </View>
    )
  }
  return (
    <View
      style={{ justifyContent: 'center' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Broto"
    >
      <NewLogoIcon width={w} height={h} />
    </View>
  )
}
