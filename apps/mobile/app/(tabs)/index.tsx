import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  findNodeHandle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { Flame, BookOpen, Target, ClipboardList } from 'lucide-react-native'
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'
import { useProgress } from '@/hooks/useProgress'
import { useUser } from '@/hooks/useUser'
import { HeaderAuth } from '@/components/HeaderAuth'
import { BrotoLogo } from '@/components/BrotoLogo'
import { AREA_CONFIG } from '@/theme/area-config'
import { colors, fonts, radii, space } from '@/theme/tokens'
import { AnimatedBar, FadeInSection } from '@/components/AnimatedEntry'
import { getDailyMissionsState, type DailyMissionsState } from '@/lib/missions/daily-missions'
import { HomeScheduleRail } from '@/components/home/HomeScheduleRail'

const DEFAULT_AREAS = ['matematica', 'linguagens', 'ciencias-humanas']

// ─── Static constants (outside component to avoid re-creation) ───────────────
const HERO_GRADIENT = ['#0D5B33', '#10261B'] as const
const HERO_LOCATIONS = [0, 0.8] as const
const DIVIDER_GRADIENT = [
  'rgba(255, 255, 255, 0)',
  'rgba(204, 204, 204, 0.4)',
  'rgba(153, 153, 153, 0)',
] as const
const DIVIDER_LOCATIONS = [0, 0.5, 1] as const
const DIVIDER_START: [number, number] = [0, 0.5]
const DIVIDER_END: [number, number] = [1, 0.5]
const dividerStyle = {
  width: '100%' as const,
  height: 1,
  borderRadius: 10,
  marginBottom: 16,
}

// ─── Stats pill config (stable reference) ────────────────────────────────────
const STAT_ICONS = [
  { key: 'streak', Icon: Flame, iconColor: colors.gold[400] },
  { key: 'hoje', Icon: BookOpen, iconColor: colors.blue[400] },
  { key: 'acerto', Icon: Target, iconColor: colors.green[400] },
] as const

interface Mission {
  title: string
  subtitle: string
  xp: number
  areaKey: string
  done: boolean
  locked: boolean
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const scrollContentRef = useRef<View>(null)
  const missionsAnchorRef = useRef<View>(null)
  const { pet, loading, refresh: refreshPet } = usePet()
  const { progress, refresh: refreshProgress } = useProgress()
  const { user } = useUser()
  const [refreshing, setRefreshing] = useState(false)
  const [daily, setDaily] = useState<DailyMissionsState | null>(null)
  const [dailyMissionsError, setDailyMissionsError] = useState<string | null>(null)

