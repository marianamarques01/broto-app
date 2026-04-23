import { memo } from 'react'
import { View, Platform } from 'react-native'
import Animated, { useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated'
import type { Icon as PhosphorIcon } from 'phosphor-react-native'
import { colors } from '@/theme/tokens'

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
}

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

export const TabIcon = memo(function TabIcon({
  focused,
  Icon,
  activeColor = colors.cta.gradientEnd,
  /** `dot` | `bare` (só o ícone — rótulo fica no dock). */
  indicator = 'pill',
}: {
  focused: boolean
  Icon: PhosphorIcon
  /** Vindo do tab bar (ex.: verde do dock); fallback no CTA do app */
  activeColor?: string
  indicator?: 'pill' | 'dot' | 'bare'
}) {
  const iconContainerStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: withSpring(focused ? 1.1 : 1, SPRING_CONFIG) }],
      backgroundColor: withTiming(
        focused ? `${activeColor}38` : 'transparent',
        Platform.OS === 'web'
          ? { duration: 200 }
          : { duration: 200, easing: Easing.out(Easing.quad) },
      ),
    }),
    [activeColor, focused],
  )

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
    transform: [{ scaleX: withSpring(focused ? 1 : 0.3, SPRING_CONFIG) }],
  }))

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.4, SPRING_CONFIG) }],
  }))

  if (indicator === 'bare') {
    return (
      <View style={bareWrap}>
        <Icon
          size={22}
          color={focused ? activeColor : colors.text.muted}
          weight={focused ? 'fill' : 'regular'}
        />
      </View>
    )
  }

  if (indicator === 'dot') {
    return (
      <View style={dotWrap}>
        <Icon
          size={24}
          color={focused ? activeColor : colors.text.muted}
          weight={focused ? 'fill' : 'regular'}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 4,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: activeColor,
            },
            dotStyle,
          ]}
        />
      </View>
    )
  }

  return (
    <View style={containerBase}>
      <Animated.View style={[makeIndicator(activeColor), indicatorStyle]} />
      <Animated.View style={[iconBoxBase, iconContainerStyle]}>
        <Icon
          size={24}
          color={focused ? activeColor : colors.text.muted}
          weight={focused ? 'fill' : 'regular'}
        />
      </Animated.View>
    </View>
  )
})

const dotWrap = {
  position: 'relative' as const,
  minHeight: 48,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingTop: 4,
}
const bareWrap = {
  minHeight: 24,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}
