import React, { useMemo, useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import FireflyBackground from '@/components/FireflyBackground'
import { ArrowRight, Flame, Sprout, Target, PenLine, ChevronRight } from 'lucide-react-native'
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet'
import { useProgress, type AreaStat } from '@/hooks/use-progress'
import { getAreaConfig } from '@/theme/area-config'
import { colors, fonts } from '@/theme/tokens'
import { FadeInSection, StaggerItem, AnimatedBar, ScaleIn } from '@/components/AnimatedEntry'
import { BrotoCtaButton } from '@/components/BrotoCtaButton'

const FASE_MSG: Record<string, string> = {
  semente: 'Cada questão faz seu Broto crescer. Comece agora!',
  muda: 'Seu Broto esta brotando! Continue para chegar na proxima fase.',
  planta: 'Que planta linda! Voce esta progredindo muito bem.',
  flor: 'Incrivel — seu Broto esta florindo! Continue assim.',
  especial: 'Lendario! Voce alcancou o nivel especial.',
}

function FocusCard({ area }: { area: AreaStat }) {
  const cfg = getAreaConfig(area.value)
  const Icon = cfg.AltIcon
  const areaColor = { solid: cfg.color, bg: cfg.glow, text: cfg.textColor }

  return (
    <Link href="/(tabs)/questions" asChild>
      <Pressable
        className="flex-row items-center gap-3 rounded-xl px-4 py-3.5"
        style={{
          // um pouco mais claro que os cards escuros padrão
          backgroundColor: 'rgba(0, 0, 0, 0.10)',
          borderWidth: 1,
          borderColor: areaColor.solid + '15',
        }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: areaColor.solid + '20' }}
        >
          <Icon size={16} color={areaColor.text} />
        </View>
        <View className="flex-1">
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansSemiBold,
              color: colors.text.primary,
            }}
          >
            {area.label}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sans,
              color: colors.text.muted,
            }}
          >
            {area.totalAnswered > 0
              ? `${area.accuracyPct}% acerto · ${area.totalAnswered} questoes`
              : 'Nenhuma questao ainda'}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.text.muted} />
      </Pressable>
    </Link>
  )
}

