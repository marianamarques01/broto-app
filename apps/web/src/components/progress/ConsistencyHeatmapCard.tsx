import { useMemo } from 'react'
import { HEATMAP_GITHUB_ROW_LABELS } from './constants'

const MONTH_ABBR_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

function dateISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Domingo da semana que contém `d` (0h local). */
function sundayOfWeekContaining(d: Date): Date {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  return x
}

function heatLevel(answered: number): 0 | 1 | 2 | 3 | 4 {
  if (answered <= 0) return 0
  if (answered <= 2) return 1
  if (answered <= 5) return 2
  if (answered <= 10) return 3
  return 4
}

interface ConsistencyHeatmapCardProps {
  performanceDayMap: Readonly<Record<string, { answered: number; correct: number }>>
  totalAnswered: number
}

export function ConsistencyHeatmapCard({
  performanceDayMap,
  totalAnswered,
}: ConsistencyHeatmapCardProps) {
  const { heatmapCells, monthLabels, year } = useMemo(() => {
    const map = performanceDayMap
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yr = today.getFullYear()
    const rows = 7

    const jan1 = new Date(yr, 0, 1, 12, 0, 0, 0)
    const dec31 = new Date(yr, 11, 31, 12, 0, 0, 0)
    const firstSunday = sundayOfWeekContaining(jan1)
    const lastSunday = sundayOfWeekContaining(dec31)
    const cols = Math.round((lastSunday.getTime() - firstSunday.getTime()) / (7 * 86400000)) + 1

    const todayIso = dateISO(today)

    const grid: {
      iso: string
      level: 0 | 1 | 2 | 3 | 4
      future: boolean
      answered: number
      isToday: boolean
      outsideYear: boolean
    }[][] = []

    const months: string[] = []

    for (let c = 0; c < cols; c++) {
      const col: typeof grid[number] = []
      const weekSunday = new Date(firstSunday)
      weekSunday.setDate(weekSunday.getDate() + c * 7)

      if (c === 0) {
        months.push(MONTH_ABBR_PT[jan1.getMonth()] ?? '')
      } else {
        const prev = new Date(weekSunday)
        prev.setDate(prev.getDate() - 7)
        months.push(
          weekSunday.getMonth() !== prev.getMonth()
            ? MONTH_ABBR_PT[weekSunday.getMonth()] ?? ''
            : '',
        )
      }

      for (let r = 0; r < rows; r++) {
        const d = new Date(weekSunday)
        d.setDate(d.getDate() + r)
        const iso = dateISO(d)
        const future = d > today
        const outsideYear = d.getFullYear() !== yr
        const answered = future || outsideYear ? 0 : map[iso]?.answered ?? 0
        const isToday = !future && iso === todayIso
        col.push({
          iso,
          level: future || outsideYear ? 0 : heatLevel(answered),
          future: future || outsideYear,
          answered,
          isToday,
          outsideYear,
        })
      }
      grid.push(col)
    }
    return { heatmapCells: grid, monthLabels: months, year: yr }
  }, [performanceDayMap])

  const { activeDaysCount, avgMinPerActiveDay } = useMemo(() => {
    let n = 0
    for (const col of heatmapCells) {
      for (const cell of col) {
        if (!cell.future && cell.level > 0) n += 1
      }
    }
    const estTotalStudyMin = Math.round(totalAnswered * 2.5)
    const avg = n > 0 ? Math.round(estTotalStudyMin / n) : 0
    return { activeDaysCount: n, avgMinPerActiveDay: avg }
  }, [heatmapCells, totalAnswered])

  return (
    <section
      id="consistencia"
      className="broto-perf-section broto-prog-heat-perf-section broto-prog-heat--github broto-progress-anchor"
      aria-labelledby="progress-habit-title"
    >
      <div className="broto-perf-external-head broto-prog-heat-perf-head">
        <div className="broto-section-heading-row">
          <h2 id="progress-habit-title" className="broto-perf-card__title">
            Constância no calendário
          </h2>
        </div>
        <p className="broto-prog-heat-gh-summary" aria-live="polite">
          {activeDaysCount > 0 ? (
            <>
              <strong>{activeDaysCount}</strong> dias com prática em {year}
              {avgMinPerActiveDay > 0 ? (
                <>
                  {' '}
                  <span className="broto-prog-heat-gh-summary-sub">
                    (~<strong>{avgMinPerActiveDay}</strong> min/dia ativo)
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <span className="broto-prog-heat-gh-summary-sub">
              Passe o cursor nos quadrados para ver o dia
            </span>
          )}
        </p>
      </div>
      <div className="broto-perf-card broto-prog-heat-perf-card">
        <div className="broto-prog-heat-panel broto-prog-heat-panel--github">
        <div className="broto-prog-heat-wrap broto-prog-heat-wrap--github">
          <div className="broto-prog-heat-github-inner">
            <div className="broto-prog-heat-months" aria-hidden>
              <span className="broto-prog-heat-months-spacer" />
              {monthLabels.map((m, i) => (
                <span key={i} className="broto-prog-heat-month-tick">
                  {m}
                </span>
              ))}
            </div>
            <div className="broto-prog-heat-body-row">
              <div className="broto-prog-heat-rows broto-prog-heat-rows--github" aria-hidden>
                {HEATMAP_GITHUB_ROW_LABELS.map((lb, i) => (
                  <span key={i} className="broto-prog-heat-row-label">
                    {lb ?? '\u00a0'}
                  </span>
                ))}
              </div>
              <div
                className="broto-prog-heat-grid broto-prog-heat-grid--github"
                role="img"
                aria-label="Mapa de calor de prática por dia, estilo contribuições"
              >
                {heatmapCells.map((col, ci) => (
                  <div key={ci} className="broto-prog-heat-col broto-prog-heat-col--github">
                    {col.map((cell) => {
                      const tip = cell.future
                        ? ''
                        : cell.answered <= 0
                          ? `${cell.iso}: sem atividade`
                          : `${cell.iso}: ${cell.answered} questão${cell.answered === 1 ? '' : 'es'}`
                      return (
                        <div
                          key={cell.iso}
                          className={`broto-prog-heat-cell broto-prog-heat-cell--github broto-prog-heat-cell--${cell.level}${cell.future ? ' broto-prog-heat-cell--future' : ''}${cell.isToday ? ' broto-prog-heat-cell--today' : ''}`}
                          title={tip}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="broto-prog-heat-gh-footer">
          <p className="broto-prog-heat-hint broto-prog-heat-hint--github">
            Quanto mais questões no dia, mais intenso o verde. Contorno = hoje.
          </p>
          <div className="broto-prog-heat-legend broto-prog-heat-legend--github">
            <span className="broto-prog-heat-legend__label">Menos</span>
            <div className="broto-prog-heat-legend-boxes" aria-hidden>
              {[0, 1, 2, 3, 4].map((lv) => (
                <span key={lv} className={`broto-prog-heat-legend-box broto-prog-heat-legend-box--${lv}`} />
              ))}
            </div>
            <span className="broto-prog-heat-legend__label">Mais</span>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
