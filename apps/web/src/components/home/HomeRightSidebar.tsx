import { useMemo, useState, useEffect, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { Sprout, Zap } from 'lucide-react'
import {
  buildHomeTimelineEvents,
  buildFlashcardReviewCopy,
  FASE_EMOJI,
  FASE_LABEL,
  type HomeTimelineEvent,
} from '@broto/shared'
import type { DiaRotina } from '@/lib/routine'
import { buildDailyMissions } from '@/lib/build-daily-missions'
import { useDailyMissionsState } from '@/hooks/useDailyMissionsState'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { AREA_CONFIG } from '@/lib/area-config'
import { DailyStreakCard } from '@/components/progress/DailyStreakCard'
import { AchievementsCollapsible } from '@/components/progress/AchievementsCollapsible'
import { buildAchievementRows } from '@/lib/achievements'
import {
  getPerformanceDayMapSnapshot,
  getPerformanceDayMapServerSnapshot,
  subscribePerformanceHistory,
} from '@/lib/performance-history'

const DAILY_QUESTIONS_GOAL = 5

function statusLabel(s: HomeTimelineEvent['status']): string {
  if (s === 'done') return 'Concluído'
  if (s === 'in_progress') return 'Em andamento'
  return 'Próximo'
}

function nowMinutes(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function isActionableEvent(ev: HomeTimelineEvent): boolean {
  return ev.status !== 'done' && !ev.locked
}

export function HomeRightSidebar({
  diaHoje,
  horasPorDia,
}: {
  diaHoje: DiaRotina | undefined
  horasPorDia: number
}) {
  const [showAllMissions, setShowAllMissions] = useState(false)
  const [tick, setTick] = useState(0)

  const { daily } = useDailyMissionsState()
  const { progress } = useProgress()
  const { pet, loading: loadingPet } = usePet()

  const performanceDayMap = useSyncExternalStore(
    subscribePerformanceHistory,
    getPerformanceDayMapSnapshot,
    getPerformanceDayMapServerSnapshot,
  )

  const achievements = useMemo(
    () =>
      buildAchievementRows(progress?.totalAnswered ?? 0, progress?.accuracyPct ?? 0),
    [progress?.totalAnswered, progress?.accuracyPct],
  )

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const questoesHoje = pet?.questoesHoje ?? 0

  const missions = useMemo(
    () => buildDailyMissions(progress?.areas, daily, pet?.studyTodayByArea),
    [progress?.areas, daily, pet?.studyTodayByArea],
  )

  const review = useMemo(() => buildFlashcardReviewCopy(progress?.areas), [progress?.areas])

  const timelineEvents = useMemo(() => {
    void tick
    const petFase = pet?.fase ?? 'semente'
    return buildHomeTimelineEvents({
      dayStartHour: 8,
      horasPorDia,
      questoesHoje,
      dailyQuestionsGoal: DAILY_QUESTIONS_GOAL,
      dia: diaHoje
        ? {
            ehDescanso: diaHoje.ehDescanso,
            areaLabel: diaHoje.area?.label ?? null,
            areaSlug: diaHoje.area?.value ?? null,
            duracaoMin: diaHoje.duracaoMin,
          }
        : null,
      missions: missions.map((m) => ({
        title: m.title,
        subtitle: m.subtitle,
        done: m.done,
        locked: m.locked,
        areaSlug: m.areaKey,
        xpTotal: m.xp,
      })),
      review,
      pet: { faseLabel: FASE_LABEL[petFase], streak: pet?.streak ?? 0 },
      nowMinutes: nowMinutes(),
    })
  }, [diaHoje, horasPorDia, questoesHoje, missions, review, pet?.fase, pet?.streak, tick])

  const listNow = nowMinutes()

  const longDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const activeEventId =
    timelineEvents.find((e) => listNow >= e.startMinutes && listNow < e.endMinutes)?.id ?? null
  const visibleEvents = showAllMissions ? timelineEvents : timelineEvents.slice(0, 3)
  const firstAvailableId = timelineEvents.find(isActionableEvent)?.id ?? null
  const hiddenCount = Math.max(0, timelineEvents.length - visibleEvents.length)
  const petFase = pet?.fase ?? 'semente'
  const xpInLevel = pet ? pet.xp % 100 : 0

  return (
    <aside
      className="broto-home-right-sidebar"
      aria-label="Sequência, missões de hoje e conquistas"
    >
      <DailyStreakCard
        streak={pet?.streak ?? 0}
        questoesHoje={questoesHoje}
        loading={loadingPet}
        performanceDayMap={performanceDayMap}
      />

      <div
        id="home-missoes-hoje"
        className="broto-home-rail__block broto-home-rail__block--timeline broto-home-missoes-anchor"
      >
        <div className="broto-home-tl__head">
          <div>
            <h2 className="broto-home-tl__title">Missões de hoje</h2>
            <p className="broto-home-tl__date">{longDate}</p>
          </div>
          <span
            className="broto-home-tl__broto-chip"
            aria-label={`Energia do Broto: ${xpInLevel} de 100`}
          >
            <span aria-hidden>{FASE_EMOJI[petFase]}</span>
            <span>{xpInLevel}/100</span>
          </span>
        </div>

        <div className="broto-home-tl__viewport">
          <ul className="broto-home-tl__list broto-home-tl__list--actions">
            {visibleEvents.map((ev) => (
              <TimelineRow
                key={ev.id}
                ev={ev}
                isActive={ev.id === activeEventId}
                isNext={ev.id === firstAvailableId}
              />
            ))}
          </ul>
          {timelineEvents.length > 3 ? (
            <button
              type="button"
              className="broto-home-tl__show-more"
              onClick={() => setShowAllMissions((v) => !v)}
              aria-expanded={showAllMissions}
            >
              {showAllMissions
                ? 'Mostrar menos'
                : `Ver todas as missões${hiddenCount ? ` (+${hiddenCount})` : ''}`}
            </button>
          ) : null}
        </div>
      </div>

      <AchievementsCollapsible achievements={achievements} initialVisible={4} />
    </aside>
  )
}

function TimelineRow({
  ev,
  isActive,
  isNext,
}: {
  ev: HomeTimelineEvent
  isActive: boolean
  isNext: boolean
}) {
  const areaConf = ev.areaSlug ? AREA_CONFIG[ev.areaSlug] : null
  const accentColor = areaConf?.color ?? 'var(--green-400)'
  const Icon = ev.kind === 'pet' ? Sprout : (areaConf?.icon ?? null)
  const growthPct = ev.status === 'done' ? 100 : ev.status === 'in_progress' ? 68 : isNext ? 42 : 10
  const showStatusBadge = ev.status !== 'pending' || isNext
  const subtitle = ev.locked ? 'Complete a missão anterior para liberar' : ev.subtitle

  return (
    <li
      className={`broto-home-tl__row${isActive ? ' broto-home-tl__row--active' : ''}${isNext ? ' broto-home-tl__row--next' : ''}${ev.status === 'done' ? ' broto-home-tl__row--done' : ''}`}
    >
      <article
        className={`broto-home-tl__card${isActive || isNext ? ' broto-home-tl__card--current' : ''}${!isNext && ev.status === 'pending' ? ' broto-home-tl__card--future' : ''}${ev.status === 'done' ? ' broto-home-tl__card--done' : ''}`}
        style={{ '--tl-accent': accentColor } as CSSProperties}
      >
        <span className="broto-home-tl__accent-bar" aria-hidden />
        <span className="broto-home-tl__icon" aria-hidden>
          {Icon ? (
            <Icon size={16} />
          ) : (
            <span className="broto-home-tl__icon-fallback">{ev.iconEmoji}</span>
          )}
        </span>
        <div className="broto-home-tl__card-body">
          <div className="broto-home-tl__card-title-row">
            <h3 className="broto-home-tl__card-title">{ev.title}</h3>
            {ev.kind === 'mission' && ev.xpTotal != null && !ev.locked ? (
              <span
                className={`broto-home-tl__xp-total-badge${ev.status === 'done' ? ' broto-home-tl__xp-total-badge--done' : ''}`}
                aria-label={`Até ${ev.xpTotal} XP nesta missão`}
              >
                <Zap
                  size={12}
                  strokeWidth={2.5}
                  className="broto-home-tl__xp-total-badge__icon"
                  aria-hidden
                />
                <span className="broto-home-tl__xp-total-badge__val">{ev.xpTotal} XP</span>
              </span>
            ) : null}
          </div>
          <p className="broto-home-tl__card-sub">{subtitle}</p>
          <div className="broto-home-tl__growth">
            <span className="broto-home-tl__growth-label">
              <Sprout size={11} aria-hidden />
              {ev.status === 'done' ? 'Broto cresceu' : ev.locked ? 'Em breve' : 'Energia do Broto'}
            </span>
            <span
              className="broto-home-tl__growth-track"
              role="progressbar"
              aria-label={`Crescimento do Broto nesta missão: ${growthPct}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={growthPct}
            >
              <span className="broto-home-tl__growth-fill" style={{ width: `${growthPct}%` }} />
            </span>
          </div>
          <div className="broto-home-tl__card-footer">
            {showStatusBadge ? (
              <span className={`broto-home-tl__badge broto-home-tl__badge--${ev.status}`}>
                {statusLabel(ev.status)}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  )
}
