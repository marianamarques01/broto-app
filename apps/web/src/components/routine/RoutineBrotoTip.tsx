import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { AreaStat } from '@/hooks/useProgress'

/** Broto neutro — evolução por fase não é eixo do MVP na web. */
const BROTO_TIP_EMOJI = '\u{1F331}'

interface RoutineBrotoTipProps {
  areas: AreaStat[]
}

export function RoutineBrotoTip({ areas }: RoutineBrotoTipProps) {
  const brotoEmoji = BROTO_TIP_EMOJI
  const weakest = useMemo(() => {
    const withData = areas.filter((a) => a.totalAnswered >= 3)
    if (withData.length === 0) return null
    return [...withData].sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
  }, [areas])
  if (!weakest) {
    return (
      <div className="broto-routine-tip" role="note">
        <div className="broto-routine-tip__icon" aria-hidden>
          <span className="broto-routine-tip__emoji">{brotoEmoji}</span>
        </div>
        <div>
          <h3 className="broto-routine-tip__title">Dica do Broto</h3>
          <p className="broto-routine-tip__text">
            Responda algumas questões para eu sugerir onde focar na sua rotina.
          </p>
          <Link to="/#home-consistencia" className="broto-routine-tip__progress-link">
            Ver consistência na página inicial
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="broto-routine-tip" role="note">
      <div className="broto-routine-tip__icon" aria-hidden>
        <span className="broto-routine-tip__emoji">{brotoEmoji}</span>
      </div>
      <div>
        <h3 className="broto-routine-tip__title">Dica do Broto</h3>
        <p className="broto-routine-tip__text">
          Sua menor nota é em <strong>{weakest.label}</strong> ({weakest.accuracyPct}%). Que tal
          adicionar uma sessão extra esta semana?
        </p>
        <Link to="/#home-consistencia" className="broto-routine-tip__progress-link">
          Ver consistência na página inicial
        </Link>
      </div>
    </div>
  )
}
