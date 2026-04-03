import { View, StyleSheet, Dimensions } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg'
import { colors } from '@/theme/tokens'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

const CENTRAL_GLOW_SIZE = 220
const CENTRAL_GLOW_SUBTLE_SIZE = 160

/**
 * Glow radial atrás da logo (círculo central) — esfumado, não sólido.
 * Usar dentro de Animated.View com scale/opacity para o pulse.
 * subtle: versão menor e mais suave para a splash screen.
 */
export function CentralGlowSvg({ subtle = false }: { subtle?: boolean }) {
  const size = subtle ? CENTRAL_GLOW_SUBTLE_SIZE : CENTRAL_GLOW_SIZE
  const maxOpacity = subtle ? '0.28' : '0.5'
  const midOpacity = subtle ? '0.08' : '0.15'

  return (
    <View style={[styles.centralGlowWrap, { width: size, height: size, pointerEvents: 'none' }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id={subtle ? 'centralGlowSub' : 'centralGlow'}
            cx="0.5"
            cy="0.5"
            r="0.5"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={colors.green[500]} stopOpacity={maxOpacity} />
            <Stop offset="50%" stopColor={colors.green[500]} stopOpacity={midOpacity} />
            <Stop offset="100%" stopColor={colors.green[500]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={subtle ? 'url(#centralGlowSub)' : 'url(#centralGlow)'}
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  centralGlowWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
})

/**
 * Glow spots com gradiente radial (esfumado/degradê) — igual ao web.
 * Substitui os View sólidos por gradientes que vão do centro (cor) até transparente.
 */
export function HeroGlowSvg({ height }: { height?: number } = {}) {
  const w = SCREEN_W
  const h = height ?? SCREEN_H

  return (
    <View style={[StyleSheet.absoluteFill, { width: w, height: h, pointerEvents: 'none' }]}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Verde esquerda — 15% 45%, forte */}
          <RadialGradient
            id="glowGreen"
            cx="0.15"
            cy="0.45"
            rx="0.8"
            ry="0.5"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={colors.green[500]} stopOpacity="0.4" />
            <Stop offset="70%" stopColor={colors.green[500]} stopOpacity="0" />
          </RadialGradient>
          {/* Dourado direita — 80% 20% */}
          <RadialGradient
            id="glowGold"
            cx="0.8"
            cy="0.2"
            rx="0.6"
            ry="0.7"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={colors.gold[400]} stopOpacity="0.2" />
            <Stop offset="60%" stopColor={colors.gold[400]} stopOpacity="0" />
          </RadialGradient>
          {/* Verde baixo — 50% 85% */}
          <RadialGradient
            id="glowGreenBottom"
            cx="0.5"
            cy="0.85"
            rx="0.9"
            ry="0.5"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={colors.green[500]} stopOpacity="0.2" />
            <Stop offset="60%" stopColor={colors.green[500]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill="url(#glowGreen)" />
        <Rect x={0} y={0} width={w} height={h} fill="url(#glowGold)" />
        <Rect x={0} y={0} width={w} height={h} fill="url(#glowGreenBottom)" />
      </Svg>
    </View>
  )
}
