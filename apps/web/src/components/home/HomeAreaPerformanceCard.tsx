import type { CSSProperties } from 'react'

interface AreaPerformance {
  label: string
  percent: number
  color: string
}

const HOME_AREA_PERFORMANCE_MOCK: AreaPerformance[] = [
  { label: 'Linguagens', percent: 72, color: 'var(--teal-400)' },
  { label: 'Ciências Humanas', percent: 60, color: 'var(--gold-400)' },
  { label: 'Ciências da Natureza', percent: 48, color: 'var(--status-violet)' },
  { label: 'Matemática', percent: 55, color: 'var(--status-sky)' },
]

export function HomeAreaPerformanceCard() {
  return (
    <section className="broto-area-performance-card" aria-labelledby="home-area-performance-title">
      <header className="broto-area-performance-card__head">
        <p className="broto-area-performance-card__eyebrow">Indicadores</p>
        <h2 id="home-area-performance-title" className="broto-area-performance-card__title">
          Desempenho por área
        </h2>
        <p className="broto-area-performance-card__subtitle">
          Uma leitura rápida de onde seu estudo está criando raiz.
        </p>
      </header>

      <div className="broto-area-performance-card__grid">
        {HOME_AREA_PERFORMANCE_MOCK.map((area) => (
          <div
            className="broto-area-performance-card__area"
            key={area.label}
            style={
              {
                '--area-performance-color': area.color,
                '--area-performance-percent': `${area.percent}%`,
              } as CSSProperties
            }
          >
            <div className="broto-area-performance-card__area-top">
              <span>{area.label}</span>
              <strong>{area.percent}%</strong>
            </div>
            <span
              className="broto-area-performance-card__track"
              role="progressbar"
              aria-label={`${area.label}: ${area.percent}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={area.percent}
            >
              <span className="broto-area-performance-card__fill" />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
