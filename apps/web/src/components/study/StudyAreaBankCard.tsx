import type { CSSProperties } from 'react'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

export type StudyAreaBankCardProps = {
  areaKey: string
  onBankClick: () => void
  className?: string
}

export function StudyAreaBankCard({ areaKey, onBankClick, className = '' }: StudyAreaBankCardProps) {
  const cfg = AREA_CONFIG[areaKey]

  return (
    <button
      type="button"
      className={`study-banco${className ? ` ${className}` : ''}`}
      onClick={onBankClick}
      style={
        {
          textAlign: 'left',
          '--study-banco-accent': cfg?.color ?? '#2dd4a8',
        } as CSSProperties
      }
    >
      <div className="study-banco__head">
        <div className="study-banco__icon">
          <ClipboardList size={16} strokeWidth={1.8} aria-hidden />
        </div>
        <h4 className="study-banco__title">Banco de questões</h4>
      </div>
      <p className="study-banco__desc">
        Pratique com filtros por ano, tópico e dificuldade — fora do pacote guiado.
      </p>
      <div className="study-banco__arrow">
        Abrir banco
        <ChevronRight size={14} strokeWidth={2} aria-hidden />
      </div>
    </button>
  )
}
