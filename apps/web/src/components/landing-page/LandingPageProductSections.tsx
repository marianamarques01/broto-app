import { useState } from 'react'
import { ArrowRight, CirclePlay, Plus } from 'lucide-react'
import {
  LP_APPLICATION_EXAMPLE,
  LP_FAQ_STYLED,
  LP_FICTIONAL_BRANDS,
  LP_PRODUCT,
  type LpFaqItem,
} from '@/lib/landing-page-content'
import { ProductStudyPlanMock } from './LandingPageMocks'

/** Seção — O produto (copy + mock do plano de estudos). */
export function ProductSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  const brand = LP_FICTIONAL_BRANDS[0]

  return (
    <section id="lp-produto" className="blp-section blp-product" aria-labelledby="lp-product-title">
      <div className="blp__container">
        <div className="blp-product__grid blp-reveal">
          <div className="blp-product__copy">
            <p className="blp-section-badge">{LP_PRODUCT.eyebrow}</p>
            <h2 id="lp-product-title" className="blp-product__title">
              {LP_PRODUCT.headline}
            </h2>
            {LP_PRODUCT.body.map((paragraph) => (
              <p key={paragraph.slice(0, 28)} className="blp-product__body">
                {paragraph}
              </p>
            ))}
            <button type="button" className="blp-btn blp-btn--outline" onClick={onOpenDemo}>
              <CirclePlay size={18} aria-hidden />
              {LP_PRODUCT.cta}
            </button>
          </div>
          <div className="blp-product__visual">
            <ProductStudyPlanMock brand={brand} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Seção — Exemplo de aplicação (texto + cards de resultados). */
export function ApplicationExampleSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <section
      id="lp-exemplo-aplicacao"
      className="blp-section blp-application"
      aria-labelledby="lp-application-title"
    >
      <div className="blp__container">
        <div className="blp-application__grid blp-reveal">
          <div className="blp-application__copy">
            <p className="blp-section-badge">{LP_APPLICATION_EXAMPLE.eyebrow}</p>
            <h2 id="lp-application-title" className="blp-application__title">
              {LP_APPLICATION_EXAMPLE.headline}
            </h2>
            {LP_APPLICATION_EXAMPLE.body.map((paragraph) => (
              <p key={paragraph.slice(0, 28)} className="blp-application__body">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="blp-application__stats">
            {LP_APPLICATION_EXAMPLE.stats.map((stat) => (
              <article key={stat.value} className="blp-application__stat">
                <span className="blp-application__stat-value">{stat.value}</span>
                <span className="blp-application__stat-label">{stat.label}</span>
              </article>
            ))}
            <article className="blp-application__stat blp-application__stat--note">
              <p className="blp-application__note">{LP_APPLICATION_EXAMPLE.note}</p>
              <button type="button" className="blp-application__note-link" onClick={onOpenDemo}>
                {LP_APPLICATION_EXAMPLE.noteLink}
                <ArrowRight size={14} aria-hidden />
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqColumn({
  items,
  columnIndex,
  openKey,
  onToggle,
}: {
  items: readonly LpFaqItem[]
  columnIndex: number
  openKey: string | null
  onToggle: (key: string) => void
}) {
  return (
    <div className="blp-faq-v2__column">
      {items.map((item, index) => {
        const key = `${columnIndex}-${index}`
        const isOpen = openKey === key
        const panelId = `lp-faq-v2-panel-${key}`
        return (
          <article key={item.q} className="blp-faq-v2__item">
            <button
              type="button"
              className="blp-faq-v2__trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => onToggle(key)}
            >
              <span>{item.q}</span>
              <span className={`blp-faq-v2__plus${isOpen ? ' blp-faq-v2__plus--open' : ''}`}>
                <Plus size={18} strokeWidth={2} aria-hidden />
              </span>
            </button>
            <div id={panelId} className="blp-faq-v2__panel" hidden={!isOpen}>
              <p>{item.a}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

/** Seção — Perguntas frequentes (grid 2 colunas, estilo da imagem). */
export function StyledFaqSection() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  const handleToggle = (key: string) => {
    setOpenKey((current) => (current === key ? null : key))
  }

  return (
    <section
      id="lp-faq"
      className="blp-section blp-faq-v2 blp--center"
      aria-labelledby="lp-faq-v2-title"
    >
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <p className="blp-section-badge">{LP_FAQ_STYLED.eyebrow}</p>
          <h2 id="lp-faq-v2-title" className="blp-faq-v2__title">
            {LP_FAQ_STYLED.headline}
          </h2>
        </div>
        <div className="blp-faq-v2__grid blp-reveal">
          {LP_FAQ_STYLED.columns.map((column, columnIndex) => (
            <FaqColumn
              key={columnIndex}
              items={column}
              columnIndex={columnIndex}
              openKey={openKey}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
