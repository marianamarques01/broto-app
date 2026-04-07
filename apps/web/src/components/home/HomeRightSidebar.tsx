import { useCallback, useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sprout, Zap } from 'lucide-react'
import {
  buildHomeTimelineEvents,
  buildFlashcardReviewCopy,
  filterHomeTimelineEvents,
  FASE_LABEL,
  type HomeTimelineFilter,
  type HomeTimelineEvent,
} from '@broto/shared'
import type { DiaRotina } from '@/lib/routine'
import { MESES } from '@/lib/routine'
import { buildDailyMissions } from '@/lib/build-daily-missions'
import { useDailyMissionsState } from '@/hooks/useDailyMissionsState'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { useStudyActivityDays, localDayKey } from '@/hooks/useStudyActivityDays'
import { AREA_CONFIG } from '@/lib/area-config'

const DAILY_QUESTIONS_GOAL = 3

const WEEKDAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const

function formatMinutesRange(start: number, end: number): string {
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

function formatClock(minutes: number): string {
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return fmt(minutes)
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

function statusLabel(s: HomeTimelineEvent['status']): string {
  if (s === 'done') return 'Concluído'
  if (s === 'in_progress') return 'Em andamento'
  return 'Pendente'
}

function nowMinutes(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

export function HomeRightSidebar({ diaHoje, horasPorDia }: { diaHoje: DiaRotina | undefined; horasPorDia: number }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [filter, setFilter] = useState<HomeTimelineFilter>('all')
  const [tick, setTick] = useState(0)

  const { keys: activityKeys, loading: loadingActivity } = useStudyActivityDays(viewYear, viewMonth)
  const { daily } = useDailyMissionsState()
  const { progress } = useProgress()
  const { pet } = usePet()

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const questoesHoje = pet?.questoesHoje ?? 0

  const missions = useMemo(() => buildDailyMissions(progress?.areas, daily), [progress?.areas, daily])

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

  const filtered = useMemo(
    () => filterHomeTimelineEvents(timelineEvents, filter),
                [timelineEvents, filter],
  )

  const listNow = nowMinutes()
  const listItems: Array<{ type: 'now' } | { type: 'ev'; ev: HomeTimelineEvent }> = []
  let insertedNowMarker = false
  for (const ev of filtered) {
    if (!insertedNowMarker && ev.startMinutes > listNow) {
      listItems.push({ type: 'now' })
      insertedNowMarker = true
    }
    listItems.push({ type: 'ev', ev })
  }
  if (!insertedNowMarker) listItems.push({ type: 'now' })

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

  const longDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const activeEventId =
    timelineEvents.find((e) => listNow >= e.startMinutes && listNow < e.endMinutes)?.id ?? null

  return (
    <aside className="broto-home-right-sidebar" aria-label="Calendário e missões de hoje">
      <div className="broto-home-rail__block broto-home-rail__block--calendar">
        <div className="broto-home-cal__nav">
          <button type="button" className="broto-home-cal__arrow" onClick={goPrevMonth} aria-label="Mês anterior">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <span className="broto-home-cal__title">{monthTitle(viewYear, viewMonth)}</span>
          <button type="button" className="broto-home-cal__arrow" onClick={goNextMonth} aria-label="Próximo mês">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <div className={`broto-home-cal broto-home-cal--transition`} key={`${viewYear}-${viewMonth}`}>
          <div className="broto-home-cal__weekdays" role="row">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="broto-home-cal__weekday" role="columnheader">
                {w}
              </span>
            ))}
          </div>
          <div className="broto-home-cal__grid" role="grid">
            {cells.map((d, i) => {
              if (d === null) {
                return <span key={`e-${i}`} className="broto-home-cal__cell broto-home-cal__cell--empty" />
              }
              const isToday = viewYear === todayY && viewMonth === todayM && d === todayD
              const k = localDayKey(viewYear, viewMonth, d)
              const hasDot = !loadingActivity && activityKeys.has(k)
              return (
                <div
                  key={k}
                  className={`broto-home-cal__cell${isToday ? ' broto-home-cal__cell--today' : ''}`}
                  role="gridcell"
                >
                  <span className="broto-home-cal__num">{d}</span>
                  {hasDot ? <span className="broto-home-cal__dot" aria-hidden /> : null}
                </div>
              )
            })}
          </div>
        </div>
        <p className="broto-home-cal__hint">
          {loadingActivity ? 'Carregando dias ativos…' : 'Pontos indicam dias com respostas registradas.'}
        </p>
        <Link to="/study" className="broto-home-cal__add-meta">
          Adicionar meta
        </Link>
      </div>

      <div className="broto-home-rail__block broto-home-rail__block--timeline">
        <div className="broto-home-tl__head">
          <div>
            <h2 className="broto-home-tl__title">Missões de hoje</h2>
            <p className="broto-home-tl__date">{longDate}</p>
          </div>
          <label className="broto-home-tl__filter-label">
            <span className="broto-sr-only">Filtrar eventos</span>
            <select
              className="broto-home-tl__select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as HomeTimelineFilter)}
            >
              <option value="all">Todos</option>
              <option value="study">Estudo</option>
              <option value="missions">Missões</option>
              <option value="review">Revisão</option>
            </select>
          </label>
        </div>

        <div className="broto-home-tl__viewport">
          <ul className={`broto-home-tl__list broto-home-tl__list--${filter}`}>
            {listItems.map((item, idx) =>
              item.type === 'now' ? (
                <li key={`now-${idx}`} className="broto-home-tl__now-split" aria-live="polite">
                  <span className="broto-home-tl__now-split-badge">{formatClock(listNow)}</span>
                  <span className="broto-home-tl__now-split-line" />
                </li>
              ) : (
                <TimelineRow key={item.ev.id} ev={item.ev} isActive={item.ev.id === activeEventId} />
              ),
            )}
          </ul>
        </div>
      </div>
    </aside>
  )
}

