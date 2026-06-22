import { useMemo } from 'react'
import { Check, Flame, Sprout } from 'lucide-react'
import { DAILY_MISSION_VOLUME_QUEST_GOAL, streakFreezeDisplayLabel, todayUtcISO } from '@broto/shared'

/** Alinhado a HomePetBanner (meta gamificada do dia). */
const META_QUESTOES_DIA = DAILY_MISSION_VOLUME_QUEST_GOAL

function dateUtcISO(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Segunda da semana UTC (meio-dia UTC para evitar bordas de DST). */
function mondayOfThisUtcWeek(ref: Date): Date {
  const d = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 12, 0, 0, 0),
  )
  const day = d.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + offset)
  return d
}

const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type DayState = 'future' | 'complete' | 'today-ring' | 'missed'

function dayState(isFuture: boolean, isToday: boolean, answered: number): DayState {
  if (isFuture) return 'future'
  if (isToday) {
    if (answered >= META_QUESTOES_DIA) return 'complete'
    return 'today-ring'
  }
  if (answered >= 1) return 'complete'
  return 'missed'
}

interface DailyStreakCardProps {
  streak: number
  streakFreezes?: number
  questoesHoje: number
  loading?: boolean
  performanceDayMap: Readonly<Record<string, { answered: number; correct: number }>>
}

export function DailyStreakCard({
  streak,
  streakFreezes = 0,
  questoesHoje,
  loading,
  performanceDayMap,
}: DailyStreakCardProps) {
  const todayIso = todayUtcISO()

  const weekDays = useMemo(() => {
    const mon = mondayOfThisUtcWeek(new Date())
    const days: { iso: string; label: string; state: DayState }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon)
      d.setUTCDate(mon.getUTCDate() + i)
      const iso = dateUtcISO(d)
      const isFuture = iso > todayIso
      const isToday = iso === todayIso
      let answered = performanceDayMap[iso]?.answered ?? 0
      if (isToday) answered = Math.max(answered, questoesHoje)

      const state = dayState(isFuture, isToday, answered)

      days.push({ iso, label: DAY_SHORT[i] ?? '', state })
    }
    return days
  }, [performanceDayMap, questoesHoje, todayIso])

  const metaCount = Math.min(questoesHoje, META_QUESTOES_DIA)
  const missionsPct = Math.round((metaCount / META_QUESTOES_DIA) * 100)

  return (
    <section className="broto-daily-streak" aria-label="Sequência e meta diária">
      <header className="broto-daily-streak__header">
        <div className="broto-daily-streak__flame-wrap" aria-hidden>
          <Flame size={22} strokeWidth={2} className="broto-daily-streak__flame" />
        </div>
        <div className="broto-daily-streak__head-copy">
          <span className="broto-daily-streak__kicker">Sequência</span>
          <p className="broto-daily-streak__streak-val">
            {loading ? (
              '…'
            ) : (
              <>
                <span className="broto-daily-streak__streak-num">{streak}</span>
                <span className="broto-daily-streak__streak-unit">
                  {' '}
                  {streak === 1 ? 'dia' : 'dias'}
                </span>
              </>
            )}
          </p>
          {!loading && streak > 0 ? (
            <p className="broto-daily-streak__freeze" title="Ganhe 1 freeze a cada 7 dias consecutivos (máx. 3)">
              {streakFreezeDisplayLabel(streak, streakFreezes)}
            </p>
          ) : null}
        </div>
        <Sprout size={20} strokeWidth={1.75} className="broto-daily-streak__broto" aria-hidden />
      </header>

      <div className="broto-daily-streak__rule" role="presentation" />

      <div className="broto-daily-streak__week" role="list">
        {weekDays.map((day) => (
          <div key={day.iso} className="broto-daily-streak__day" role="listitem">
            <div
              className={`broto-daily-streak__dot broto-daily-streak__dot--${day.state}`}
              aria-hidden
            >
              {day.state === 'complete' ? (
                <Check size={12} strokeWidth={3} className="broto-daily-streak__check" />
              ) : null}
            </div>
            <span className="broto-daily-streak__day-lbl">{day.label}</span>
          </div>
        ))}
      </div>

      <div className="broto-daily-streak__rule" role="presentation" />

      <footer className="broto-daily-streak__footer">
        <div className="broto-daily-streak__meta-top">
          <span className="broto-daily-streak__meta-kicker">Meta hoje</span>
          <span className="broto-daily-streak__meta-pct">{loading ? '—' : `${missionsPct}%`}</span>
        </div>
        <p className="broto-daily-streak__meta-nums">
          {loading ? (
            '…'
          ) : (
            <>
              <strong>{questoesHoje}</strong>
              <span className="broto-daily-streak__meta-sep"> / </span>
              <span className="broto-daily-streak__meta-den">{META_QUESTOES_DIA}</span>
              <span className="broto-daily-streak__meta-unit"> questões</span>
            </>
          )}
        </p>
        <div className="broto-daily-streak__bar-track" aria-hidden>
          <div
            className="broto-daily-streak__bar-fill"
            style={{ width: loading ? '0%' : `${missionsPct}%` }}
          />
        </div>
        <p
          className="broto-daily-streak__utc-hint"
          style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}
        >
          Contagens seguem horário UTC.
        </p>
      </footer>
    </section>
  )
}
