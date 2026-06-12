import { useId } from 'react'
import { BookOpen, Clock, Percent, Target, TrendingUp } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

/** Cores alinhadas aos eixos LC, CH, CN, MT, Red., Mat., Outro (áreas Broto + mock). */
const MOCK_BAR_FILLS = [
  AREA_CONFIG.linguagens.color,
  AREA_CONFIG['ciencias-humanas'].color,
  AREA_CONFIG['ciencias-natureza'].color,
  AREA_CONFIG.matematica.color,
  '#f472b6',
  '#fbbf24',
  '#94a3b8',
] as const

function buildChartPoints(values: number[], w: number, h: number, pad: number): [number, number][] {
  const step = (w - pad * 2) / (values.length - 1)
  return values.map((p, i) => [pad + i * step, h - pad - (p / 100) * (h - pad * 2)])
}

/** Curva suave (cúbica) passando pelos pontos — visual mais orgânico que linhas retas. */
function smoothLinePath(points: [number, number][]): string {
  if (points.length < 2) {
    return ''
  }
  if (points.length === 2) {
    const [a, b] = points
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`
  }
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

/**
 * Mock visual temporário para o dashboard quando os indicadores reais estão desligados.
 * Remover o uso em `Home.tsx` quando `SHOW_HOME_METRICS_SECTION` voltar a `true`.
 */
export function HomeDashboardMetricsPlaceholder() {
  const rid = useId().replace(/:/g, '')
  const linePts = [38, 52, 44, 68, 58, 74, 63]
  const barHs = [44, 72, 55, 81, 62, 77, 69]
  const w = 300
  const h = 100
  const pad = 10
  const step = (w - pad * 2) / (linePts.length - 1)
  const linePoints2 = buildChartPoints(linePts, w, h, pad)
  const pathD = smoothLinePath(linePoints2)
  const lastX = pad + (linePts.length - 1) * step
  const fillD = `${pathD} L ${lastX} ${h - pad} L ${pad} ${h - pad} Z`

  return (
    <div className="broto-home-metrics-placeholder">
      <section className="broto-dashboard-stats" aria-label="Indicadores de exemplo (mock)">
        <div className="broto-stats-card">
          <div className="broto-stat-item">
            <div className="broto-stat-item__head">
              <span className="broto-stat-item__label">Acerto</span>
              <div className="broto-stat-item__icon" aria-hidden>
                <Percent size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="broto-stat-item__val">
              <span className="broto-stat-item__val-main">72</span>
              <span className="broto-stat-item__unit">%</span>
            </div>
          </div>
          <div className="broto-stat-item">
            <div className="broto-stat-item__head">
              <span className="broto-stat-item__label">Questões</span>
              <div className="broto-stat-item__icon" aria-hidden>
                <BookOpen size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="broto-stat-item__val">
              <span className="broto-stat-item__val-main">128</span>
            </div>
          </div>
          <div className="broto-stat-item">
            <div className="broto-stat-item__head">
              <span className="broto-stat-item__label">Tempo</span>
              <div className="broto-stat-item__icon" aria-hidden>
                <Clock size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="broto-stat-item__val broto-stat-item__val--inline">
              <span className="broto-stat-item__val-main">2h 10m</span>
              <span className="broto-stat-item__suffix">/ 3h</span>
            </div>
          </div>
          <div className="broto-stat-item">
            <div className="broto-stat-item__head">
              <span className="broto-stat-item__label">Meta diária</span>
              <div className="broto-stat-item__icon" aria-hidden>
                <Target size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="broto-stat-item__val">
              <span className="broto-stat-item__val-main">85</span>
              <span className="broto-stat-item__unit">%</span>
            </div>
          </div>
        </div>
      </section>

      <div className="broto-home-metrics-placeholder__charts">
        <div className="broto-home-metrics-placeholder__chart">
          <div className="broto-home-metrics-placeholder__chart-head">
            <h3 className="broto-home-metrics-placeholder__chart-title">Ritmo na semana</h3>
            <span className="broto-home-metrics-placeholder__chart-pill" aria-hidden>
              <TrendingUp size={14} strokeWidth={2} />
              +12%
            </span>
          </div>
          <svg
            className="broto-home-metrics-placeholder__chart-svg broto-home-metrics-placeholder__chart-svg--line"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${rid}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green-400)" stopOpacity="0.45" />
                <stop offset="45%" stopColor="var(--green-400)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--green-400)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${rid}-stroke`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--teal-300)" />
                <stop offset="50%" stopColor="var(--teal-500)" />
                <stop offset="100%" stopColor="var(--teal-400)" />
              </linearGradient>
              <filter
                id={`${rid}-glow`}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="0.85" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={fillD}
              fill={`url(#${rid}-area)`}
              className="broto-home-metrics-placeholder__area-fill"
            />
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${rid}-stroke)`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.18"
              className="broto-home-metrics-placeholder__line-glow"
            />
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${rid}-stroke)`}
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${rid}-glow)`}
            />
            {linePoints2.map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="3.2"
                fill="var(--bg-card)"
                stroke="var(--green-400)"
                strokeWidth="1.6"
                className="broto-home-metrics-placeholder__line-dot"
              />
            ))}
          </svg>
          <div className="broto-home-metrics-placeholder__chart-axis">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div className="broto-home-metrics-placeholder__chart">
          <div className="broto-home-metrics-placeholder__chart-head">
            <h3 className="broto-home-metrics-placeholder__chart-title">Prática por área</h3>
            <span className="broto-home-metrics-placeholder__chart-legend" aria-hidden>
              <span className="broto-home-metrics-placeholder__dot broto-home-metrics-placeholder__dot--neutral" />{' '}
              volume relativo
            </span>
          </div>
          <svg
            className="broto-home-metrics-placeholder__chart-svg broto-home-metrics-placeholder__chart-svg--bars"
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              {barHs.map((_, i) => {
                const c = MOCK_BAR_FILLS[i] ?? '#64748b'
                return (
                  <linearGradient key={i} id={`${rid}-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="1" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.72" />
                  </linearGradient>
                )
              })}
            </defs>
            <line
              x1="8"
              y1="87"
              x2="292"
              y2="87"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeOpacity="0.5"
              strokeLinecap="round"
            />
            {barHs.map((pct, i) => {
              const n = barHs.length
              const gap = 11
              const barW = (300 - gap * (n + 1)) / n
              const x = gap + i * (barW + gap)
              const bh = (pct / 100) * 70
              const y = 87 - bh
              const rx = Math.max(3, Math.min(barW / 2 - 0.5, 11))
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(bh, 0)}
                  rx={rx}
                  ry={rx}
                  fill={`url(#${rid}-bar-${i})`}
                  className="broto-home-metrics-placeholder__bar"
                  style={{ animationDelay: `${0.05 + i * 0.055}s` }}
                />
              )
            })}
          </svg>
          <div className="broto-home-metrics-placeholder__chart-axis">
            {['LC', 'CH', 'CN', 'MT', 'Red.', 'Mat.', 'Outro'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
