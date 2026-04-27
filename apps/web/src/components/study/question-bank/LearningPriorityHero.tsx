import type { QuestionBankPrimaryAction } from '@broto/shared'
import { Sparkles } from 'lucide-react'

export interface LearningPriorityHeroProps {
  primary: QuestionBankPrimaryAction | null
  loading: boolean
  onStart: () => void
  areaAccent: string
}

export function LearningPriorityHero({
  primary,
  loading,
  onStart,
  areaAccent,
}: LearningPriorityHeroProps) {
  if (loading) {
    return (
      <section className="broto-qbank-hero" aria-busy="true" aria-label="A carregar sugestão">
        <div className="broto-qbank-hero-skel broto-skeleton" />
      </section>
    )
  }

  if (!primary) {
    return (
      <section className="broto-qbank-hero broto-qbank-hero--empty" aria-live="polite">
        <p className="broto-qbank-hero-headline">Carrega o banco para veres sugestões personalizadas.</p>
      </section>
    )
  }

  return (
    <section
      className="broto-qbank-hero"
      style={{ borderColor: `${areaAccent}33` }}
      aria-live="polite"
    >
      <div className="broto-qbank-hero-icon" style={{ color: areaAccent }} aria-hidden>
        <Sparkles size={22} strokeWidth={1.75} />
      </div>
      <div className="broto-qbank-hero-body">
        <h3 className="broto-qbank-hero-headline">{primary.headline}</h3>
        <p className="broto-qbank-hero-sub">{primary.subline}</p>
        <p className="broto-qbank-hero-trust">{primary.trustLine}</p>
        <button
          type="button"
          className="broto-qbank-hero-cta"
          style={{ background: areaAccent }}
          onClick={onStart}
          disabled={!primary.targetRow}
        >
          Começar a praticar
        </button>
      </div>
    </section>
  )
}
