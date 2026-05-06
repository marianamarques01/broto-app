import { useId, type CSSProperties } from 'react'
import { BarChart3, Clock, Flame } from 'lucide-react'

type WeeklyMetricKind = 'line' | 'donut' | 'flame' | 'clock'

interface WeeklyMetric {
  label: string
  value: string
  comparison: string
  kind: WeeklyMetricKind
  progress?: number
  points?: number[]
}

interface WeeklyAreaPerformance {
  label: string
  percent: number
  color: string
}

const WEEKLY_PROGRESS_MOCK: {
  metrics: WeeklyMetric[]
  areas: WeeklyAreaPerformance[]
} = {
  metrics: [
    {
      label: 'XP esta semana',
      value: '420 XP',
      comparison: '+120 XP que na semana passada',
      kind: 'line',
      points: [34, 30, 42, 35, 50, 44, 72],
    },
    {
      label: 'Taxa de acertos',
      value: '68%',
      comparison: '+8% que na semana passada',
      kind: 'donut',
      progress: 68,
    },
    {
      label: 'Sequência atual',
      value: '1 dia',
      comparison: 'Melhor: 7 dias',
      kind: 'flame',
    },
    {
      label: 'Tempo de estudos',
      value: '3h 45m',
      comparison: '+45m que na semana passada',
      kind: 'clock',
      progress: 74,
    },
  ],
  areas: [
    { label: 'Linguagens', percent: 72, color: 'var(--teal-400)' },
    { label: 'Ciências Humanas', percent: 60, color: 'var(--gold-400)' },
    { label: 'Ciências da Natureza', percent: 48, color: 'var(--status-violet)' },
    { label: 'Matemática', percent: 55, color: 'var(--status-sky)' },
  ],
}

function metricPath(points: number[]): string {
  const width = 104
  const height = 42
  const step = width / (points.length - 1)
  return points
    .map((point, index) => {
      const x = index * step
      const y = height - (point / 100) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function MiniLineChart({ points, gradientId }: { points: number[]; gradientId: string }) {
  const path = metricPath(points)

  return (
    <svg
      className="broto-weekly-progress-card__mini-line"
      viewBox="0 0 104 42"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.5" />
          <stop offset="60%" stopColor="var(--teal-300)" />
          <stop offset="100%" stopColor="var(--green-300)" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L 104 42 L 0 42 Z`}
        className="broto-weekly-progress-card__mini-line-fill"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MiniDonut({ percent, label }: { percent: number; label: string }) {
  const safePercent = Math.min(100, Math.max(0, percent))
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const dash = (safePercent / 100) * circumference

  return (
    <svg
      className="broto-weekly-progress-card__donut"
      viewBox="0 0 42 42"
      role="img"
      aria-label={`${label}: ${safePercent}%`}
    >
      <circle className="broto-weekly-progress-card__donut-track" cx="21" cy="21" r={radius} />
      <circle
        className="broto-weekly-progress-card__donut-fill"
        cx="21"
        cy="21"
        r={radius}
        strokeDasharray={`${dash} ${circumference}`}
      />
    </svg>
  )
}

function MetricVisual({ metric, visualId }: { metric: WeeklyMetric; visualId: string }) {
  if (metric.kind === 'line') {
    return <MiniLineChart points={metric.points ?? []} gradientId={visualId} />
  }

  if (metric.kind === 'donut') {
    return <MiniDonut percent={metric.progress ?? 0} label={metric.label} />
  }

  if (metric.kind === 'clock') {
    return (
      <div className="broto-weekly-progress-card__clock" aria-hidden>
        <MiniDonut percent={metric.progress ?? 0} label={metric.label} />
        <Clock size={18} strokeWidth={2.2} />
      </div>
    )
  }

  return (
    <span className="broto-weekly-progress-card__flame" aria-hidden>
      <Flame size={24} strokeWidth={2.1} />
    </span>
  )
}

export function HomeWeeklyProgressCard() {
  const rawId = useId().replace(/:/g, '')

  return (
    <section className="broto-weekly-progress-card" aria-labelledby="broto-weekly-progress-title">
      <header className="broto-weekly-progress-card__head">
        <div className="broto-weekly-progress-card__intro">
          <h2 id="broto-weekly-progress-title" className="broto-weekly-progress-card__title">
            Seu progresso esta semana
          </h2>
          <p className="broto-weekly-progress-card__subtitle">
            Você está mandando bem! Consistência é a chave. <span aria-hidden>🌱</span>
          </p>
        </div>

        <button
          className="broto-weekly-progress-card__insights"
          type="button"
          disabled
          title="Insights semanais em breve"
        >
          <span>Ver insights</span>
          <BarChart3 size={15} strokeWidth={2.1} aria-hidden />
        </button>
      </header>

      <div className="broto-weekly-progress-card__metrics">
        {WEEKLY_PROGRESS_MOCK.metrics.map((metric, index) => (
          <article className="broto-weekly-progress-card__metric" key={metric.label}>
            <div className="broto-weekly-progress-card__metric-copy">
              <span className="broto-weekly-progress-card__metric-label">{metric.label}</span>
              <strong className="broto-weekly-progress-card__metric-value">{metric.value}</strong>
              <span className="broto-weekly-progress-card__metric-comparison">
                {metric.comparison}
              </span>
            </div>
            <MetricVisual metric={metric} visualId={`broto-weekly-${rawId}-${index}`} />
          </article>
        ))}
      </div>

      <div className="broto-weekly-progress-card__areas">
        <h3 className="broto-weekly-progress-card__areas-title">Desempenho por área</h3>
        <div className="broto-weekly-progress-card__area-grid">
          {WEEKLY_PROGRESS_MOCK.areas.map((area) => (
            <div
              className="broto-weekly-progress-card__area"
              key={area.label}
              style={
                {
                  '--weekly-area-color': area.color,
                  '--weekly-area-percent': `${area.percent}%`,
                } as CSSProperties
              }
            >
              <div className="broto-weekly-progress-card__area-top">
                <span>{area.label}</span>
                <strong>{area.percent}%</strong>
              </div>
              <span
                className="broto-weekly-progress-card__area-track"
                role="progressbar"
                aria-label={`${area.label}: ${area.percent}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={area.percent}
              >
                <span className="broto-weekly-progress-card__area-fill" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
