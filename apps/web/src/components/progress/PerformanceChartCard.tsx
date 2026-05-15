import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import type { PerformanceBucket, PerformancePeriod } from '@/lib/performance-history'
import { useProgress } from '@/hooks/useProgress'

const FILTERS: { id: PerformancePeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Tudo' },
]

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
  const { buckets, loading: loadingSeries, error: seriesError } = usePerformanceSeries(period)
  const { progress } = useProgress()

  const hasAny = useMemo(() => buckets.some((b) => b.answered > 0), [buckets])
  const chartAvg = useMemo(() => averageAccuracy(buckets), [buckets])
  const globalAccuracy = progress?.accuracyPct ?? null
  const hasGlobalProgress = globalAccuracy != null && (progress?.totalAnswered ?? 0) > 0

  const n = Math.max(buckets.length, 1)
  const gap = 6
  const padL = 8
  const padR = 8
  const padB = 22
  const chartH = 112
  const w = 320
  const innerW = w - padL - padR
  const barW = (innerW - gap * (n - 1)) / n

  const showSkeleton = loadingProgress || loadingSeries

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
        {showSkeleton ? (
          <div className="broto-perf-card__skeleton" aria-hidden />
        ) : (
          <>
            <p className="broto-perf-card__subtitle">
              {period === 'week' && 'Últimos 7 dias (UTC) — taxa de acerto por dia, dados da sua conta.'}
              {period === 'month' && 'Últimas 4 semanas — taxa de acerto agregada por semana.'}
              {period === 'all' && 'Histórico por mês civil — até 12 meses com atividade.'}
            </p>

            {seriesError ? (
              <p className="broto-perf-mock-hint" role="alert">
                {seriesError}
              </p>
            ) : null}

            {!hasAny && !seriesError ? (
              <div className="broto-perf-empty-state">
                <p className="broto-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                  Ainda não há respostas registradas neste período. Pratique questões para ver seu
                  ritmo aqui.
                </p>
                {hasGlobalProgress ? (
                  <p className="broto-perf-card__avg" style={{ margin: 0 }}>
                    Acerto geral no banco de questões: <strong>{globalAccuracy}%</strong>
                  </p>
                ) : null}
                <Link
                  to="/study/linguagens"
                  className="broto-btn-secondary broto-btn-secondary--inline"
                >
                  Praticar no banco de questões
                </Link>
              </div>
            ) : null}

            {hasAny && chartAvg !== null ? (
              <p className="broto-perf-card__avg">
                Média no período: <strong>{chartAvg}%</strong>
              </p>
            ) : null}

            {hasAny ? (
              <div className="broto-perf-chart-wrap">
                <svg
                  className="broto-perf-chart"
                  viewBox={`0 0 ${w} ${chartH + padB}`}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label="Gráfico de taxa de acerto por período"
                >
                  <defs>
                    <linearGradient id="broto-perf-bar-grad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="var(--teal-700)" />
                      <stop offset="100%" stopColor="var(--teal-500)" />
                    </linearGradient>
                  </defs>
                  {buckets.map((b, i) => {
                    const x = padL + i * (barW + gap)
                    const pct = b.accuracyPct
                    const hFill = pct === null ? 6 : Math.max((pct / 100) * chartH, 8)
                    const y = chartH - hFill
                    const title = `${b.label}: ${pct !== null ? `${pct}%` : '—'} (${b.answered} quest.)`
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
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