function TimelineRow({ ev, isActive }: { ev: HomeTimelineEvent; isActive: boolean }) {
  const timeStr = formatMinutesRange(ev.startMinutes, ev.endMinutes)
  const areaConf = ev.areaSlug ? AREA_CONFIG[ev.areaSlug] : null
  const accentColor = areaConf?.color ?? 'var(--green-400)'
  const Icon = ev.kind === 'pet' ? Sprout : areaConf?.icon ?? null

  return (
    <li className={`broto-home-tl__row${isActive ? ' broto-home-tl__row--active' : ''}`}>
      <article
        className={`broto-home-tl__card${isActive ? ' broto-home-tl__card--current' : ''}`}
        style={{ '--tl-accent': accentColor } as React.CSSProperties}
      >
        <span className="broto-home-tl__accent-bar" aria-hidden />
        <span className="broto-home-tl__icon" aria-hidden>
          {Icon ? <Icon size={16} /> : <span className="broto-home-tl__icon-fallback">{ev.iconEmoji}</span>}
        </span>
        <div className="broto-home-tl__card-body">
          <div className="broto-home-tl__card-title-row">
            <h3 className="broto-home-tl__card-title">{ev.title}</h3>
            {ev.kind === 'mission' && ev.xpTotal != null ? (
              <span
                className={`broto-home-tl__xp-total-badge${ev.status === 'done' ? ' broto-home-tl__xp-total-badge--done' : ''}`}
                aria-label={`Até ${ev.xpTotal} XP nesta missão`}
              >
                <Zap size={12} strokeWidth={2.5} className="broto-home-tl__xp-total-badge__icon" aria-hidden />
                <span className="broto-home-tl__xp-total-badge__val">{ev.xpTotal} XP</span>
              </span>
            ) : null}
          </div>
          <p className="broto-home-tl__card-sub">{ev.subtitle}</p>
          <div className="broto-home-tl__card-footer">
            <span className="broto-home-tl__card-time">{timeStr}</span>
            <span className={`broto-home-tl__badge broto-home-tl__badge--${ev.status}`}>
              {statusLabel(ev.status)}
            </span>
          </div>
        </div>
      </article>
    </li>
  )
}
