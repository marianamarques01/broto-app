import type { CSSProperties } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  REDACAO_COMPETENCIA_COLORS,
  REDACAO_COMPETENCIA_SHORT,
  REDACAO_COMPETENCIA_TITLES,
  type RedacaoCompetencia,
} from '@broto/shared'

type CompetenciaNotaCardProps = {
  competencia: RedacaoCompetencia
  nota: number
  justificativa: string
  isWeakest: boolean
  expanded: boolean
  onToggle: () => void
}

export function CompetenciaNotaCard({
  competencia,
  nota,
  justificativa,
  isWeakest,
  expanded,
  onToggle,
}: CompetenciaNotaCardProps) {
  const color = REDACAO_COMPETENCIA_COLORS[competencia]
  const pct = Math.round((nota / 200) * 100)

  return (
    <article
      className={`broto-rx-comp-card${isWeakest ? ' broto-rx-comp-card--weakest' : ''}${expanded ? ' broto-rx-comp-card--expanded' : ''}`}
      style={{ '--comp-color': color } as CSSProperties}
      data-competencia={competencia}
    >
      <button type="button" className="broto-rx-comp-card__header" onClick={onToggle}>
        <div className="broto-rx-comp-card__title-row">
          <span className="broto-rx-comp-card__badge" aria-hidden>
            {competencia}
          </span>
          <div className="broto-rx-comp-card__titles">
            <h3 className="broto-rx-comp-card__short">{REDACAO_COMPETENCIA_SHORT[competencia]}</h3>
            <p className="broto-rx-comp-card__long">{REDACAO_COMPETENCIA_TITLES[competencia]}</p>
          </div>
        </div>
        <div className="broto-rx-comp-card__score-col">
          {isWeakest ? (
            <span className="broto-rx-comp-card__weak-tag">
              <AlertTriangle size={12} aria-hidden />
              Mais fraca
            </span>
          ) : null}
          <span className="broto-rx-comp-card__score">
            <strong>{nota}</strong>
            <span>/200</span>
          </span>
        </div>
      </button>

      <div className="broto-rx-comp-card__bar" role="presentation" aria-hidden>
        <div className="broto-rx-comp-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {expanded ? (
        <div className="broto-rx-comp-card__body">
          <p className="broto-rx-comp-card__justificativa">
            {justificativa || 'Sem justificativa.'}
          </p>
        </div>
      ) : null}
    </article>
  )
}
