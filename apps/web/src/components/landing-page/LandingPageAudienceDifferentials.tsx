import type { CSSProperties } from 'react'
import {
  LP_DIFFERENTIALS,
  LP_TARGET_AUDIENCE,
  type LpTargetCardTheme,
} from '@/lib/landing-page-content'

const TARGET_THEME: Record<LpTargetCardTheme, { accent: string; soft: string; decor: string }> = {
  green: {
    accent: '#259360',
    soft: 'rgba(47, 181, 115, 0.12)',
    decor: 'rgba(47, 181, 115, 0.18)',
  },
  purple: {
    accent: '#7c5cfc',
    soft: 'rgba(124, 92, 252, 0.12)',
    decor: 'rgba(124, 92, 252, 0.18)',
  },
  blue: {
    accent: '#4a7fd4',
    soft: 'rgba(74, 127, 212, 0.12)',
    decor: 'rgba(74, 127, 212, 0.18)',
  },
  orange: {
    accent: '#d97917',
    soft: 'rgba(217, 121, 23, 0.12)',
    decor: 'rgba(217, 121, 23, 0.18)',
  },
}

/** Seção — Para quem é (4 cards temáticos). */
export function TargetAudienceSection() {
  return (
    <section
      id="lp-para-quem"
      className="blp-section blp-target blp--center"
      aria-labelledby="lp-target-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <p className="blp-section-badge">{LP_TARGET_AUDIENCE.eyebrow}</p>
          <h2 id="lp-target-title" className="blp-target__title">
            {LP_TARGET_AUDIENCE.headline}
          </h2>
        </div>
        <div className="blp-target__grid blp-reveal">
          {LP_TARGET_AUDIENCE.cards.map(({ icon: Icon, title, text, theme }) => {
            const colors = TARGET_THEME[theme]
            return (
              <article
                key={title}
                className="blp-target__card"
                style={
                  {
                    '--target-accent': colors.accent,
                    '--target-soft': colors.soft,
                    '--target-decor': colors.decor,
                  } as CSSProperties
                }
              >
                <span className="blp-target__icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <h3 className="blp-target__card-title">{title}</h3>
                <p className="blp-target__card-text">{text}</p>
                <div className="blp-target__decor" aria-hidden />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** Seção — Diferenciais (bloco verde escuro com 6 itens). */
export function DifferentialsSection() {
  return (
    <section className="blp-section blp-differentials-section" aria-labelledby="lp-diff-title">
      <div className="blp__container">
        <div id="lp-diferenciais" className="blp-differentials blp-reveal">
          <div className="blp-differentials__head">
            <p className="blp-section-badge blp-section-badge--on-dark">
              {LP_DIFFERENTIALS.eyebrow}
            </p>
            <h2 id="lp-diff-title" className="blp-differentials__title">
              {LP_DIFFERENTIALS.headline}
            </h2>
          </div>
          <div className="blp-differentials__grid">
            {LP_DIFFERENTIALS.items.map(({ icon: Icon, title, text }) => (
              <article key={title} className="blp-differentials__item">
                <span className="blp-differentials__icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3 className="blp-differentials__item-title">{title}</h3>
                <p className="blp-differentials__item-text">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
