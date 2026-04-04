import { useMemo, useCallback, useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import {
  BarChart3,
  PenLine,
  Target,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native'
import { useProgress, type AreaStat, type TopicoStat } from '@/hooks/useProgress'
import { getAreaConfig } from '@/theme/area-config'
import { colors, fonts, radii } from '@/theme/tokens'
import { FadeInSection, StaggerItem } from '@/components/AnimatedEntry'
import { BrotoCtaButton } from '@/components/BrotoCtaButton'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function ProgressRing({
  pct,
  color,
  size = 48,
  strokeWidth = 4,
  delay = 400,
}: {
  pct: number
  color: string
  size?: number
  strokeWidth?: number
  delay?: number
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(Math.min(Math.max(pct, 0), 100), {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    )
  }, [pct, delay])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c - (c * progress.value) / 100,
  }))

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        animatedProps={animatedProps}
      />
    </Svg>
  )
}

function AreaCard({ area, loading }: { area: AreaStat; loading: boolean }) {
  const cfg = getAreaConfig(area.value)
  const areaColor = cfg.color
  const Icon = cfg.AltIcon
  const hasData = !loading && area.totalAnswered > 0
  const pct = loading ? 0 : area.accuracyPct

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.10)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Circular progress ring */}
      <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <ProgressRing pct={hasData ? pct : 0} color={areaColor} />
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansBold,
              color: hasData ? areaColor : colors.text.muted,
            }}
          >
            {hasData ? `${pct}` : '—'}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color={areaColor} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.sansSemiBold,
              color: colors.text.primary,
            }}
          >
            {area.label}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sans,
            color: colors.text.muted,
            marginTop: 3,
          }}
        >
          {hasData ? `${area.totalCorrect}/${area.totalAnswered} acertos` : 'Sem dados ainda'}
        </Text>
      </View>
    </View>
  )
}

function TopicoChip({ t, variant }: { t: TopicoStat; variant: 'forte' | 'fraco' }) {
  const isForte = variant === 'forte'
  const TrendIcon = isForte ? TrendingUp : TrendingDown
  const accentColor = isForte ? colors.green[400] : colors.red[400]

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Trend icon */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isForte ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        }}
      >
        <TrendIcon size={14} color={accentColor} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontFamily: fonts.sansMedium,
            color: colors.text.primary,
          }}
        >
          {t.label}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sans,
            color: colors.text.muted,
            marginTop: 1,
          }}
        >
          {t.totalAnswered} questões
        </Text>
      </View>

      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.sansBold,
          color: accentColor,
        }}
      >
        {t.accuracyPct}%
      </Text>
    </View>
  )
}

function topFortes(areas: AreaStat[]): TopicoStat[] {
  return areas
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered >= 3)
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 3)
}

function topFracos(areas: AreaStat[]): TopicoStat[] {
  return areas
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered >= 3)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 3)
}

const DEFAULT_AREAS: AreaStat[] = [
  {
    value: 'linguagens',
    label: 'Linguagens',
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPct: 0,
    topicos: [],
  },
  {
    value: 'ciencias-humanas',
    label: 'Ciencias Humanas',
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPct: 0,
    topicos: [],
  },
  {
    value: 'ciencias-natureza',
    label: 'Ciencias da Natureza',
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPct: 0,
    topicos: [],
  },
  {
    value: 'matematica',
    label: 'Matematica',
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPct: 0,
    topicos: [],
  },
]

