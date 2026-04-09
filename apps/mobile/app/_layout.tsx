import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { useFonts } from 'expo-font'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { Stack, useRouter, useSegments } from 'expo-router'
import Head from 'expo-router/head'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/hooks/useAuth'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { ClassProvider } from '@/contexts/ClassContext'
import { colors, fonts, fontSize, spacing } from '@/theme/tokens'
import { CentralGlowSvg } from '@/components/HeroGlowSvg'
import FireflyBackground from '@/components/FireflyBackground'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces'
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit'
import '@/global.css'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

SplashScreen.preventAutoHideAsync()

/* ── Wordmark em gradiente ── */

function SplashGradientWordmark() {
  return (
    <View style={splashStyles.wordmarkWrap}>
      <Svg width={180} height={56} viewBox="0 0 180 56">
        <Defs>
          <SvgLinearGradient id="splashWordmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.green[300]} />
            <Stop offset="40%" stopColor={colors.green[500]} />
            <Stop offset="100%" stopColor={colors.gold[300]} />
          </SvgLinearGradient>
        </Defs>
        <SvgText
          x="90"
          y={fontSize['5xl']}
          textAnchor="middle"
          fill="url(#splashWordmarkGrad)"
          fontSize={fontSize['5xl']}
          fontWeight="600"
          fontFamily={fonts.logo}
          letterSpacing={-0.5}
        >
          broto
        </SvgText>
      </Svg>
    </View>
  )
}

/* ── Animated Splash ─ */

function AnimatedSplash({ visible }: { visible: boolean }) {
  const floatY = useSharedValue(0)
  const glowScale = useSharedValue(1)
  const glowOpacity = useSharedValue(0.4)
  const contentOpacity = useSharedValue(0)
  const containerOpacity = useSharedValue(1)

  useEffect(() => {
    contentOpacity.value = withDelay(
      100,
      withTiming(1, {
        duration: 500,
        easing: Platform.OS === 'web' ? Easing.linear : Easing.out(Easing.quad),
      }),
    )

    floatY.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    )

    glowScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    )
    glowOpacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    )
  }, [])

  useEffect(() => {
    if (!visible) {
      containerOpacity.value = withTiming(0, { duration: 400 })
    }
  }, [visible])

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    pointerEvents: containerOpacity.value === 0 ? ('none' as const) : ('auto' as const),
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <LinearGradient colors={[colors.bg.deep, colors.bg.void]} style={splashStyles.container}>
        <FireflyBackground count={10} />

        <View style={splashStyles.center}>
          <Animated.View style={[splashStyles.glowPulseWrap, glowStyle]}>
            <CentralGlowSvg subtle />
          </Animated.View>

          <Animated.View style={[emojiStyle, splashStyles.emojiContainer]}>
            <View style={splashStyles.emojiBox}>
              <Text style={splashStyles.emojiText}>{'\u{1F331}'}</Text>
            </View>
          </Animated.View>

          <Animated.View style={contentStyle}>
            <SplashGradientWordmark />
            <Text style={splashStyles.tagline}>ESTUDE & FLORESCA</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowPulseWrap: {
    position: 'absolute',
    width: 160,
    height: 160,
    marginLeft: -80,
    marginTop: -80,
    left: '50%',
    top: '50%',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sectionGap,
  },
  emojiBox: {
    width: 112,
    height: 112,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green.glow,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  emojiText: {
    fontSize: fontSize['6xl'],
  },
  wordmarkWrap: {
    marginTop: spacing.wordmarkMarginTop,
    alignItems: 'center',
  },
  tagline: {
    marginTop: spacing.taglineMarginTop,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sansMedium,
    letterSpacing: 2,
    color: colors.text.muted,
    textAlign: 'center',
  },
})

/* ── Root Layout ──────────────────────────────────────── */

export default function RootLayout() {
  const { status } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [splashVisible, setSplashVisible] = useState(true)

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    Outfit_600SemiBold,
  })

  // Hide native splash immediately — we show our animated one instead
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  // When auth and fonts resolve, wait a beat then dismiss animated splash
  useEffect(() => {
    if (status !== 'loading' && fontsLoaded) {
      const timer = setTimeout(() => setSplashVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [status, fontsLoaded])

  // Navigate once splash is gone
  useEffect(() => {
    if (status === 'loading' || splashVisible) return

    const inAuthGroup = segments[0] === '(auth)'

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [status, segments, router, splashVisible])

  return (
    <OrganizationProvider>
      <ClassProvider>
        <Head>
          <title>{'broto \u2014 estude & flores\u00e7a'}</title>
        </Head>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="broto-chat"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="study-area"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="mock-exam" />
        </Stack>
        <AnimatedSplash visible={splashVisible} />
      </ClassProvider>
    </OrganizationProvider>
  )
}