export default function StudyScreen() {
  const { pet, loading: loadingPet, refresh: refreshPet } = usePet()
  const { progress, loading: loadingProgress, refresh: refreshProgress } = useProgress()
  const [refreshing, setRefreshing] = useState(false)

  const fase = pet?.fase ?? 'semente'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpProgress = xp % 100
  const streak = pet?.streak ?? 0
  const questoesHoje = pet?.questoesHoje ?? 0
  const acertosHoje = pet?.acertosHoje ?? 0

  const areasParaFocar = useMemo(
    () =>
      (progress?.areas ?? [])
        .filter((a) => a.totalAnswered > 0)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 2),
    [progress?.areas],
  )

  const areasNaoIniciadas = useMemo(
    () => (progress?.areas ?? []).filter((a) => a.totalAnswered === 0).slice(0, 2),
    [progress?.areas],
  )

  const mostrarFoco = !loadingProgress && areasParaFocar.length > 0
  const mostrarIniciar =
    !loadingProgress && areasParaFocar.length === 0 && areasNaoIniciadas.length > 0

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    refreshPet()
    refreshProgress()
    const t = setTimeout(() => setRefreshing(false), 800)
    return () => clearTimeout(t)
  }, [refreshPet, refreshProgress])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#02140D' }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green[500]}
            colors={[colors.green[500]]}
            progressBackgroundColor="#031A11"
          />
        }
      >
        {/* Hero */}
        <LinearGradient
          colors={['#0D5B33', '#10261B', '#02140D']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
        >
          {/* Header row */}
          <FadeInSection delay={0}>
            <View className="flex-row items-center gap-2 mb-6">
              <Sprout size={18} color={colors.green[500]} />
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: fonts.sansBold,
                  color: colors.text.primary,
                }}
              >
                Seu Broto
              </Text>
            </View>
          </FadeInSection>

          {/* Broto avatar + fireflies */}
          <ScaleIn delay={100}>
            <View style={{ alignItems: 'center', position: 'relative' }}>
              <FireflyBackground count={7} />
              <View
                className="h-28 w-28 items-center justify-center rounded-3xl mb-4"
                style={{
                  backgroundColor: colors.green.glow,
                  borderWidth: 1,
                  borderColor: colors.border.strong,
                }}
              >
                <Text style={{ fontSize: 56 }}>{loadingPet ? '...' : FASE_EMOJI[fase]}</Text>
              </View>

              <Text
                style={{
                  fontSize: 20,
                  fontFamily: fonts.sansBold,
                  color: colors.text.primary,
                }}
              >
                {loadingPet ? '...' : FASE_LABEL[fase]}
              </Text>
              <View
                className="mt-1.5 rounded-full px-3 py-1"
                style={{
                  backgroundColor: colors.gold.glow,
                  borderWidth: 1,
                  borderColor: 'rgba(251,191,36,0.15)',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sansBold,
                    color: colors.gold[300],
                  }}
                >
                  Nivel {nivel}
                </Text>
              </View>

              {/* XP bar */}
              <View className="mt-4 w-full" style={{ maxWidth: 260 }}>
                <AnimatedBar
                  progress={loadingPet ? 0 : xpProgress}
                  color={colors.gold[400]}
                  bgColor="rgba(0,0,0,0.3)"
                  height={10}
                  delay={500}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sans,
                    color: colors.text.muted,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  {loadingPet ? '...' : `${xpProgress}/100 XP`}
                </Text>
              </View>

              {!loadingPet && (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sans,
                    color: colors.text.secondary,
                    textAlign: 'center',
                    marginTop: 10,
                    lineHeight: 20,
                    maxWidth: 280,
                  }}
                >
                  {FASE_MSG[fase]}
                </Text>
              )}
            </View>
          </ScaleIn>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 20, paddingBottom: 32 }}>
          {/* Stats */}
          <FadeInSection delay={200}>
            <View className="flex-row gap-3">
              {[
                {
                  icon: Flame,
                  value: loadingPet ? '-' : streak,
                  label: 'streak',
                  iconColor: colors.gold[400],
                  bgColor: colors.gold.glow,
                },
                {
                  icon: PenLine,
                  value: loadingPet ? '-' : questoesHoje,
                  label: 'hoje',
                  iconColor: colors.green[500],
                  bgColor: colors.green.glow,
                },
                {
                  icon: Target,
                  value: loadingPet
                    ? '-'
                    : questoesHoje > 0
                      ? `${Math.round((acertosHoje / questoesHoje) * 100)}%`
                      : '—',
                  label: 'acerto',
                  iconColor: colors.green[500],
                  bgColor: colors.green.glow,
                },
              ].map(({ icon: Icon, value, label, iconColor, bgColor }) => (
                <View
                  key={label}
                  className="flex-1 items-center p-3"
                  style={{
                    borderRadius: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <View
                    className="h-7 w-7 items-center justify-center rounded-lg mb-1"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Icon size={14} color={iconColor} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: fonts.sansMedium,
                      color: colors.text.primary,
                    }}
                  >
                    {value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fonts.sansMedium,
                      color: colors.text.muted,
                      marginTop: 2,
                      textTransform: 'capitalize',
                    }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </FadeInSection>

          {/* CTA - alinhado ao botão da home */}
          <FadeInSection delay={240}>
            <Link href="/(tabs)/questions" asChild>
              <BrotoCtaButton
                title="ESTUDAR PARA CRESCER"
                rightIcon={<ArrowRight size={18} color={colors.cta.text} />}
              />
            </Link>
          </FadeInSection>

          {/* Focus areas */}
          {(mostrarFoco || mostrarIniciar) && (
            <FadeInSection delay={300}>
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <View
                    style={{
                      width: 3,
                      height: 14,
                      borderRadius: 1.5,
                      backgroundColor: colors.gold[400],
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: fonts.sansMedium,
                      color: colors.text.primary,
                    }}
                  >
                    {mostrarFoco ? 'Onde focar agora' : 'Por onde começar?'}
                  </Text>
                </View>
                <View className="gap-2">
                  {(mostrarFoco ? areasParaFocar : areasNaoIniciadas).map((a, i) => (
                    <StaggerItem key={a.value} index={i} baseDelay={420} stagger={60}>
                      <FocusCard area={a} />
                    </StaggerItem>
                  ))}
                </View>
              </View>
            </FadeInSection>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
