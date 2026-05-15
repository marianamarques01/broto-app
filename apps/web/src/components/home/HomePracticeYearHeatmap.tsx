import { useMemo } from 'react'

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const DOW_LEFT = ['Seg', '', 'Qua', '', 'Sex', '', 'Dom']

function dateISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function mondayOnOrBefore(d: Date): Date {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function intensityLevel(answered: number): 0 | 1 | 2 | 3 | 4 {
  if (answered <= 0) return 0
  if (answered <= 2) return 1
  if (answered <= 5) return 2
  if (answered <= 10) return 3
  return 4
}

export interface HeatmapCell {
  iso: string
  inYear: boolean
  isFuture: boolean
  isToday: boolean
  answered: number
  level: 0 | 1 | 2 | 3 | 4
}

export function buildYearHeatmapColumns(
  year: number,
  dayMap: Readonly<Record<string, { answered: number }>>,
  questoesHoje: number,
  todayIso: string,
): HeatmapCell[][] {
  const jan1 = new Date(year, 0, 1)
  jan1.setHours(12, 0, 0, 0)
  const dec31 = new Date(year, 11, 31)
  dec31.setHours(12, 0, 0, 0)

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let weekMonday = mondayOnOrBefore(jan1)
  const lastWeekMonday = mondayOnOrBefore(dec31)
  const columns: HeatmapCell[][] = []

  while (weekMonday <= lastWeekMonday) {
    const col: HeatmapCell[] = []
    for (let row = 0; row < 7; row++) {
      const d = addDays(weekMonday, row)
      const iso = dateISO(d)
      const inYear = d.getFullYear() === year
      const isFuture = d > today
      const isToday = iso === todayIso
      let answered = 0
      if (inYear && !isFuture) {
        answered = dayMap[iso]?.answered ?? 0
        if (isToday) answered = Math.max(answered, questoesHoje)
      }
      const level = inYear && !isFuture ? intensityLevel(answered) : 0
      col.push({ iso, inYear, isFuture, isToday, answered, level })
    }
    columns.push(col)
    weekMonday = addDays(weekMonday, 7)
  }

  return columns
}

function monthTicksForColumns(columns: HeatmapCell[][]): string[] {
  let prevMonth: number | null = null
  return columns.map((col) => {
    let firstInYear: Date | null = null
    for (const cell of col) {
      if (cell.inYear) {
        const [y, m, day] = cell.iso.split('-').map(Number)
        firstInYear = new Date(y, m - 1, day)
        firstInYear.setHours(12, 0, 0, 0)
        break
      }
    }
    if (!firstInYear) return ''
    const m = firstInYear.getMonth()
    if (prevMonth === m) return ''
    prevMonth = m
    return MONTH_SHORT[m] ?? ''
  })
}

export interface HomePracticeYearHeatmapProps {
  performanceDayMap: Readonly<Record<string, { answered: number; correct?: number }>>
  questoesHoje?: number
}

export function HomePracticeYearHeatmap({
  performanceDayMap,
  questoesHoje = 0,
}: HomePracticeYearHeatmapProps) {
  const year = new Date().getFullYear()

  const todayIso = useMemo(() => {
    const d = new Date()
    return dateISO(d)
  }, [])

  const columns = useMemo(
    () => buildYearHeatmapColumns(year, performanceDayMap, questoesHoje, todayIso),
    [year, performanceDayMap, questoesHoje, todayIso],
  )

  const monthTicks = useMemo(() => monthTicksForColumns(columns), [columns])

  return (
    <section
      id="home-consistencia"
      className="broto-practice-year-heatmap"
      aria-labelledby="broto-practice-year-heatmap-title"
    >
      <header className="broto-practice-year-heatmap__head">
        <h2 id="broto-practice-year-heatmap-title" className="broto-practice-year-heatmap__title">
          Dias em que você praticou
        </h2>
      </header>

      <div className="broto-practice-year-heatmap__chart">
        <div className="broto-practice-year-heatmap__dow" aria-hidden>
          <div className="broto-practice-year-heatmap__dow-spacer" />
          {DOW_LEFT.map((label, i) => (
            <span key={i} className="broto-practice-year-heatmap__dow-label">
              {label}
            </span>
          ))}
        </div>

        <div className="broto-practice-year-heatmap__scroll">
          <div className="broto-practice-year-heatmap__months" aria-hidden>
            {monthTicks.map((tick, i) => (
              <span key={i} className="broto-practice-year-heatmap__month-tick">
                {tick}
              </span>
            ))}
          </div>
          <div className="broto-practice-year-heatmap__grid" role="grid" aria-label={`Prática em ${year}`}>
            {columns.map((col, ci) => (
              <div key={ci} className="broto-practice-year-heatmap__week" role="presentation">
                {col.map((cell) => (
                  <div
                    key={cell.iso}
                    role="gridcell"
                    title={
                      cell.inYear
                        ? `${cell.iso}: ${cell.answered} questão(ões)`
                        : cell.iso
                    }
                    className={[
                      'broto-practice-year-heatmap__cell',
                      `broto-practice-year-heatmap__cell--lvl-${cell.level}`,
                      !cell.inYear && 'broto-practice-year-heatmap__cell--out',
                      cell.isFuture && cell.inYear && 'broto-practice-year-heatmap__cell--future',
                      cell.isToday && cell.inYear && 'broto-practice-year-heatmap__cell--today',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="broto-practice-year-heatmap__rule" role="presentation" />

      <footer className="broto-practice-year-heatmap__foot">
        <p className="broto-practice-year-heatmap__hint">
          Quanto mais questões no dia, mais intenso o verde. Contorno = hoje.
        </p>
        <div className="broto-practice-year-heatmap__legend" aria-hidden>
          <span className="broto-practice-year-heatmap__legend-less">Menos</span>
          <span className="broto-practice-year-heatmap__legend-cells">
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                className={`broto-practice-year-heatmap__cell broto-practice-year-heatmap__cell--lvl-${lvl} broto-practice-year-heatmap__legend-sample`}
              />
            ))}
          </span>
          <span className="broto-practice-year-heatmap__legend-more">Mais</span>
        </div>
      </footer>
    </section>
  )
}
