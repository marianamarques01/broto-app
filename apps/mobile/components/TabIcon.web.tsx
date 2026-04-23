import { View } from 'react-native'
import type { Icon as PhosphorIcon } from 'phosphor-react-native'
import { colors } from '@/theme/tokens'

const containerBase = {
  minHeight: 56,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}
const makeIndicator = (glowColor: string) => ({
  position: 'absolute' as const,
  top: -6,
  height: 2,
  width: 32,
  borderRadius: 1,
  backgroundColor: glowColor,
  boxShadow: '0px 2px 10px rgba(52, 211, 153, 0.45)',
  elevation: 4,
})
const iconBoxBase = {
  height: 40,
  width: 40,
  borderRadius: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}

export function TabIcon({
  focused,
  Icon,
  activeColor = colors.cta.gradientEnd,
  indicator = 'pill',
}: {
  focused: boolean
  Icon: PhosphorIcon
  activeColor?: string
  indicator?: 'pill' | 'dot' | 'bare'
}) {
  if (indicator === 'bare') {
    return (
      <View
        style={{
          minHeight: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={22}
          color={focused ? activeColor : colors.text.muted}
          weight={focused ? 'fill' : 'regular'}
        />
      </View>
    )
  }
  return (
    <View style={containerBase}>
      <View
        style={[
          makeIndicator(activeColor),
          { opacity: focused ? 1 : 0, transform: [{ scaleX: focused ? 1 : 0.3 }] },
        ]}
      />
      <View
        style={[
          iconBoxBase,
          {
            backgroundColor: focused ? `${activeColor}38` : 'transparent',
            transform: [{ scale: focused ? 1.1 : 1 }],
          },
        ]}
      >
        <Icon
          size={24}
          color={focused ? activeColor : colors.text.muted}
          weight={focused ? 'fill' : 'regular'}
        />
      </View>
    </View>
  )
}