export default function ProgressScreen() {
  const { progress, loading, refresh: refreshProgress } = useProgress()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)

  const hasData = !loading && progress !== null && progress.totalAnswered > 0
  const isEmpty = !loading && (progress === null || progress.totalAnswered === 0)

  const fortes = useMemo(
    () => (hasData ? topFortes(progress!.areas) : []),
    [hasData, progress?.areas],
  )
  const fracos = useMemo(
    () => (hasData ? topFracos(progress!.areas) : []),
    [hasData, progress?.areas],
  )

  const accuracyPct = progress?.totalAnswered ? progress.accuracyPct : 0

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    refreshProgress()
    const t = setTimeout(() => setRefreshing(false), 800)
    return () => clearTimeout(t)
  }, [refreshProgress])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#02140D' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#031A11',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} color={colors.green[500]} />
          <Text
            style={{
              fontSize: 17,
              fontFamily: fonts.sansBold,
              color: colors.text.primary,
            }}
          >
            Progresso
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green[500]}
            colors={[colors.green[500]]}
            progressBackgroundColor="#031A11"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero summary card ── */}
        <View style={{ marginBottom: 24 }}>
          <FadeInSection delay={0}>
            <View
              style={{
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.18)',
              }}
            >
              <LinearGradient
                colors={['#0D5B33', '#10261B']}
                locations={[0, 0.8]}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: radii.lg,
                  pointerEvents: 'none',
                }}
              />
              <View style={{ padding: 24 }}>
                {/* Focal point — big accuracy number */}
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fonts.sans,
                      color: '#BBBBBB',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    Taxa de acerto geral
                  </Text>
                  {loading ? (
                    <View
                      style={{
                        height: 48,
                        width: 80,
                        borderRadius: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 44,
                        fontFamily: fonts.sansBold,
                        color: colors.text.primary,
                        lineHeight: 52,
                      }}
                    >
                      {progress?.totalAnswered ? `${accuracyPct}%` : '—'}
                    </Text>
                  )}
                </View>

                {/* Gradient divider — matches home hero */}
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0)',
                    'rgba(204, 204, 204, 0.4)',
                    'rgba(153, 153, 153, 0)',
                  ]}
                  locations={[0, 0.5, 1]}
                  start={[0, 0.5]}
                  end={[1, 0.5]}
                  style={{
                    width: '100%',
                    height: 1,
                    borderRadius: 10,
                    marginTop: 16,
                    marginBottom: 16,
                  }}
                />

                {/* Stat pills */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    {
                      icon: PenLine,
                      value: loading ? null : (progress?.totalAnswered ?? 0),
                      label: 'Questões',
                      iconColor: colors.blue[400],
                    },
                    {
                      icon: CheckCircle2,
                      value: loading ? null : (progress?.totalCorrect ?? 0),
                      label: 'Acertos',
                      iconColor: colors.green[400],
                    },
                    {
                      icon: Target,
                      value: loading
                        ? null
                        : progress?.totalAnswered
                          ? `${progress.totalAnswered - (progress.totalCorrect ?? 0)}`
                          : '—',
                      label: 'Erros',
                      iconColor: colors.gold[400],
                    },
                  ].map(({ icon: Icon, value, label, iconColor }) => (
                    <View
                      key={label}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderRadius: radii.sm,
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <View style={{ marginBottom: 4 }}>
                        <Icon size={16} color={iconColor} />
                      </View>
                      {loading ? (
                        <View
                          style={{
                            height: 24,
                            width: 40,
                            borderRadius: 6,
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          }}
                        />
                      ) : (
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: fonts.sansMedium,
                            color: colors.text.primary,
                          }}
                        >
                          {value}
                        </Text>
                      )}
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fonts.sansMedium,
                          color: '#BBBBBB',
                          marginTop: 2,
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </FadeInSection>
        </View>

        {/* ── Areas ── */}
        <View style={{ marginBottom: 24 }}>
          <FadeInSection delay={80}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.gold[400],
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.sans,
                    color: '#BBBBBB',
                    letterSpacing: 0.2,
                    textTransform: 'uppercase',
                  }}
                >
                  Desempenho por area
                </Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {(progress?.areas ?? DEFAULT_AREAS).map((area, i) => (
                <StaggerItem key={area.value} index={i} baseDelay={160} stagger={80}>
                  <AreaCard area={area} loading={loading} />
                </StaggerItem>
              ))}
            </View>
          </FadeInSection>
        </View>

        {/* ── Fortes ── */}
        {hasData && fortes.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <FadeInSection delay={500}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.green[500],
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.sans,
                    color: '#BBBBBB',
                    letterSpacing: 0.2,
                    textTransform: 'uppercase',
                  }}
                >
                  Pontos fortes
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {fortes.map((t, i) => (
                  <StaggerItem key={t.value} index={i} baseDelay={560} stagger={60}>
                    <TopicoChip t={t} variant="forte" />
                  </StaggerItem>
                ))}
              </View>
            </FadeInSection>
          </View>
        )}

        {/* ── Fracos ── */}
        {hasData && fracos.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <FadeInSection delay={700}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.red[500],
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.sans,
                    color: '#BBBBBB',
                    letterSpacing: 0.2,
                    textTransform: 'uppercase',
                  }}
                >
                  Pontos a melhorar
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {fracos.map((t, i) => (
                  <StaggerItem key={t.value} index={i} baseDelay={760} stagger={60}>
                    <TopicoChip t={t} variant="fraco" />
                  </StaggerItem>
                ))}
              </View>
            </FadeInSection>
          </View>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <FadeInSection delay={200}>
            <View
              style={{
                alignItems: 'center',
                borderRadius: 24,
                padding: 32,
                backgroundColor: 'rgba(0, 0, 0, 0.10)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderWidth: 1,
                  borderColor: 'rgba(248, 250, 252, 0.14)',
                }}
              >
                <BarChart3 size={28} color={colors.green[500]} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.sansSemiBold,
                  color: colors.text.primary,
                  marginTop: 20,
                  textAlign: 'center',
                }}
              >
                Seu progresso aparece aqui
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.sans,
                  color: colors.text.muted,
                  marginTop: 6,
                  textAlign: 'center',
                  lineHeight: 20,
                  maxWidth: 260,
                }}
              >
                Responda questões para ver seu desempenho por area e topico.
              </Text>
              <View style={{ marginTop: 24, width: '100%' }}>
                <Link href="/(tabs)/questions" asChild>
                  <BrotoCtaButton
                    title="PRATICAR QUESTÕES"
                    rightIcon={<ArrowUpRight size={18} color={colors.cta.text} />}
                  />
                </Link>
              </View>
            </View>
          </FadeInSection>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
