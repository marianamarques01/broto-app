import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Timer, ChevronRight } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

export type StudyAreaSessionCardProps = {
  areaKey: string
  className?: string
}

export function StudyAreaSessionCard({ areaKey, className = '' }: StudyAreaSessionCardProps) {
  const cfg = AREA_CONFIG[areaKey]
  const to = `/study/mock-exam?area=${encodeURIComponent(areaKey)}`

  return (
    <Link
      to={to}
      className={`study-banco${className ? ` ${className}` : ''}`}
      style={
        {
          '--study-banco-accent': cfg?.color ?? '#2dd4a8',
        } as CSSProperties
      }
      aria-label={`Criar sessão ENEM para ${cfg?.label ?? 'esta área'}`}
    >
      <div className="study-banco__head">
        <div className="study-banco__icon">
          <Timer size={16} strokeWidth={1.8} aria-hidden />
        </div>
        <h4 className="study-banco__title">Sessão ENEM</h4>
      </div>
      <p className="study-banco__desc">
        Monte um bloco tipo simulado só nesta área — quantidade, anos e cronômetro opcional.
      </p>
      <div className="study-banco__arrow">
        Montar sessão
        <ChevronRight size={14} strokeWidth={2} aria-hidden />
      </div>
    </Link>
  )
}
