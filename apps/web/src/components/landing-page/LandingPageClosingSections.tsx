import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  LP_AUDIENCE,
  LP_CTA_LABEL,
  LP_ENEM_PROOF,
  LP_FAQ,
  LP_FINAL_CTA,
} from '@/lib/landing-page-content'

/** Seção 8 — Prova: o caso ENEM (segunda quebra de ritmo, fundo escuro). */
export function EnemProofSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <section
      id="lp-casos-uso"
      className="blp-section blp-section--dark blp--center"
      aria-labelledby="lp-enem-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <p className="blp__eyebrow">{LP_ENEM_PROOF.eyebrow}</p>
          <h2 id="lp-enem-title" className="blp__h2">
            {LP_ENEM_PROOF.headline}
          </h2>
          {LP_ENEM_PROOF.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="blp__body-col">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="blp-enem__stats blp-reveal">
          {LP_ENEM_PROOF.stats.map((stat) => (
            <div key={stat.value} className="blp-enem__stat">
              <span className="blp-enem__stat-value">{stat.value}</span>
              <span className="blp-enem__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="blp-enem__cta blp-reveal">
          <button type="button" className="blp-btn blp-btn--on-dark" onClick={onOpenDemo}>
            {LP_CTA_LABEL}
          </button>
          <p className="blp__cta-microcopy">
            30 minutos · Sem compromisso · Veja com seus próprios materiais
          </p>
        </div>
      </div>
    </section>
  )
}

/** Seção 9 — Para quem é (5 cards de auto-identificação). */
export function AudienceSection() {
  return (
    <section
      id="lp-audience-extended"
      className="blp-section blp--center"
      aria-labelledby="lp-audience-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <h2 id="lp-audience-title" className="blp__h2">
            {LP_AUDIENCE.headline}
          </h2>
        </div>
        <div className="blp-audience__grid blp-reveal">
          {LP_AUDIENCE.cards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="blp-audience__card">
              <span className="blp-audience__icon" aria-hidden>
                <Icon size={20} strokeWidth={1.9} />
              </span>
              <h3 className="blp-audience__title">{title}</h3>
              <p className="blp-audience__text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Seção 10 — FAQ de objeções (primeiro item aberto por padrão). */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="lp-faq-extended"
      className="blp-section blp--center"
      aria-labelledby="lp-faq-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <h2 id="lp-faq-title" className="blp__h2">
            {LP_FAQ.headline}
          </h2>
        </div>
        <div className="blp-faq__list blp-reveal">
          {LP_FAQ.items.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `lp-faq-panel-${index}`
            return (
              <article key={item.q} className="blp-faq__item">
                <button
                  type="button"
                  className="blp-faq__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>“{item.q}”</span>
                  <ChevronDown
                    size={18}
                    className={`blp-faq__chevron${isOpen ? ' blp-faq__chevron--open' : ''}`}
                    aria-hidden
                  />
                </button>
                <div id={panelId} className="blp-faq__panel" hidden={!isOpen}>
                  <p>{item.a}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** Seção 11 — CTA final em bloco de cor de marca. */
export function FinalCtaSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <section className="blp-final" aria-labelledby="lp-final-title">
      <div className="blp__container">
        <div className="blp-final__band blp-reveal">
          <h2 id="lp-final-title" className="blp-final__title">
            {LP_FINAL_CTA.headline}
          </h2>
          <p className="blp-final__body">{LP_FINAL_CTA.body}</p>
          <button type="button" className="blp-btn blp-btn--on-dark" onClick={onOpenDemo}>
            {LP_CTA_LABEL}
          </button>
          <p className="blp-final__microcopy">{LP_FINAL_CTA.microcopy}</p>
        </div>
      </div>
    </section>
  )
}
