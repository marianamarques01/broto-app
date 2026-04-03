import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'

export function PetCard() {
  const { pet, loading } = usePet()

  const fase = pet?.fase ?? 'semente'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpInLevel = xp % 100

  return (
    <div className="broto-pet-card">
      <div className="broto-pet-card__layout">
        <div className="broto-pet-avatar" aria-hidden>
          {loading ? '...' : FASE_EMOJI[fase]}
        </div>
        <div className="broto-pet-card__body">
          <p className="broto-pet-card__eyebrow">Seu Broto</p>
          <div className="broto-pet-card__title-row">
            <span className="broto-pet-card__phase">{loading ? '...' : FASE_LABEL[fase]}</span>
            <span className="broto-badge-level">Nv. {nivel}</span>
          </div>
          <div className="broto-pet-card__xp-block">
            <div className="broto-xp-track" aria-hidden>
              <div className="broto-xp-fill" style={{ width: `${loading ? 0 : xpInLevel}%` }} />
            </div>
            <span className="broto-pet-card__xp-caption">
              {loading ? '...' : `${xpInLevel} / 100 XP`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
