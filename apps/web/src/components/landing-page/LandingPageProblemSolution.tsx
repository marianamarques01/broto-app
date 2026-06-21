import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Check } from 'lucide-react'
import { LP_PROBLEM, LP_SOLUTION } from '@/lib/landing-page-content'

/** Seção 2 — O desafio (problema). */
export function ChallengeSection() {
  return (
    <section
      id="lp-problema"
      className="blp-section blp-challenge blp--center"
      aria-labelledby="lp-challenge-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <p className="blp-section-badge">{LP_PROBLEM.eyebrow}</p>
          <h2 id="lp-challenge-title" className="blp-challenge__title">
            {LP_PROBLEM.headline}
          </h2>
        </div>
        <div className="blp-challenge__cards blp-reveal">
          {LP_PROBLEM.cards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="blp-challenge__card">
              <span className="blp-challenge__card-icon" aria-hidden>
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="blp-challenge__card-title">{title}</h3>
              <p className="blp-challenge__card-text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Seção 3 — A solução (motor + diagrama de fluxo). */
export function SolutionSection() {
  return (
    <section
      id="lp-solucao"
      className="blp-section blp-solution"
      aria-labelledby="lp-solution-title"
    >
      <div className="blp__container">
        <div className="blp-solution__grid blp-reveal">
          <div className="blp-solution__copy">
            <p className="blp-section-badge">{LP_SOLUTION.eyebrow}</p>
            <h2 id="lp-solution-title" className="blp-solution__title">
              {LP_SOLUTION.headline}
            </h2>
            <p className="blp-solution__body">{LP_SOLUTION.body}</p>
            <ul className="blp-solution__checklist">
              {LP_SOLUTION.checklist.map((item) => (
                <li key={item} className="blp-solution__check-item">
                  <span className="blp-solution__check-icon" aria-hidden>
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="blp-solution__flow" aria-hidden>
            <FlowCard title={LP_SOLUTION.inputs.title} items={LP_SOLUTION.inputs.items} />
            <span className="blp-solution__arrow">
              <ArrowRight size={22} strokeWidth={2} />
            </span>
            <div className="blp-solution__engine">
              <div className="blp-solution__engine-box">
                <span className="blp-solution__engine-sprout">🌱</span>
                <span className="blp-solution__engine-brand">broto</span>
                <span className="blp-solution__engine-label">{LP_SOLUTION.engineLabel}</span>
              </div>
              <div className="blp-solution__engine-pills">
                {LP_SOLUTION.enginePills.map((pill) => (
                  <span key={pill} className="blp-solution__engine-pill">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <span className="blp-solution__arrow">
              <ArrowRight size={22} strokeWidth={2} />
            </span>
            <FlowCard title={LP_SOLUTION.outputs.title} items={LP_SOLUTION.outputs.items} />
          </div>
        </div>
      </div>
    </section>
  )
}

function FlowCard({
  title,
  items,
}: {
  title: string
  items: readonly { icon: LucideIcon; label: string }[]
}) {
  return (
    <div className="blp-flow-card">
      <h3 className="blp-flow-card__title">{title}</h3>
      <ul className="blp-flow-card__list">
        {items.map(({ icon: Icon, label }) => (
          <li key={label} className="blp-flow-card__item">
            <span className="blp-flow-card__item-icon">
              <Icon size={14} strokeWidth={2} />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
