import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import type { TextInput as TextInputType } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { Link, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api-client'
import { refreshUser } from '@/hooks/use-user'
import { colors, fonts, fontSize, spacing } from '@/theme/tokens'
import { HeroGlowSvg } from '@/components/HeroGlowSvg'
import { BrotoCtaShimmerButton } from '@/components/BrotoCtaShimmerButton'

/* ── Fireflies (mesmo sistema do login) ───────────────── */

const FIREFLIES = [
  { x: 15, y: 20, s: 2.5, d: 0, t: 4.2, gold: false },
  { x: 80, y: 15, s: 3, d: 1.2, t: 5.1, gold: true },
  { x: 45, y: 55, s: 2, d: 0.8, t: 3.8, gold: false },
  { x: 90, y: 40, s: 2.5, d: 2.0, t: 4.7, gold: true },
  { x: 25, y: 35, s: 2, d: 1.5, t: 3.5, gold: false },
  { x: 65, y: 25, s: 3, d: 0.4, t: 5.0, gold: true },
]

const FIREFLY_KEYFRAMES = {
  progress: [0, 0.12, 0.45, 0.7, 0.9, 1],
  opacity: [0, 0.9, 0.3, 0.85, 0.15, 0],
  x: [0, 2, 8, -3, 5, 0],
  y: [0, -4, -14, -20, -8, 0],
  scale: [0.6, 1, 0.8, 1.1, 0.7, 0.6],
}

function Firefly({ x, y, s, d, t, gold }: (typeof FIREFLIES)[0]) {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withDelay(
      d * 1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: t * 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    )
  }, [])
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.opacity),
    transform: [
      { translateX: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.x) },
      { translateY: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.y) },
      { scale: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.scale) },
    ],
  }))
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: gold ? '#fbbf24' : '#4ade80',
          boxShadow: `0px 0px ${s * 3}px ${gold ? 'rgba(251, 191, 36, 0.5)' : 'rgba(74, 222, 128, 0.5)'}`,
          elevation: 4,
        },
        style,
      ]}
    />
  )
}

function FloatingEmoji() {
  const translateY = useSharedValue(0)
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
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

/* ── SVG Icons ────────────────────────────────────────── */

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

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

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function ChevronLeftIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 13a3 3 0 100-6 3 3 0 000 6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function IdCardIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 10h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 10h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 14h8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

/* ── AnimatedInput ────────────────────────────────────── */

type IconType = 'user' | 'email' | 'lock'

const ICON_MAP = {
  user: UserIcon,
  email: EmailIcon,
  lock: LockIcon,
} as const

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
  icon: IconType
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: 'email-address' | 'default'
  autoCapitalize?: 'none' | 'sentences' | 'words'
  autoComplete?: 'email' | 'password' | 'new-password' | 'name'
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
    return { borderColor: `rgba(16, 185, 129, ${alpha})` }
  })

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const iconColor = focused ? colors.green[400] : colors.text.muted
  const isPassword = icon === 'lock'
  const IconComponent = ICON_MAP[icon]

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <Animated.View style={[styles.inputGlow, glowStyle, { pointerEvents: 'none' }]} />
        <Animated.View style={[styles.inputWrapper, inputWrapperAnimatedBorder]}>
          <View style={styles.inputIconWrap}>
            <IconComponent color={iconColor} />
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

/* ── AnimatedInputSmall (campos opcionais) ────────────── */

function AnimatedInputSmall({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  keyboardType?: 'default' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'characters'
  maxLength?: number
}) {
  const [focused, setFocused] = useState(false)
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

  const inputBorderStyle = useAnimatedStyle(() => {
    const alpha = interpolate(borderProgress.value, [0, 1], [0.15, 0.5])
    return { borderColor: `rgba(16, 185, 129, ${alpha})` }
  })

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  return (
    <View style={styles.halfField}>
      <Text style={styles.labelSm}>{label}</Text>
      <View>
        <Animated.View style={[styles.inputGlowSm, glowStyle, { pointerEvents: 'none' }]} />
        <Animated.View style={[styles.inputWrapperSm, inputBorderStyle]}>
          <View style={styles.inputIconWrapSm}>{icon}</View>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted40}
            style={styles.inputFieldSm}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={colors.green[500]}
          />
        </Animated.View>
      </View>
    </View>
  )
}

/* ── Decorative Divider ───────────────────────────────── */