  const scrollToMissionsHoje = useCallback(() => {
    const contentNode = scrollContentRef.current ? findNodeHandle(scrollContentRef.current) : null
    const anchor = missionsAnchorRef.current
    if (contentNode == null || anchor == null) return
    anchor.measureLayout(
      contentNode,
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true })
      },
      () => {},
    )
  }, [])

  const xp = pet?.xp ?? 0
  const xpInLevel = xp % 100
  const nivel = pet?.nivel ?? 1
  const fase = pet?.fase ?? 'semente'
  const streak = pet?.streak ?? 0
  const questoesHoje = pet?.questoesHoje ?? 0
  const acertosHoje = pet?.acertosHoje ?? 0
  const accuracyPct = questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : 0

  const displayName = useMemo(() => {
    const raw = user?.nome?.trim()
    if (!raw) return null
    const first = raw.split(/\s+/)[0]
    return first || raw
  }, [user?.nome])

  useEffect(() => {
    let alive = true
    setDailyMissionsError(null)
    getDailyMissionsState()
      .then((state) => {
        if (alive) {
          setDaily(state)
          setDailyMissionsError(null)
        }
      })
      .catch((err) => {
        if (alive) {
          setDailyMissionsError(
            err instanceof Error ? err.message : 'Erro ao carregar missões do dia',
          )
        }
      })
    return () => {
      alive = false
    }
  }, [pet?.questoesHoje, pet?.acertosHoje])

  // Derive missions from progress (worst areas first) — memoized
  const missions = useMemo(() => {
    const sortedAreas = progress?.areas
      ? [...progress.areas]
          .filter((a) => a.totalAnswered >= 1)
          .sort((a, b) => a.accuracyPct - b.accuracyPct)
          .map((a) => a.value)
      : []
    const missionAreas = [
      sortedAreas[0] ?? DEFAULT_AREAS[0],
      sortedAreas[1] ?? DEFAULT_AREAS[1],
      sortedAreas[2] ?? DEFAULT_AREAS[2],
    ]

    const areaLabel = (key: string) => AREA_CONFIG[key]?.label ?? 'Questões'

    const areaAnswered = (key: string) => daily?.byArea?.[key]?.answered ?? 0
    const areaCorrect = (key: string) => daily?.byArea?.[key]?.correct ?? 0
    const areaAccuracy = (key: string) => {
      const a = areaAnswered(key)
      if (a === 0) return null
      return Math.round((areaCorrect(key) / a) * 100)
    }

    return [
      {
        title: `5 questões de ${areaLabel(missionAreas[0])}`,
        subtitle: 'Area com maior oportunidade',
        xp: 30,
        areaKey: missionAreas[0],
        done: areaAnswered(missionAreas[0]) >= 5,
        locked: false,
      },
      {
        title: `5 questões de ${areaLabel(missionAreas[1])}`,
        subtitle: 'Continue progredindo',
        xp: 20,
        areaKey: missionAreas[1],
        done: areaAnswered(missionAreas[1]) >= 5,
        locked: areaAnswered(missionAreas[0]) < 5,
      },
      {
        title: 'Atingir 70% de acerto',
        subtitle: `Acerto atual: ${areaAccuracy(missionAreas[2]) !== null ? areaAccuracy(missionAreas[2]) + '%' : '\u2014'}`,
        xp: 50,
        areaKey: missionAreas[2],
        done: areaAnswered(missionAreas[2]) >= 5 && (areaAccuracy(missionAreas[2]) ?? 0) >= 70,
        locked: areaAnswered(missionAreas[2]) < 5,
      },
    ] satisfies Mission[]
  }, [progress?.areas, daily])

  const scheduleFocus = useMemo(() => {
    const areas = progress?.areas?.length ? progress.areas : []
    const ordered = [...areas].sort((a, b) => {
      if (a.totalAnswered === 0 && b.totalAnswered === 0) return 0
      if (a.totalAnswered === 0) return 1
      if (b.totalAnswered === 0) return -1
      return a.accuracyPct - b.accuracyPct
    })
    const area = ordered[0]
    return {
      ehDescanso: false,
      areaLabel: area?.label ?? null,
      areaSlug: area?.value ?? null,
      duracaoMin: (user?.horasDisponiveisPorDia ?? 2) * 60,
    }
  }, [progress?.areas, user?.horasDisponiveisPorDia])

  const missionTimeline = useMemo(
    () =>
      missions.map((m) => ({
        title: m.title,
        subtitle: m.subtitle,
        done: m.done,
        locked: m.locked,
        areaSlug: m.areaKey,
        xpTotal: m.xp,
      })),
    [missions],
  )

  const onRefresh = useCallback(() => {
    if (refreshing) return
    setRefreshing(true)
    refreshPet()
    refreshProgress()
    getDailyMissionsState()
      .then((s) => {
        setDaily(s)
        setDailyMissionsError(null)
      })
      .catch((err) => {
        setDailyMissionsError(
          err instanceof Error ? err.message : 'Erro ao carregar missões do dia',
        )
      })
    const t = setTimeout(() => setRefreshing(false), 800)
    return () => clearTimeout(t)
  }, [refreshPet, refreshProgress])

  // Stats values — memoized
  const statsValues = useMemo(
    () => [
      { label: 'Sequencia', value: loading ? '\u2014' : `${streak} dias` },
      { label: 'Hoje', value: loading ? '\u2014' : `${questoesHoje} quest.` },
      { label: 'Acerto', value: loading || questoesHoje === 0 ? '\u2014' : `${accuracyPct}%` },
    ],
    [loading, streak, questoesHoje, accuracyPct],
  )

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
        <BrotoLogo size="header" />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {streak > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 12,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: colors.gold.glow,
                borderWidth: 1,
                borderColor: 'rgba(251,191,36,0.18)',
              }}
            >
              <View style={{ marginRight: 4 }}>
                <Flame size={12} color={colors.gold[400]} />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.sansBold,
                  color: colors.gold[300],
                }}
              >
                {streak}
              </Text>
            </View>
          )}
          <HeaderAuth />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsHorizontalScrollIndicator={false}
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        <View ref={scrollContentRef} collapsable={false}>
        {/* ── Greeting ── */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <FadeInSection delay={0}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fonts.sans,
                color: colors.text.secondary,
                letterSpacing: 0.3,
              }}
            >
              {displayName ? `Bem vindo de volta, ${displayName}` : 'Bem vindo de volta'}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontFamily: fonts.sansMedium,
                color: colors.text.primary,
                marginTop: 4,
              }}
            >
              Bora estudar?
            </Text>
          </FadeInSection>
        </View>

        {/* ── Pet hero card ── */}
        <View style={{ width: '100%', marginBottom: 24 }}>
          <FadeInSection delay={100}>
            <View
              style={{
                width: '100%',
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.18)',
              }}
            >
              <LinearGradient
                colors={HERO_GRADIENT}
                locations={HERO_LOCATIONS}
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
                {/* Pet + info */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Emoji avatar (circular) */}
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.06)',
                        zIndex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 40 }}>{FASE_EMOJI[fase]}</Text>
                    </View>

                    {/* Level badge — floats below emoji */}
                    <View
                      style={{
                        marginTop: -14,
                        zIndex: 2,
                        borderRadius: 24,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor: 'rgba(160, 148, 15, 0.12)',
                        borderWidth: 1,
                        borderColor: 'rgba(223, 204, 0, 0.5)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fonts.sansBold,
                          color: 'rgba(223, 204, 0, 0.9)',
                        }}
                      >
                        Nv. {nivel}
                      </Text>
                    </View>
                  </View>

                  {/* Phase + XP */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: fonts.sans,
                        color: '#BBBBBB',
                        textTransform: 'uppercase',
                        letterSpacing: 0,
                        marginBottom: 4,
                      }}
                    >
                      Seu Broto
                    </Text>
                    {loading ? (
                      <View
                        style={{
                          height: 24,
                          width: 110,
                          borderRadius: 6,
                          backgroundColor: colors.bg.elevated,
                          marginBottom: 4,
                        }}
                      />
                    ) : (
                      <Text
                        style={{
                          fontSize: 26,
                          fontFamily: fonts.sansMedium,
                          color: colors.text.primary,
                          marginBottom: 4,
                        }}
                      >
                        {FASE_LABEL[fase]}
                      </Text>
                    )}

                    <View style={{ marginTop: 8 }}>
                      <View
                        style={{
                          boxShadow: '0px 0px 6px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <AnimatedBar
                          progress={loading ? 0 : (xpInLevel / 100) * 100}
                          color={colors.cta.gradientEnd}
                          bgColor="rgba(0,0,0,0.3)"
                          height={10}
                          delay={500}
                        />
                      </View>
                      <View style={{ marginTop: 6 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: fonts.sans,
                            color: '#BBBBBB',
                          }}
                        >
                          {loading ? '\u2026' : `${xpInLevel} / 100 XP`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stats strip */}
                <View style={{ marginTop: 20 }}>
                  <LinearGradient
                    colors={DIVIDER_GRADIENT}
                    locations={DIVIDER_LOCATIONS}
                    start={DIVIDER_START}
                    end={DIVIDER_END}
                    style={dividerStyle}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {STAT_ICONS.slice(0, 2).map(({ key, Icon, iconColor }, i) => (
                      <View
                        key={key}
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
                        <Text
                          style={{
                            fontSize: statsValues[i].label === 'Sequencia' ? 14 : 15,
                            fontFamily: fonts.sansMedium,
                            color: colors.text.primary,
                          }}
                        >
                          {statsValues[i].value}
                        </Text>
                        <Text
                          style={{
                            fontSize: statsValues[i].label === 'Sequencia' ? 10 : 11,
                            fontFamily: fonts.sansMedium,
                            color: colors.text.muted,
                            marginTop: 2,
                          }}
                        >
                          {statsValues[i].label}
                        </Text>
                      </View>
                    ))}
                    <View style={{ flex: 1 }}>
                      <Pressable
                        onPress={scrollToMissionsHoje}
                        accessibilityRole="button"
                        accessibilityLabel="Ir para missões de hoje"
                        style={({ pressed }) => ({
                          marginBottom: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 7,
                          paddingHorizontal: 8,
                          borderRadius: radii.sm,
                          backgroundColor: pressed
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(16, 185, 129, 0.12)',
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                        })}
                      >
                        <ClipboardList size={14} color={colors.green[400]} />
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: fonts.sansBold,
                            color: colors.green[400],
                          }}
                          numberOfLines={1}
                        >
                          Missões de hoje
                        </Text>
                      </Pressable>
                      <View
                        style={{
                          alignItems: 'center',
                          paddingVertical: 8,
                          borderRadius: radii.sm,
                          backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        <View style={{ marginBottom: 4 }}>
                          <Target size={16} color={STAT_ICONS[2].iconColor} />
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: fonts.sansMedium,
                            color: colors.text.primary,
                          }}
                        >
                          {statsValues[2].value}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: fonts.sansMedium,
                            color: colors.text.muted,
                            marginTop: 2,
                          }}
                        >
                          {statsValues[2].label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </FadeInSection>
        </View>

        {dailyMissionsError ? (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(180, 40, 40, 0.2)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(255,100,100,0.4)',
            }}
          >
            <Text style={{ color: '#ffb4b4', fontSize: 13, textAlign: 'center' }}>
              {dailyMissionsError}
            </Text>
          </View>
        ) : null}

        <HomeScheduleRail
          horasPorDia={user?.horasDisponiveisPorDia ?? 2}
          questoesHoje={questoesHoje}
          pet={pet ?? null}
          missionItems={missionTimeline}
          focusDia={scheduleFocus}
          progressAreas={progress?.areas}
          missionsAnchorRef={missionsAnchorRef}
        />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
