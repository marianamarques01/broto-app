import { useMemo } from 'react'
import { Check, Flame, Sprout } from 'lucide-react'

/** Alinhado a HomePetBanner e DashboardStudyStats. */
const META_QUESTOES_DIA = 5

function dateISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function todayLocalISO(): string {
  return dateISO(new Date())
}

/** Segunda da semana local (00:00 lógico ao meio-dia para evitar DST). */
function mondayOfThisWeek(ref: Date): Date {
  const d = new Date(ref)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const offset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + offset)
  return d
}

const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type DayState = 'future' | 'complete' | 'today-ring' | 'missed'

function dayState(
  isFuture: boolean,
  isToday: boolean,
  answered: number,
): DayState {
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
  questoesHoje: number
  loading?: boolean
  performanceDayMap: Readonly<Record<string, { answered: number; correct: number }>>
}

export function DailyStreakCard({
  streak,
  questoesHoje,
  loading,
  performanceDayMap,
}: DailyStreakCardProps) {
  const todayIso = todayLocalISO()

  const weekDays = useMemo(() => {
    const mon = mondayOfThisWeek(new Date())
    const endToday = new Date()
    endToday.setHours(23, 59, 59, 999)
    const days: { iso: string; label: string; state: DayState }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      const iso = dateISO(d)
      const isFuture = d > endToday
      const isToday = iso === todayIso
      let localQ = performanceDayMap[iso]?.answered ?? 0
      if (isToday) localQ = Math.max(localQ, questoesHoje)

      const state = dayState(isFuture, isToday, localQ)

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
          <span className="broto-daily-streak__meta-pct">
            {loading ? '—' : `${missionsPct}%`}
          </span>
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
      </footer>
    </section>
  )
}
