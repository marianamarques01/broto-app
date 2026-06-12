import { useMemo } from 'react'
import type { PerformanceBucket } from '@/lib/performance-history'

interface RoutineWeekBarsProps {
  buckets: PerformanceBucket[]
  /** Meta em minutos por dia (linha de referência no gráfico). */
  targetMinPerDay: number
}

const MIN_PER_QUESTION = 2.5

export function RoutineWeekBars({ buckets, targetMinPerDay }: RoutineWeekBarsProps) {
  const { bars, maxH } = useMemo(() => {
    const minutes = buckets.map((b) => Math.round(b.answered * MIN_PER_QUESTION))
    const maxVal = Math.max(targetMinPerDay, ...minutes, 1)
    return {
      bars: minutes.map((m, i) => ({
        m,
        label: buckets[i]?.label ?? '',
        key: buckets[i]?.key ?? i,
      })),
      maxH: maxVal,
    }
  }, [buckets, targetMinPerDay])

  return (
    <section className="broto-routine-week-chart" aria-label="Tempo de estudo nesta semana">
      <div className="broto-routine-week-chart__head">
        <h2 className="broto-routine-week-chart__title">Esta semana</h2>
        <span className="broto-routine-week-chart__target">Meta {targetMinPerDay} min/dia</span>
      </div>
      <div className="broto-routine-week-chart__plot">
        <div
          className="broto-routine-week-chart__target-line"
          style={{ bottom: `${(targetMinPerDay / maxH) * 100}%` }}
          title={`Meta ${targetMinPerDay} min`}
        />
        <div className="broto-routine-week-chart__bars">
          {bars.map((b) => {
            const h = (b.m / maxH) * 100
            const isHigh = b.m >= targetMinPerDay
            return (
              <div key={b.key} className="broto-routine-week-chart__col">
                <div className="broto-routine-week-chart__bar-wrap">
                  <div
                    className={`broto-routine-week-chart__bar${isHigh ? ' broto-routine-week-chart__bar--high' : ''}`}
                    style={{ height: `${Math.max(h, b.m > 0 ? 8 : 2)}%` }}
                  />
                </div>
                {b.m > 0 ? (
                  <span className="broto-routine-week-chart__val">{b.m}m</span>
                ) : (
                  <span className="broto-routine-week-chart__val broto-routine-week-chart__val--zero">
                    —
                  </span>
                )}
                <span className="broto-routine-week-chart__wd">{b.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