function FormDivider() {
  return (
    <View style={styles.dividerRow}>
      <LinearGradient
        colors={[colors.green.glowStrong, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />
      <View style={styles.dividerDot} />
      <LinearGradient
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
      <LinearGradient
        colors={[colors.green[500], colors.gold[400]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.accentBar}
      />
    </View>
  )
}

/* ── Optional Toggle ──────────────────────────────────── */

function OptionalChevronIcon({ rotated, color }: { rotated: boolean; color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d={rotated ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/* ── SignupScreen ─────────────────────────────────────── */

export default function SignupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    telefone: '',
    cpf: '',
    cidade: '',
    estado: '',
  })
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  const emailRef = useRef<TextInputType | null>(null)
  const passwordRef = useRef<TextInputType | null>(null)

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  async function uploadAvatar(userId: string): Promise<string | undefined> {
    if (!avatarUri) return undefined
    const supabase = createClient()
    const ext = avatarUri.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    const response = await fetch(avatarUri)
    const blob = await response.blob()

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` })
    if (error) return undefined
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    try {
      const result = await api.post<{ userId: string }>('/api/auth/signup', form)

      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (loginError) {
        router.replace('/(auth)/login')
        return
      }

      if (avatarUri) {
        try {
          const imageUrl = await uploadAvatar(result.userId)
          if (imageUrl) {
            await api.patch('/api/user/profile', { imageUrl })
            refreshUser()
          }
        } catch {}
      }

      router.replace('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.absoluteBg, { height: windowHeight, pointerEvents: 'none' }]}>
        <LinearGradient colors={[colors.bg.deep, colors.bg.void]} style={StyleSheet.absoluteFill} />
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
          <View style={styles.hero}>
            <View style={[styles.firefliesContainer, { pointerEvents: 'none' }]}>
              {FIREFLIES.map((f, i) => (
                <Firefly key={i} {...f} />
              ))}
            </View>

            <Animated.View
              entering={FadeIn.duration(400)}
              style={[styles.backRow, { marginTop: insets.top + 8 }]}
            >
              <Link href="/(auth)/login">
                <View style={styles.backBtn}>
                  <ChevronLeftIcon color={colors.text.secondary} />
                  <Text style={styles.backText}>Voltar</Text>
                </View>
              </Link>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.heroCenter}>
              <FloatingEmoji />
              <Text style={styles.heroTitle}>Criar conta</Text>
              <Text style={styles.heroSubtitle}>Comece sua jornada com o Broto</Text>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={[styles.formCard, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          >
            <CardTopAccent />

            <View style={styles.avatarSection}>
              <Pressable onPress={pickAvatar} style={styles.avatarBtn}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <CameraIcon color={colors.text.muted} />
                )}
              </Pressable>
              <Text style={styles.avatarLabel}>Foto de perfil (opcional)</Text>
            </View>

            <FormDivider />

            <View style={styles.fieldsContainer}>
              <AnimatedInput
                label="NOME COMPLETO *"
                icon="user"
                value={form.nome}
                onChangeText={(v) => updateForm('nome', v)}
                placeholder="Seu nome completo"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <AnimatedInput
                label="EMAIL *"
                icon="email"
                value={form.email}
                onChangeText={(v) => updateForm('email', v)}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                inputRef={emailRef}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <AnimatedInput
                label="SENHA *"
                icon="lock"
                value={form.password}
                onChangeText={(v) => updateForm('password', v)}
                placeholder="Minimo 6 caracteres"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                inputRef={passwordRef}
              />
            </View>

            <Pressable onPress={() => setShowOptional((v) => !v)} style={styles.optionalToggleBtn}>
              <View style={styles.optionalToggleRow}>
                <Text style={styles.optionalToggleText}>Informacoes opcionais</Text>
                <OptionalChevronIcon rotated={showOptional} color={colors.green[400]} />
              </View>
            </Pressable>

            {showOptional && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.optionalGrid}>
                <AnimatedInputSmall
                  label="CPF"
                  icon={<IdCardIcon color={colors.text.muted} />}
                  value={form.cpf}
                  onChangeText={(v) => updateForm('cpf', v)}
                  placeholder="000.000.000-00"
                />
                <AnimatedInputSmall
                  label="Celular"
                  icon={<PhoneIcon color={colors.text.muted} />}
                  value={form.telefone}
                  onChangeText={(v) => updateForm('telefone', v)}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                />
                <AnimatedInputSmall
                  label="Cidade"
                  icon={<MapPinIcon color={colors.text.muted} />}
                  value={form.cidade}
                  onChangeText={(v) => updateForm('cidade', v)}
                  placeholder="Sao Paulo"
                />
                <AnimatedInputSmall
                  label="Estado"
                  icon={<MapPinIcon color={colors.text.muted} />}
                  value={form.estado}
                  onChangeText={(v) => updateForm('estado', v)}
                  placeholder="SP"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </Animated.View>
            )}

            {error && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.errorBox}>
                <View style={styles.errorIconWrap}>
                  <AlertIcon color={colors.red[400]} />
                </View>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <BrotoCtaShimmerButton onPress={handleSubmit} loading={loading} label="Criar conta" />

            <View style={styles.linkRow}>
              <Text style={styles.linkLabel}>Ja tem conta? </Text>
              <Link href="/(auth)/login">
                <Text style={styles.linkAction}>Entrar</Text>
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

  /* Hero */
  hero: {
    paddingBottom: 28,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  firefliesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  backText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.sansMedium,
    color: colors.text.secondary,
  },
  heroCenter: {
    alignItems: 'center',
  },
  emojiBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green.glow,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  emojiText: {
    fontSize: 32,
  },
  heroTitle: {
    marginTop: 14,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.text.muted,
  },

  /* Card */
  formCard: {
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
    marginBottom: 24,
  },
  accentBar: {
    width: 64,
    height: 3,
    borderRadius: 2,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  avatarBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLabel: {
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    color: colors.text.muted,
  },

  /* Divider */
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
  labelSm: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.5,
    color: colors.text.muted,
    marginBottom: 6,
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

  /* Small inputs (optional fields) */
  inputWrapperSm: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.void,
  },
  inputGlowSm: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: 14,
    backgroundColor: colors.green.glow,
  },
  inputIconWrapSm: {
    paddingLeft: 10,
    paddingRight: 2,
  },
  inputFieldSm: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 11,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    color: colors.text.primary,
  },

  /* Optional toggle */
  optionalToggleBtn: {
    marginBottom: 16,
  },
  optionalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignSelf: 'flex-start',
  },
  optionalToggleText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sansMedium,
    color: colors.green[400],
  },
  optionalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  halfField: {
    width: '47%',
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
