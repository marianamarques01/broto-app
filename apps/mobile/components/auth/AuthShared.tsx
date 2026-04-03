/**
 * Shared UI components for auth screens (splash, login, signup).
 */
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import type { TextInput as TextInputType } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { colors, fonts } from '@/theme/tokens'
import { ctaBorderRadius } from '@/components/BrotoCtaButton'

const BROTO_ICON = require('../../assets/broto-icon.png')

/* ── Broto App Icon (rounded square container) ── */
export function BrotoAppIcon({ size = 120 }: { size?: number }) {
  const r = size * 0.2
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.25)',
          overflow: 'hidden',
          boxShadow: '0px 8px 24px rgba(34, 197, 94, 0.25)',
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#14382a', '#0c2219', '#081a12']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={BROTO_ICON}
            style={{ width: size * 0.6, height: size * 0.6 }}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>
      {/* Subtle glow reflection below icon */}
      <View
        style={{
          width: size * 0.6,
          height: 20,
          borderRadius: 100,
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          marginTop: 8,
        }}
      />
    </View>
  )
}

/* ── Gradient "broto" wordmark ── */
export function GradientWordmark({ fontSize = 36 }: { fontSize?: number }) {
  return (
    <MaskedView
      maskElement={
        <Text
          style={{
            fontSize,
            fontFamily: fonts.sansBold,
            textAlign: 'center',
          }}
        >
          broto
        </Text>
      }
    >
      <LinearGradient
        colors={['#86efac', '#4ade80', '#fbbf24']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{ fontSize, fontFamily: fonts.sansBold, opacity: 0 }}>broto</Text>
      </LinearGradient>
    </MaskedView>
  )
}

/* ── Tagline ── */
export function Tagline() {
  return <Text style={s.tagline}>ESTUDE & FLORESÇA</Text>
}

/* ── Floating particles ── */
const PARTICLES = [
  { top: '8%', left: '5%', size: 4, color: '#22c55e' },
  { top: '14%', left: '82%', size: 3, color: '#22c55e' },
  { top: '28%', left: '90%', size: 3, color: '#f59e0b' },
  { top: '42%', left: '7%', size: 4, color: '#f59e0b' },
  { top: '52%', left: '88%', size: 3, color: '#22c55e' },
  { top: '68%', left: '15%', size: 3, color: '#22c55e' },
  { top: '78%', left: '75%', size: 4, color: '#f59e0b' },
] as const

export function FloatingParticles() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {PARTICLES.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: p.top as any,
            left: p.left as any,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: 0.5,
          }}
        />
      ))}
    </View>
  )
}

/* ── Gradient separator line ── */
export function GradientSeparator() {
  return (
    <View style={{ height: 2, marginVertical: 16, borderRadius: 1, overflow: 'hidden' }}>
      <LinearGradient
        colors={['transparent', '#22c55e', '#fbbf24', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </View>
  )
}

/* ── Card accent pill at top ── */
export function CardAccentPill() {
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <View style={{ width: 40, height: 4, borderRadius: 2, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#16a34a', '#22c55e', '#4ade80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  )
}

/* ── Gradient button ── */
export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}) {
  const r = ctaBorderRadius()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        borderRadius: r,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : disabled || loading ? 0.6 : 1,
      })}
    >
      <LinearGradient
        colors={[colors.cta.gradientStart, colors.cta.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          borderRadius: r,
          overflow: 'hidden',
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.cta.text} />
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.logo,
              fontWeight: '700',
              color: colors.cta.text,
            }}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}

/* ── Auth field with icon ── */
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
  maxLength,
  icon,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: 'email-address' | 'default' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoComplete?: 'email' | 'password' | 'new-password' | 'name'
  returnKeyType?: 'next' | 'done' | 'go'
  onSubmitEditing?: () => void
  inputRef?: React.RefObject<TextInputType | null>
  maxLength?: number
  icon?: React.ReactNode
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputRow}>
        {icon && <View style={{ marginRight: 12 }}>{icon}</View>}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted40}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          style={s.inputText}
          selectionColor={colors.semantic.primary}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  tagline: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: '#6b876b',
    letterSpacing: 3,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
    color: colors.semantic.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.void,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.sans,
    color: colors.text.primary,
  },
})
