import { Check, X } from 'lucide-react'
import {
  LP_CTA_LABEL,
  LP_FICTIONAL_BRANDS,
  LP_PILLAR_MANAGER,
  LP_PILLAR_STUDENT,
  LP_PILLAR_WHITELABEL,
  type LpHighlight,
} from '@/lib/landing-page-content'
import {
  BrowserFrame,
  ManagerDashboardMock,
  StudentPhoneQuestionMock,
  StudentPhoneRoutineMock,
} from './LandingPageMocks'
import { WhiteLabelShowcase } from './WhiteLabelShowcase'

function HighlightList({ items }: { items: readonly LpHighlight[] }) {
  return (
    <ul className="blp-pillar__highlights">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="blp-pillar__highlight">
          <span className="blp-pillar__highlight-icon" aria-hidden>
            <Icon size={19} strokeWidth={1.9} />
          </span>
          <p className="blp-pillar__highlight-text">
            <strong>{title}:</strong> {text}
          </p>
        </li>
      ))}
    </ul>
  )
}

/** Seção 5 — Pilar 1: a experiência do aluno. */
export function StudentPillarSection() {
  const brand = LP_FICTIONAL_BRANDS[0]
  return (
    <section id="lp-pilar-aluno" className="blp-section" aria-labelledby="lp-student-title">
      <div className="blp__container">
        <div className="blp-pillar__grid blp-reveal">
          <div className="blp-pillar__copy">
            <p className="blp__eyebrow">{LP_PILLAR_STUDENT.eyebrow}</p>
            <h2 id="lp-student-title" className="blp__h2">
              {LP_PILLAR_STUDENT.headline}
            </h2>
            {LP_PILLAR_STUDENT.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="blp__body-col">
                {paragraph}
              </p>
            ))}
            <HighlightList items={LP_PILLAR_STUDENT.highlights} />
          </div>
          <div className="blp-pillar__visual">
            <div className="blp-phone-duo">
              <div className="blp-phone-duo__back">
                <StudentPhoneQuestionMock brand={brand} />
              </div>
              <div className="blp-phone-duo__front">
                <StudentPhoneRoutineMock brand={brand} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Seção 6 — Pilar 2: o painel do gestor (visual à esquerda, texto à direita). */
export function ManagerPillarSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  const brand = LP_FICTIONAL_BRANDS[0]
  return (
    <section className="blp-section" aria-labelledby="lp-manager-title">
      <div className="blp__container">
        <div className="blp-pillar__grid blp-pillar__grid--flip blp-reveal">
          <div className="blp-pillar__visual">
            <div className="blp-pillar__dash-wrap">
              <BrowserFrame url="painel.cursinhovetor.com.br">
                <ManagerDashboardMock brand={brand} />
              </BrowserFrame>
            </div>
          </div>
          <div className="blp-pillar__copy">
            <p className="blp__eyebrow">{LP_PILLAR_MANAGER.eyebrow}</p>
            <h2 id="lp-manager-title" className="blp__h2">
              {LP_PILLAR_MANAGER.headline}
            </h2>
            <p className="blp__body-col">{LP_PILLAR_MANAGER.body}</p>
            <HighlightList items={LP_PILLAR_MANAGER.highlights} />
            <div className="blp-pillar__cta">
              <button type="button" className="blp-btn blp-btn--primary" onClick={onOpenDemo}>
                {LP_CTA_LABEL}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Seção 7 — Pilar 3: white-label / sua marca. */
export function WhiteLabelSection() {
  const { comparison } = LP_PILLAR_WHITELABEL
  return (
    <section className="blp-section blp--center" aria-labelledby="lp-wl-title">
      <div className="blp__container">
        <div className="blp-section__head blp-reveal">
          <p className="blp__eyebrow">{LP_PILLAR_WHITELABEL.eyebrow}</p>
          <h2 id="lp-wl-title" className="blp__h2">
            {LP_PILLAR_WHITELABEL.headline}
          </h2>
          {LP_PILLAR_WHITELABEL.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="blp__body-col">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="blp-reveal">
          <WhiteLabelShowcase />
        </div>

        <div className="blp-wl__compare blp-reveal">
          <div className="blp-wl__compare-col">
            <p className="blp-wl__compare-head">{comparison.headers[0]}</p>
            {comparison.rows.map(([traditional]) => (
              <p key={traditional} className="blp-wl__compare-cell">
                <X
                  size={16}
                  className="blp-wl__compare-icon blp-wl__compare-icon--no"
                  aria-hidden
                />
                {traditional}
              </p>
            ))}
          </div>
          <div className="blp-wl__compare-col blp-wl__compare-col--broto">
            <p className="blp-wl__compare-head">{comparison.headers[1]}</p>
            {comparison.rows.map(([, broto]) => (
              <p key={broto} className="blp-wl__compare-cell">
                <Check
                  size={16}
                  className="blp-wl__compare-icon blp-wl__compare-icon--yes"
                  aria-hidden
                />
                {broto}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
