import { useMemo } from 'react'
import type { AreaStat } from '@/hooks/useProgress'
import { getAreaColor } from '@/lib/area-config'

interface RoutineAreaPerformanceProps {
  areas: AreaStat[]
}

export function RoutineAreaPerformance({ areas }: RoutineAreaPerformanceProps) {
  const rows = useMemo(() => {
    const main = areas.filter((a) => a.value !== 'outros')
    const outros = areas.find((a) => a.value === 'outros')
    const list = [...main]
    if (outros && outros.totalAnswered > 0) {
      list.push(outros)
    }
    return list
  }, [areas])

  return (
    <section className="broto-routine-area-perf" aria-label="Desempenho por matéria">
      <div className="broto-routine-area-perf__head">
        <h2 className="broto-routine-area-perf__title">Desempenho</h2>
        <span className="broto-routine-area-perf__hint">Por matéria</span>
      </div>
      <ul className="broto-routine-area-perf__list">
        {rows.map((a) => {
          const hasData = a.totalAnswered > 0
          const pctRounded = hasData ? Math.round(a.accuracyPct) : 0
          const barPct = hasData ? Math.min(100, Math.max(0, pctRounded)) : 0
          const color = getAreaColor(a.value)
          const title = hasData
            ? `${a.totalCorrect}/${a.totalAnswered} acertos (${a.accuracyPct}% nas respostas)`
            : 'Nenhuma questão respondida nesta matéria ainda'

          return (
            <li key={a.value} className="broto-routine-area-perf__row" title={title}>
              <div className="broto-routine-area-perf__row-top">
                <span className="broto-routine-area-perf__label">{a.label}</span>
                {hasData ? (
                  <span className="broto-routine-area-perf__pct">{pctRounded}%</span>
                ) : (
                  <span className="broto-routine-area-perf__pct broto-routine-area-perf__pct--empty">
                    —
                  </span>
                )}
              </div>
              <div className="broto-routine-area-perf__track" aria-hidden>
                <div
                  className={
                    hasData
                      ? 'broto-routine-area-perf__fill'
                      : 'broto-routine-area-perf__fill broto-routine-area-perf__fill--empty'
                  }
                  style={
                    hasData
                      ? {
                          width: `${barPct}%`,
                          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 42%, #0a1a16))`,
                        }
                      : undefined
                  }
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
