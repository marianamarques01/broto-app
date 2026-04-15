import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import type { AreaStat } from '@/hooks/useProgress'

interface RoutineBrotoTipProps {
  areas: AreaStat[]
}

export function RoutineBrotoTip({ areas }: RoutineBrotoTipProps) {
  const weakest = useMemo(() => {
    const withData = areas.filter((a) => a.totalAnswered >= 3)
    if (withData.length === 0) return null
    return [...withData].sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
  }, [areas])
  if (!weakest) {
    return (
      <aside className="broto-routine-tip">
        <div className="broto-routine-tip__icon" aria-hidden>
          <Sprout size={22} />
        </div>
        <div>
          <h3 className="broto-routine-tip__title">Dica do Broto</h3>
          <p className="broto-routine-tip__text">
            Responda algumas questões para eu sugerir onde focar na sua rotina.
          </p>
          <Link to="/progress#consistencia" className="broto-routine-tip__progress-link">
            Ver consistência no progresso
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className="broto-routine-tip">
      <div className="broto-routine-tip__icon" aria-hidden>
        <Sprout size={22} />
      </div>
      <div>
        <h3 className="broto-routine-tip__title">Dica do Broto</h3>
        <p className="broto-routine-tip__text">
          Sua menor nota é em <strong>{weakest.label}</strong> ({weakest.accuracyPct}%). Que tal
          adicionar uma sessão extra esta semana?
        </p>
        <Link to="/progress#consistencia" className="broto-routine-tip__progress-link">
          Ver consistência no progresso
        </Link>
      </div>
    </aside>
  )
}
