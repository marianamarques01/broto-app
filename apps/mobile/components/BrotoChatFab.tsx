import { useEffect } from 'react'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { colors } from '@/theme/tokens'

const FAB_SIZE = 56
const GLOW_SIZE = 72

export function BrotoChatFab() {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const scale = useSharedValue(1)
  const breathe = useSharedValue(0)

  useEffect(() => {
    breathe.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    )
  }, [])

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.25, 0.6]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.85, 1.1]) }],
  }))

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.1, 0.35]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.2]) }],
  }))

  if (pathname === '/broto-chat') {
    return null
  }

  return (
    <Animated.View
      style={[
        pressStyle,
        {
          position: 'absolute',
          right: 16,
          bottom: 80 + insets.bottom,
          zIndex: 100,
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {/* Outer breathing ring */}
      <Animated.View style={[styles.ring, ringStyle]} />

      {/* Soft glow behind the button */}
      <Animated.View style={[styles.glow, glowStyle]} />

      <Pressable
        onPress={() => router.push('/broto-chat')}
        onPressIn={() => {
          scale.value = withSpring(0.88, { damping: 12, stiffness: 400 })
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 })
        }}
        accessibilityLabel="Abrir chat com Broto"
        accessibilityRole="button"
      >
        <View style={styles.button}>
          <Text style={styles.emoji}>{'\u{1F331}'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.green[500],
  },
  glow: {
    position: 'absolute',
    width: FAB_SIZE + 8,
    height: FAB_SIZE + 8,
    borderRadius: (FAB_SIZE + 8) / 2,
    backgroundColor: colors.green[500],
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.bg.deep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.green[600],
    boxShadow: '0px 0px 16px rgba(52, 211, 153, 0.5)',
    elevation: 10,
  },
  emoji: {
    fontSize: 26,
  },
})
