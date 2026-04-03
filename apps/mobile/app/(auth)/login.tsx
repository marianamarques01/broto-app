import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import type { TextInput as TextInputType } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated'
import FireflyBackground from '@/components/FireflyBackground'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  Path,
  G,
  Rect as SvgRect,
} from 'react-native-svg'
import { Link, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api-client'
import { colors, fonts, fontSize, spacing } from '@/theme/tokens'
import { HeroGlowSvg, CentralGlowSvg } from '@/components/HeroGlowSvg'
import { BrotoCtaShimmerButton } from '@/components/BrotoCtaShimmerButton'

function FloatingEmoji() {
  const translateY = useSharedValue(0)
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  return (
    <Animated.View style={style}>
      <View style={styles.emojiBox}>
        <Text style={styles.emojiText}>{'\u{1F331}'}</Text>
      </View>
    </Animated.View>
  )
}

function GlowPulse() {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.6)
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    )
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    )
  }, [])
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))
  return (
    <Animated.View style={[styles.glowPulseWrap, style]}>
      <CentralGlowSvg />
    </Animated.View>
  )
}

const WORDMARK_COLORS = [colors.green[300], colors.green[500], colors.gold[300]] as const

function GradientWordmark() {
  return (
    <View style={styles.wordmarkWrap}>
      <Svg width={180} height={56} viewBox="0 0 180 56">
        <Defs>
          <LinearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={WORDMARK_COLORS[0]} />
            <Stop offset="40%" stopColor={WORDMARK_COLORS[1]} />
            <Stop offset="100%" stopColor={WORDMARK_COLORS[2]} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="90"
          y={fontSize['5xl']}
          textAnchor="middle"
          fill="url(#wordmarkGrad)"
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

/* ── SVG Icons ────────────────────────────────────────── */

function EmailIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function EyeOffIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function AlertIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

/* ── AnimatedInput ────────────────────────────────────── */

function AnimatedInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  onSubmitEditing,
  returnKeyType,
  inputRef,
}: {
  label: string
  icon: 'email' | 'lock'
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: 'email-address' | 'default'
  autoCapitalize?: 'none' | 'sentences'
  autoComplete?: 'email' | 'password'
  onSubmitEditing?: () => void
  returnKeyType?: 'next' | 'done' | 'go'
  inputRef?: React.RefObject<TextInputType | null>
}) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const borderProgress = useSharedValue(0)
  const glowOpacity = useSharedValue(0)

  const handleFocus = useCallback(() => {
    setFocused(true)
    borderProgress.value = withTiming(1, {
      duration: 250,
      easing: Platform.OS === 'web' ? Easing.linear : Easing.out(Easing.quad),
    })
    glowOpacity.value = withTiming(1, {
      duration: 300,
      easing: Platform.OS === 'web' ? Easing.linear : Easing.out(Easing.quad),
    })
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
    borderProgress.value = withTiming(0, {
      duration: 200,
      easing: Platform.OS === 'web' ? Easing.linear : Easing.in(Easing.quad),
    })
    glowOpacity.value = withTiming(0, {
      duration: 200,
      easing: Platform.OS === 'web' ? Easing.linear : Easing.in(Easing.quad),
    })
  }, [])

  const inputWrapperAnimatedBorder = useAnimatedStyle(() => {
    const alpha = interpolate(borderProgress.value, [0, 1], [0.15, 0.5])
    return {
      borderColor: `rgba(16, 185, 129, ${alpha})`,
    }
  })

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const iconColor = focused ? colors.green[400] : colors.text.muted
  const isPassword = icon === 'lock'

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <Animated.View style={[styles.inputGlow, glowStyle, { pointerEvents: 'none' }]} />
        <Animated.View style={[styles.inputWrapper, inputWrapperAnimatedBorder]}>
          <View style={styles.inputIconWrap}>
            {icon === 'email' ? <EmailIcon color={iconColor} /> : <LockIcon color={iconColor} />}
          </View>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            secureTextEntry={isPassword && !showPassword}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted40}
            style={styles.inputField}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            selectionColor={colors.green[500]}
          />
          {isPassword && value.length > 0 && (
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
              {showPassword ? (
                <EyeOffIcon color={colors.text.muted} />
              ) : (
                <EyeIcon color={colors.text.muted} />
              )}
            </Pressable>
          )}
        </Animated.View>
      </View>
    </View>
  )
}

