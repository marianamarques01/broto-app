import { BookOpen, Clock, Percent, Target, TrendingUp } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

/** Cores alinhadas aos eixos LC, CH, CN, MT, Red., Mat., Outro (áreas Broto + mock). */
const MOCK_BAR_FILLS = [
  AREA_CONFIG.linguagens.color,
  AREA_CONFIG['ciencias-humanas'].color,
  AREA_CONFIG['ciencias-natureza'].color,
  AREA_CONFIG.matematica.color,
  '#e879f9',
  AREA_CONFIG.matematica.color,
  '#64748b',
] as const

/**
 * Mock visual temporário para o dashboard quando os indicadores reais estão desligados.
 * Remover o uso em `Home.tsx` quando `SHOW_HOME_METRICS_SECTION` voltar a `true`.
 */
export function HomeDashboardMetricsPlaceholder() {
  const linePts = [38, 52, 44, 68, 58, 74, 63]
  const barHs = [44, 72, 55, 81, 62, 77, 69]
  const w = 300
  const h = 100
  const pad = 10
  const step = (w - pad * 2) / (linePts.length - 1)
  const pathD = linePts
    .map((p, i) => {
      const x = pad + i * step
      const y = h - pad - (p / 100) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
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
            className="broto-home-metrics-placeholder__chart-svg"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="broto-mock-line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green-400)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--green-400)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={fillD} fill="url(#broto-mock-line-fill)" />
            <path
              d={pathD}
              fill="none"
              stroke="var(--green-400)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            {barHs.map((pct, i) => {
              const n = barHs.length
              const gap = 10
              const barW = (300 - gap * (n + 1)) / n
              const x = gap + i * (barW + gap)
              const bh = (pct / 100) * 72
              const y = 88 - bh
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={bh}
                  rx={6}
                  fill={MOCK_BAR_FILLS[i] ?? '#64748b'}
                  fillOpacity={0.9}
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
