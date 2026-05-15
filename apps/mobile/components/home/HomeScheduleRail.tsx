import { useCallback, useMemo, useState, useEffect, type RefObject } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react-native'
import {
    buildHomeTimelineEvents,
    buildFlashcardReviewCopy,
    filterHomeTimelineEvents,
    FASE_LABEL,
    type HomeTimelineFilter,
    type HomeTimelineEvent,
    type PetData,
} from '@broto/shared'
import type { AreaStat } from '@/hooks/useProgress'
import { colors, fonts, radii, space } from '@/theme/tokens'
import { useStudyActivityDays, localDayKey } from '@/hooks/use-study-activity-days'
import { FadeInSection } from '@/components/AnimatedEntry'

const DAILY_GOAL = 5

const MESES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
] as const

const WEEKDAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const

const FILTERS: { key: HomeTimelineFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'study', label: 'Estudo' },
    { key: 'missions', label: 'Missões' },
    { key: 'review', label: 'Revisão' },
]

function formatClock(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatMinutesRange(start: number, end: number): string {
    return `${formatClock(start)} – ${formatClock(end)}`
}

function monthTitle(y: number, m: number): string {
    const raw = MESES[m] ?? ''
    const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : ''
    return `${label} ${y}`
}

function calendarCells(year: number, monthIndex: number): Array<number | null> {
    const first = new Date(year, monthIndex, 1)
    const pad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cells: Array<number | null> = []
    for (let i = 0; i < pad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
}

function nowMinutes(): number {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
}

function statusLabel(s: HomeTimelineEvent['status']): string {
    if (s === 'done') return 'Concluído'
    if (s === 'in_progress') return 'Em andamento'
    return 'Pendente'
}

export function HomeScheduleRail({
    horasPorDia,
    questoesHoje,
    pet,
    missionItems,
    focusDia,
    progressAreas,
    missionsAnchorRef,
}: {
    horasPorDia: number
    questoesHoje: number
    pet: PetData | null
    missionItems: {
        title: string
        subtitle: string
        done: boolean
        locked: boolean
        areaSlug?: string
        xpTotal?: number
    }[]
    focusDia: {
        ehDescanso: boolean
        areaLabel: string | null
        areaSlug: string | null
        duracaoMin: number
    } | null
    progressAreas: AreaStat[] | undefined
    missionsAnchorRef?: RefObject<View | null>
}) {
    const router = useRouter()
    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [filter, setFilter] = useState<HomeTimelineFilter>('all')
    const [tick, setTick] = useState(0)

    const { keys: activityKeys, loading: loadingActivity } = useStudyActivityDays(viewYear, viewMonth)

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000)
        return () => clearInterval(id)
    }, [])

    const review = useMemo(() => buildFlashcardReviewCopy(progressAreas), [progressAreas])

    const timelineEvents = useMemo(() => {
        void tick
        const petFase = pet?.fase ?? 'semente'
        return buildHomeTimelineEvents({
            dayStartHour: 8,
            horasPorDia,
            questoesHoje,
            dailyQuestionsGoal: DAILY_GOAL,
            dia: focusDia,
            missions: missionItems,
            review,
            pet: { faseLabel: FASE_LABEL[petFase], streak: pet?.streak ?? 0 },
            nowMinutes: nowMinutes(),
        })
    }, [horasPorDia, questoesHoje, missionItems, review, pet?.fase, pet?.streak, focusDia, tick])

    const filtered = useMemo(
        () => filterHomeTimelineEvents(timelineEvents, filter),
        [timelineEvents, filter],
    )

    const listItems = useMemo(() => {
        void tick
        const now = nowMinutes()
        const items: Array<{ type: 'now' } | { type: 'ev'; ev: HomeTimelineEvent }> = []
        let inserted = false
        for (const ev of filtered) {
            if (!inserted && ev.startMinutes > now) {
                items.push({ type: 'now' })
                inserted = true
            }
            items.push({ type: 'ev', ev })
        }
        if (!inserted) items.push({ type: 'now' })
        return items
    }, [filtered, tick])

    const activeId = useMemo(() => {
        const now = nowMinutes()
        const hit = timelineEvents.find((e) => now >= e.startMinutes && now < e.endMinutes)
        return hit?.id ?? null
    }, [timelineEvents, tick])

    const goPrevMonth = useCallback(() => {
        setViewMonth((m) => {
            if (m === 0) {
                setViewYear((y) => y - 1)
                return 11
            }
            return m - 1
        })
    }, [])

    const goNextMonth = useCallback(() => {
        setViewMonth((m) => {
            if (m === 11) {
                setViewYear((y) => y + 1)
                return 0
            }
            return m + 1
        })
    }, [])

    const cells = useMemo(() => calendarCells(viewYear, viewMonth), [viewYear, viewMonth])
    const todayY = today.getFullYear()
    const todayM = today.getMonth()
    const todayD = today.getDate()

    const longDate = useMemo(
        () =>
            new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(today),
        [],
    )

    return (
        <FadeInSection delay={320}>
            <View style={{ width: '100%', marginTop: space[8], marginBottom: space[6] }}>
                {/* Missões de hoje — logo abaixo do card do Broto na Home */}
                <View
                    ref={missionsAnchorRef}
                    collapsable={false}
                    style={{
                        backgroundColor: colors.bg.card,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        padding: space[4],
                        marginBottom: space[4],
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: space[4],
                            gap: space[2],
                        }}
                    >
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                style={{
                                    fontSize: 17,
                                    fontFamily: fonts.sansSemiBold,
                                    color: colors.text.primary,
                                }}
                            >
                                Missões de hoje
                            </Text>
                            <Text
                                style={{
                                    marginTop: 4,
                                    fontSize: 12,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                    textTransform: 'capitalize',
                                }}
                            >
                                {longDate}
                            </Text>
                        </View>
                    </View>

                    <ScrollFilterRow filter={filter} onChange={setFilter} />

                    <View style={{ marginTop: space[3] }}>
                        {listItems.map((item, idx) =>
                            item.type === 'now' ? (
                                <View
                                    key={`now-${idx}`}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        marginVertical: 6,
                                    }}
                                >
                                    <View
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            borderRadius: 999,
                                            backgroundColor: 'rgba(16,185,129,0.18)',
                                            borderWidth: 1,
                                            borderColor: 'rgba(16,185,129,0.45)',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                fontFamily: fonts.sansBold,
                                                color: colors.green[400],
                                            }}
                                        >
                                            {formatClock(nowMinutes())}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            borderTopWidth: 1,
                                            borderStyle: 'dashed',
                                            borderColor: colors.border.subtle,
                                        }}
                                    />
                                </View>
                            ) : (
                                <TimelineCard
                                    key={item.ev.id}
                                    ev={item.ev}
                                    isActive={item.ev.id === activeId}
                                />
                            ),
                        )}
                    </View>
                </View>

                <Text
                    style={{
                        fontSize: 12,
                        fontFamily: fonts.sansSemiBold,
                        color: colors.text.muted,
                        letterSpacing: 0.8,
                        marginBottom: space[3],
                        textTransform: 'uppercase',
                    }}
                >
                    Agenda
                </Text>

                {/* Calendário */}
                <View
                    style={{
                        backgroundColor: colors.bg.card,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        padding: space[4],
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: space[3],
                        }}
                    >
                        <Pressable
                            onPress={goPrevMonth}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.border.subtle,
                                backgroundColor: colors.bg.elevated,
                            }}
                            accessibilityLabel="Mês anterior"
                        >
                            <ChevronLeft size={20} color={colors.text.secondary} />
                        </Pressable>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.primary,
                            }}
                        >
                            {monthTitle(viewYear, viewMonth)}
                        </Text>
                        <Pressable
                            onPress={goNextMonth}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.border.subtle,
                                backgroundColor: colors.bg.elevated,
                            }}
                            accessibilityLabel="Próximo mês"
                        >
                            <ChevronRight size={20} color={colors.text.secondary} />
                        </Pressable>
                    </View>

                    <View style={{ opacity: 1 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                marginBottom: 6,
                            }}
                        >
                            {WEEKDAY_LABELS.map((w) => (
                                <View key={w} style={{ width: `${100 / 7}%` as const, alignItems: 'center' }}>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontFamily: fonts.sansSemiBold,
                                            color: colors.text.muted,
                                        }}
                                    >
                                        {w}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {cells.map((d, i) => {
                                if (d === null) {
                                    return (
                                        <View
                                            key={`e-${i}`}
                                            style={{ width: `${100 / 7}%` as const, height: 40 }}
                                        />
                                    )
                                }
                                const isToday = viewYear === todayY && viewMonth === todayM && d === todayD
                                const k = localDayKey(viewYear, viewMonth, d)
                                const hasDot = !loadingActivity && activityKeys.has(k)
                                return (
                                    <View
                                        key={k}
                                        style={{
                                            width: `${100 / 7}%` as const,
                                            alignItems: 'center',
                                            paddingVertical: 4,
                                        }}
                                    >
                                        <View
                                            style={
                                                isToday
                                                    ? {
                                                          minWidth: 28,
                                                          height: 28,
                                                          paddingHorizontal: 6,
                                                          borderRadius: radii.sm,
                                                          backgroundColor: 'rgba(98, 189, 105, 0.22)',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontFamily: fonts.sansSemiBold,
                                                    color: isToday ? colors.cta.gradientEnd : colors.text.primary,
                                                }}
                                            >
                                                {d}
                                            </Text>
                                        </View>
                                        {hasDot ? (
                                            <View
                                                style={{
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    marginTop: 4,
                                                    backgroundColor: isToday
                                                        ? colors.cta.gradientEnd
                                                        : colors.text.muted,
                                                    opacity: 0.85,
                                                }}
                                            />
                                        ) : (
                                            <View style={{ height: 8 }} />
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    <Text
                        style={{
                            marginTop: space[2],
                            fontSize: 11,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            lineHeight: 16,
                        }}
                    >
                        {loadingActivity
                            ? 'Carregando dias ativos…'
                            : 'Pontos indicam dias com respostas registradas.'}
                    </Text>

                    <Pressable
                        onPress={() => router.push('/(tabs)/questions')}
                        style={{
                            marginTop: space[4],
                            backgroundColor: colors.text.primary,
                            paddingVertical: 12,
                            borderRadius: 999,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.bg.void,
                            }}
                        >
                            Adicionar meta
                        </Text>
                    </Pressable>
                </View>
            </View>
        </FadeInSection>
    )
}

function ScrollFilterRow({
    filter,
    onChange,
}: {
    filter: HomeTimelineFilter
    onChange: (f: HomeTimelineFilter) => void
}) {
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FILTERS.map(({ key, label }) => {
                const on = filter === key
                return (
                    <Pressable
                        key={key}
                        onPress={() => onChange(key)}
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: on ? colors.green[500] : colors.border.subtle,
                            backgroundColor: on ? 'rgba(16,185,129,0.12)' : colors.bg.elevated,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: on ? colors.green[400] : colors.text.muted,
                            }}
                        >
                            {label}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

function TimelineCard({ ev, isActive }: { ev: HomeTimelineEvent; isActive: boolean }) {
    const range = formatMinutesRange(ev.startMinutes, ev.endMinutes)
    const startLabel = formatClock(ev.startMinutes)

    const badgeBg =
        ev.status === 'done'
            ? 'rgba(34,197,94,0.2)'
            : ev.status === 'in_progress'
              ? 'rgba(234,179,8,0.2)'
              : 'rgba(148,163,184,0.25)'
    const badgeColor =
        ev.status === 'done'
            ? colors.green[400]
            : ev.status === 'in_progress'
              ? '#eab308'
              : colors.text.muted

    return (
        <View
            style={{
                flexDirection: 'row',
                gap: 10,
                marginBottom: 12,
                alignItems: 'flex-start',
            }}
        >
            <Text
                style={{
                    width: 44,
                    paddingTop: 10,
                    fontSize: 11,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.text.muted,
                    textAlign: 'right',
                }}
            >
                {startLabel}
            </Text>
            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: colors.bg.elevated,
                    borderWidth: 1,
                    borderColor: isActive ? colors.green[500] : colors.border.subtle,
                }}
            >
                <Text style={{ fontSize: 20, lineHeight: 22 }}>{ev.iconEmoji}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 8,
                        }}
                    >
                        <Text
                            style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 13,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.primary,
                                lineHeight: 18,
                            }}
                        >
                            {ev.title}
                        </Text>
                        {ev.kind === 'mission' && ev.xpTotal != null ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    flexShrink: 0,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor:
                                        ev.status === 'done'
                                            ? 'rgba(34,197,94,0.32)'
                                            : 'rgba(223,204,0,0.35)',
                                    backgroundColor:
                                        ev.status === 'done'
                                            ? 'rgba(34,197,94,0.14)'
                                            : 'rgba(223,204,0,0.12)',
                                }}
                                accessibilityLabel={`Até ${ev.xpTotal} XP nesta missão`}
                            >
                                <Zap
                                    size={12}
                                    color={ev.status === 'done' ? colors.green[400] : colors.gold[400]}
                                />
                                <Text
                                    style={{
                                        fontSize: 10,
                                        fontFamily: fonts.sansBold,
                                        color: ev.status === 'done' ? colors.green[400] : colors.gold[400],
                                    }}
                                >
                                    {ev.xpTotal} XP
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <Text
                        style={{
                            marginTop: 4,
                            fontSize: 12,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            lineHeight: 16,
                        }}
                    >
                        {ev.subtitle}
                    </Text>
                    <Text
                        style={{
                            marginTop: 8,
                            fontSize: 11,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                        }}
                    >
                        {range}
                    </Text>
                    <View
                        style={{
                            alignSelf: 'flex-start',
                            marginTop: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: badgeBg,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 9,
                                fontFamily: fonts.sansBold,
                                color: badgeColor,
                                textTransform: 'uppercase',
                            }}
                        >
                            {statusLabel(ev.status)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
