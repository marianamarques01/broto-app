import { useMemo, useState, type CSSProperties } from 'react'
import {
  REDACAO_COMPETENCIAS,
  REDACAO_COMPETENCIA_COLORS,
  REDACAO_COMPETENCIA_SHORT,
  type RedacaoCompetencia,
  type RedacaoEvolucaoSerie,
} from '@broto/shared'

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 36 }
const Y_MAX = 200

type Props = {
  series: RedacaoEvolucaoSerie[]
}

function formatShortDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function buildPolyline(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

export function RedacaoEvolucaoChart({ series }: Props) {
  const [visible, setVisible] = useState<Record<RedacaoCompetencia, boolean>>({
    I: true,
    II: true,
    III: true,
    IV: true,
    V: true,
  })

  const maxPoints = useMemo(
    () => Math.max(1, ...series.map((item) => item.points.length)),
    [series],
  )

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const hasData = series.some((item) => item.points.length > 0)

  function toggleCompetencia(competencia: RedacaoCompetencia) {
    setVisible((current) => ({ ...current, [competencia]: !current[competencia] }))
  }

  if (!hasData) {
    return (
      <div className="broto-rx-evolucao-chart broto-rx-evolucao-chart--empty" role="status">
        <p>Envie redações corrigidas para ver seu gráfico de evolução.</p>
      </div>
    )
  }

  return (
    <section className="broto-rx-evolucao-chart" aria-labelledby="redacao-evolucao-chart-title">
      <div className="broto-rx-evolucao-chart__head">
        <h2 id="redacao-evolucao-chart-title" className="broto-rx-evolucao-chart__title">
          Evolução por competência
        </h2>
        <div className="broto-rx-evolucao-chart__legend" role="group" aria-label="Competências visíveis">
          {REDACAO_COMPETENCIAS.map((competencia) => {
            const isOn = visible[competencia]
            const color = REDACAO_COMPETENCIA_COLORS[competencia]
            return (
              <button
                key={competencia}
                type="button"
                className={`broto-rx-evolucao-chart__legend-btn${isOn ? ' broto-rx-evolucao-chart__legend-btn--on' : ''}`}
                style={{ '--comp-color': color } as CSSProperties}
                aria-pressed={isOn}
                onClick={() => toggleCompetencia(competencia)}
              >
                <span className="broto-rx-evolucao-chart__legend-dot" aria-hidden />
                Comp. {competencia} · {REDACAO_COMPETENCIA_SHORT[competencia]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="broto-rx-evolucao-chart__plot-wrap">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="broto-rx-evolucao-chart__svg"
          role="img"
          aria-label="Gráfico de linhas com notas por competência ao longo das redações"
        >
          {[0, 40, 80, 120, 160, 200].map((tick) => {
            const y = PADDING.top + plotHeight - (tick / Y_MAX) * plotHeight
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - PADDING.right}
                  y2={y}
                  className="broto-rx-evolucao-chart__grid"
                />
                <text x={PADDING.left - 8} y={y + 4} className="broto-rx-evolucao-chart__ylabel">
                  {tick}
                </text>
              </g>
            )
          })}

          {series.map((item) => {
            if (!visible[item.competencia] || item.points.length === 0) return null

            const coords = item.points.map((point, index) => {
              const x =
                PADDING.left +
                (maxPoints <= 1 ? plotWidth / 2 : (index / (maxPoints - 1)) * plotWidth)
              const y = PADDING.top + plotHeight - (point.nota / Y_MAX) * plotHeight
              return { x, y, point }
            })

            const color = REDACAO_COMPETENCIA_COLORS[item.competencia]

            return (
              <g key={item.competencia}>
                <path
                  d={buildPolyline(coords)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {coords.map(({ x, y, point }) => (
                  <circle
                    key={`${item.competencia}-${point.redacao_id}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={color}
                    className="broto-rx-evolucao-chart__dot"
                  >
                    <title>{`${REDACAO_COMPETENCIA_SHORT[item.competencia]}: ${point.nota} (${formatShortDate(point.created_at)})`}</title>
                  </circle>
                ))}
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
