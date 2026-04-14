import { useId, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { PerformanceBucket, PerformancePeriod } from '@/lib/performance-history'
import { PROGRESS_PERIOD_FILTERS } from './constants'

interface ProgressTrendCardProps {
  period: PerformancePeriod
  onPeriodChange: (p: PerformancePeriod) => void
  buckets: PerformanceBucket[]
  loading: boolean
  error: string | null
  globalAccuracyPct: number | null
  totalAnswered: number
}

export function ProgressTrendCard({
  period,
  onPeriodChange,
  buckets,
  loading,
  error,
  globalAccuracyPct,
  totalAnswered,
}: ProgressTrendCardProps) {
  const gradId = useId().replace(/:/g, '')
  const hasAny = useMemo(() => buckets.some((b) => b.answered > 0), [buckets])
  const chartAvg = useMemo(() => {
    const withPct = buckets.filter((b) => b.accuracyPct !== null)
    if (withPct.length === 0) return null
    const sum = withPct.reduce((s, b) => s + (b.accuracyPct ?? 0), 0)
    return Math.round(sum / withPct.length)
  }, [buckets])
  const sumAnswered = useMemo(() => buckets.reduce((s, b) => s + b.answered, 0), [buckets])
  const maxAnswered = useMemo(() => Math.max(1, ...buckets.map((b) => b.answered)), [buckets])

  const subtitle =
    period === 'week'
      ? 'Barras = questões no período · Linha = taxa de acerto (UTC).'
      : period === 'month'
        ? 'Barras = questões agregadas por semana · Linha = acerto no período.'
        : 'Barras = questões por mês · Linha = acerto no período.'

  const n = Math.max(buckets.length, 1)
  const gap = 6
  const padL = 12
  const padR = 12
  const padB = 26
  const chartW = 560
  const yBase = 108
  const barMaxH = 62
  const lineTop = 12
  const lineBand = 34
  const innerW = chartW - padL - padR
  const barW = (innerW - gap * (n - 1)) / n

  const linePoints = useMemo(() => {
    const pts: { x: number; y: number; label: string }[] = []
    buckets.forEach((b, i) => {
      if (b.accuracyPct === null || b.answered <= 0) return
      const cx = padL + i * (barW + gap) + barW / 2
      const y = lineTop + lineBand - (b.accuracyPct / 100) * lineBand
      pts.push({ x: cx, y, label: `${b.accuracyPct}%` })
    })
    return pts
  }, [buckets, barW, gap, padL, lineTop, lineBand])

  const linePathD = useMemo(() => {
    if (linePoints.length === 0) return ''
    return linePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  }, [linePoints])

  const showSkeleton = loading

  return (
    <section
      id="progress-trend"
      className="broto-perf-section broto-progress-trend-section"
      aria-labelledby="broto-progress-trend-title"
    >
      <div className="broto-perf-external-head">
        <div className="broto-section-heading-row">
          <h2 id="broto-progress-trend-title" className="broto-perf-card__title">
            Tendência e volume
          </h2>
        </div>
        <div className="broto-perf-card__filters" role="group" aria-label="Período do gráfico">
          {PROGRESS_PERIOD_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`broto-perf-filter${period === f.id ? ' broto-perf-filter--active' : ''}`}
              onClick={() => onPeriodChange(f.id)}
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
            <p className="broto-perf-card__subtitle">{subtitle}</p>
            <div className="broto-progress-trend-legend" aria-hidden>
              <span className="broto-progress-trend-legend__item">
                <span className="broto-progress-trend-legend__swatch broto-progress-trend-legend__swatch--bar" />
                Questões
              </span>
              <span className="broto-progress-trend-legend__item">
                <span className="broto-progress-trend-legend__swatch broto-progress-trend-legend__swatch--line" />
                % acerto
              </span>
            </div>

            {error ? (
              <p className="broto-perf-mock-hint" role="alert">
                {error}
              </p>
            ) : null}

            {!hasAny && !error ? (
              <div style={{ padding: '8px 0 16px' }}>
                <p className="broto-muted" style={{ margin: '0 0 12px', fontSize: '0.88rem' }}>
                  Ainda não há respostas neste período. Pratique questões para ver volume e acerto
                  juntos.
                </p>
                {globalAccuracyPct != null && totalAnswered > 0 ? (
                  <p className="broto-perf-card__avg" style={{ marginBottom: 12 }}>
                    Acerto geral no banco: <strong>{globalAccuracyPct}%</strong>
                  </p>
                ) : null}
                <Link
                  to="/study/linguagens?hub=bank"
                  className="broto-btn-primary broto-btn-primary--inline"
                >
                  Ir para questões
                </Link>
              </div>
            ) : null}

            {hasAny ? (
              <p className="broto-perf-card__avg">
                Média de acerto no período: <strong>{chartAvg ?? '—'}%</strong>
                {sumAnswered > 0 ? (
                  <>
                    {' '}
                    · <strong>{sumAnswered}</strong> questões
                  </>
                ) : null}
              </p>
            ) : null}

            {hasAny ? (
              <div className="broto-perf-chart-wrap">
                <svg
                  className="broto-perf-chart broto-progress-combo-chart"
                  viewBox={`0 0 ${chartW} ${yBase + padB}`}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label="Gráfico combinado de questões e taxa de acerto"
                >
                  <defs>
                    <linearGradient id={`broto-trend-bar-${gradId}`} x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="var(--teal-700)" />
                      <stop offset="100%" stopColor="var(--teal-500)" />
                    </linearGradient>
                  </defs>
                  {/* faixa da linha de acerto */}
                  <rect
                    x={padL}
                    y={lineTop}
                    width={innerW}
                    height={lineBand}
                    rx={6}
                    fill="var(--border-subtle)"
                    opacity={0.35}
                  />
                  {buckets.map((b, i) => {
                    const x = padL + i * (barW + gap)
                    const hFill =
                      b.answered > 0
                        ? Math.max((b.answered / maxAnswered) * barMaxH, 8)
                        : 0
                    const y = yBase - hFill
                    const title = `${b.label}: ${b.answered} quest. · ${b.accuracyPct !== null ? `${b.accuracyPct}% acerto` : '—'}`
                    return (
                      <g key={b.key}>
                        <title>{title}</title>
                        <rect
                          x={x}
                          y={yBase - barMaxH - 4}
                          width={barW}
                          height={barMaxH + 4}
                          rx={4}
                          className="broto-perf-chart__track"
                          opacity={0.25}
                        />
                        {hFill > 0 ? (
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={hFill}
                            rx={4}
                            fill={`url(#broto-trend-bar-${gradId})`}
                          />
                        ) : null}
                        <text
                          x={x + barW / 2}
                          y={yBase + 16}
                          textAnchor="middle"
                          className="broto-perf-chart__xlabel"
                        >
                          {b.label}
                        </text>
                      </g>
                    )
                  })}
                  {linePathD ? (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="var(--gold-accent)"
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  {linePoints.map((p, i) => (
                    <circle
                      key={`pt-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill="var(--bg-card)"
                      stroke="var(--gold-accent)"
                      strokeWidth={2}
                    />
                  ))}
                </svg>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