/* ── Decorative Divider ───────────────────────────────── */

function FormDivider() {
  return (
    <View style={styles.dividerRow}>
      <ExpoLinearGradient
        colors={[colors.green.glowStrong, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />
      <View style={styles.dividerDot} />
      <ExpoLinearGradient
        colors={['transparent', colors.green.glowStrong]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />
    </View>
  )
}

/* ── Card Top Accent ──────────────────────────────────── */

function CardTopAccent() {
  return (
    <View style={styles.accentBarWrap}>
      <ExpoLinearGradient
        colors={[colors.green[500], colors.gold[400]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.accentBar}
      />
    </View>
  )
}

/* ── LoginScreen ──────────────────────────────────────── */

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<TextInputType | null>(null)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message || 'Email ou senha incorretos.')
        return
      }
      try {
        const user = await api.get<{ onboardingDone: boolean }>('/api/user/me')
        router.replace(user.onboardingDone ? '/(tabs)' : '/onboarding')
      } catch {
        router.replace('/onboarding')
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const heroHeight = Math.round(windowHeight * 0.46)

  return (
    <View style={styles.screen}>
      <View style={[styles.absoluteBg, { height: windowHeight, pointerEvents: 'none' }]}>
        <ExpoLinearGradient
          colors={[colors.bg.deep, colors.bg.void]}
          style={StyleSheet.absoluteFill}
        />
        <HeroGlowSvg height={windowHeight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={[styles.hero, { height: heroHeight }]}>
            <FireflyBackground count={10} />

            <Animated.View entering={FadeIn.duration(500)} style={styles.emojiContainer}>
              <GlowPulse />
              <FloatingEmoji />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).duration(500)}>
              <GradientWordmark />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(160).duration(500)}>
              <Text style={styles.tagline}>ESTUDE & FLORESCA</Text>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(240).duration(500)}
            style={[styles.formCard, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          >
            <CardTopAccent />

            <Text style={styles.formTitle}>Entrar</Text>
            <Text style={styles.formSubtitle}>Bem-vindo de volta</Text>

            <FormDivider />

            <View style={styles.fieldsContainer}>
              <AnimatedInput
                label="EMAIL"
                icon="email"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <AnimatedInput
                label="SENHA"
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                secureTextEntry
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                inputRef={passwordRef}
              />
            </View>

            {error ? (
              <Animated.View entering={FadeIn.duration(250)} style={styles.errorBox}>
                <View style={styles.errorIconWrap}>
                  <AlertIcon color={colors.red[400]} />
                </View>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <BrotoCtaShimmerButton onPress={handleSubmit} loading={loading} label="Entrar" />

            <View style={styles.linkRow}>
              <Text style={styles.linkLabel}>Ainda não tem conta? </Text>
              <Link href="/(auth)/signup">
                <Text style={styles.linkAction}>Criar conta</Text>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/* ── Styles ───────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.void,
  },
  absoluteBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
  },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: colors.bg.void,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 72,
    paddingBottom: 40,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  glowPulseWrap: {
    position: 'absolute',
    width: 220,
    height: 220,
    marginLeft: -110,
    marginTop: -110,
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

  /* Card */
  formCard: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingHorizontal: 28,
    paddingTop: 0,
    overflow: 'hidden',
  },
  accentBarWrap: {
    alignItems: 'center',
    marginTop: -1,
    marginBottom: 28,
  },
  accentBar: {
    width: 64,
    height: 3,
    borderRadius: 2,
  },

  /* Header do formulario */
  formTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.text.muted,
    marginBottom: 20,
  },

  /* Divider decorativo */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green[500],
    marginHorizontal: 12,
  },

  /* Fields */
  fieldsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  field: {},
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 1.2,
    color: colors.text.muted,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.void,
  },
  inputGlow: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: 16,
    backgroundColor: colors.green.glow,
  },
  inputIconWrap: {
    paddingLeft: 14,
    paddingRight: 2,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.text.primary,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  /* Error */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.red.glow,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  errorIconWrap: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.red[400],
    lineHeight: 20,
  },

  /* Link row */
  linkRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  linkLabel: {
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.text.muted,
  },
  linkAction: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.logo,
    color: colors.green[400],
  },
})
