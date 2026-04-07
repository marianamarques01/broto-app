import { useMemo, useState } from 'react'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import type { PerformanceBucket, PerformancePeriod } from '@/lib/performance-history'

const FILTERS: { id: PerformancePeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Tudo' },
]

/** Valores ilustrativos (%) alinhados ao número de barras de cada período */
const MOCK_PCTS: Record<PerformancePeriod, number[]> = {
  week: [52, 61, 48, 58, 64, 71, 69],
  month: [55, 62, 68, 73],
  all: [62, 58, 71, 65, 74],
}

function buildMockBuckets(
  period: PerformancePeriod,
  real: PerformanceBucket[],
): PerformanceBucket[] {
  if (period === 'all' && real.length === 0) {
    return [
      { key: 'mock-m1', label: 'out/25', answered: 24, correct: 16, accuracyPct: 67 },
      { key: 'mock-m2', label: 'nov/25', answered: 18, correct: 13, accuracyPct: 72 },
      { key: 'mock-m3', label: 'dez/25', answered: 30, correct: 21, accuracyPct: 70 },
    ]
  }

  const series = MOCK_PCTS[period]
  return real.map((b, i) => {
    const pct = series[i] ?? 58 + (i % 5) * 3
    const answered = 6 + (i % 4) * 2
    const correct = Math.round((answered * pct) / 100)
    return {
      ...b,
      answered,
      correct,
      accuracyPct: pct,
    }
  })
}

function averageAccuracy(buckets: PerformanceBucket[]): number | null {
  const withPct = buckets.filter((b) => b.accuracyPct !== null)
  if (withPct.length === 0) return null
  const sum = withPct.reduce((s, b) => s + (b.accuracyPct ?? 0), 0)
  return Math.round(sum / withPct.length)
}

interface PerformanceChartCardProps {
  loadingProgress?: boolean
}

export function PerformanceChartCard({ loadingProgress }: PerformanceChartCardProps) {
  const [period, setPeriod] = useState<PerformancePeriod>('week')
  const buckets = usePerformanceSeries(period)

  const hasAny = useMemo(() => buckets.some((b) => b.answered > 0), [buckets])

  const { chartBuckets, chartAvg, isMock } = useMemo(() => {
    if (hasAny) {
      return {
        chartBuckets: buckets,
        chartAvg: averageAccuracy(buckets),
        isMock: false,
      }
    }
    const mock = buildMockBuckets(period, buckets)
    return {
      chartBuckets: mock,
      chartAvg: averageAccuracy(mock),
      isMock: true,
    }
  }, [hasAny, period, buckets])

  const n = Math.max(chartBuckets.length, 1)
  const gap = 6
  const padL = 8
  const padR = 8
  const padB = 22
  const chartH = 112
  const w = 320
  const innerW = w - padL - padR
  const barW = (innerW - gap * (n - 1)) / n

  return (
    <section className="broto-perf-section" aria-labelledby="broto-perf-title">
      <div className="broto-perf-external-head">
        <div className="broto-section-heading-row">
          <h3 id="broto-perf-title" className="broto-perf-card__title">
            Desempenho
          </h3>
        </div>
        <div className="broto-perf-card__filters" role="group" aria-label="Período do gráfico">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`broto-perf-filter${period === f.id ? ' broto-perf-filter--active' : ''}`}
              onClick={() => setPeriod(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="broto-perf-card">
        {loadingProgress ? (
          <div className="broto-perf-card__skeleton" aria-hidden />
        ) : (
          <>
            <p className="broto-perf-card__subtitle">
              {period === 'week' && 'Últimos 7 dias — taxa de acerto por dia.'}
              {period === 'month' && 'Últimas 4 semanas — taxa de acerto agregada.'}
              {period === 'all' && 'Histórico por mês (neste navegador).'}
            </p>

            {isMock && (
              <p className="broto-perf-mock-hint">
                Gráfico de exemplo — ao responder questões, seus indicadores substituem esta
                visualização.
              </p>
            )}

            {chartAvg !== null && (
              <p className="broto-perf-card__avg">
                {isMock ? 'Média de exemplo: ' : 'Média no período: '}
                <strong>{chartAvg}%</strong>
              </p>
            )}

            <div className={`broto-perf-chart-wrap${isMock ? ' broto-perf-chart-wrap--mock' : ''}`}>
              <svg
                className="broto-perf-chart"
                viewBox={`0 0 ${w} ${chartH + padB}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={
                  isMock
                    ? 'Exemplo de gráfico de desempenho'
                    : 'Gráfico de taxa de acerto por período'
                }
              >
                <defs>
                  <linearGradient id="broto-perf-bar-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                {chartBuckets.map((b, i) => {
                  const x = padL + i * (barW + gap)
                  const pct = b.accuracyPct
                  const hFill = pct === null ? 6 : Math.max((pct / 100) * chartH, 8)
                  const y = chartH - hFill
                  const title = isMock
                    ? `Exemplo ${b.label}: ${pct ?? '—'}%`
                    : `${b.label}: ${pct !== null ? `${pct}%` : '—'} (${b.answered} quest.)`
                  return (
                    <g key={b.key}>
                      <title>{title}</title>
                      <rect
                        x={x}
                        y={0}
                        width={barW}
                        height={chartH}
                        rx={4}
                        className="broto-perf-chart__track"
                      />
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={hFill}
                        rx={4}
                        className={
                          pct === null
                            ? 'broto-perf-chart__bar broto-perf-chart__bar--empty'
                            : 'broto-perf-chart__bar'
                        }
                      />
                      <text
                        x={x + barW / 2}
                        y={chartH + 16}
                        textAnchor="middle"
                        className="broto-perf-chart__xlabel"
                      >
                        {b.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
