import { useCallback, useState } from 'react'
import { ArrowRight, CirclePlay, FileText, ListChecks, NotebookText } from 'lucide-react'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import {
  LP_CTA_LABEL,
  LP_FICTIONAL_BRANDS,
  LP_FOOTER_TAGLINE,
  LP_HERO,
  LP_HOW_IT_WORKS,
  LP_PAGE_DESCRIPTION,
  LP_PAGE_TITLE,
} from '@/lib/landing-page-content'
import { LandingPageNavbar } from '@/components/landing-page/LandingPageNavbar'
import {
  ChallengeSection,
  SolutionSection,
} from '@/components/landing-page/LandingPageProblemSolution'
import {
  DifferentialsSection,
  TargetAudienceSection,
} from '@/components/landing-page/LandingPageAudienceDifferentials'
import {
  ApplicationExampleSection,
  ProductSection,
  StyledFaqSection,
} from '@/components/landing-page/LandingPageProductSections'
import { DemoFormModal } from '@/components/landing-page/DemoFormModal'
import {
  BrowserFrame,
  HeroOverviewDashboardMock,
  HeroPhoneMock,
  ManagerDashboardMock,
  StudentPhoneRoutineMock,
} from '@/components/landing-page/LandingPageMocks'
import {
  ManagerPillarSection,
  StudentPillarSection,
  WhiteLabelSection,
} from '@/components/landing-page/LandingPagePillars'
import {
  AudienceSection,
  EnemProofSection,
  FaqSection,
  FinalCtaSection,
} from '@/components/landing-page/LandingPageClosingSections'
import '@/styles/landing-page.css'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Visual ilustrativo do passo 1: materiais da instituição sendo absorvidos. */
function UploadMiniCard() {
  return (
    <div className="blp-minicard" aria-hidden>
      <div className="blp-minicard__row blp-minicard__row--solid">
        <FileText size={16} className="blp-minicard__row-icon" />
        Apostila — Funções.pdf
        <span className="blp-minicard__tag">vivo</span>
      </div>
      <div className="blp-minicard__row blp-minicard__row--solid">
        <ListChecks size={16} className="blp-minicard__row-icon" />
        Lista de questões — Termologia
        <span className="blp-minicard__tag">vivo</span>
      </div>
      <div className="blp-minicard__row">
        <NotebookText size={16} className="blp-minicard__row-icon" />
        Resumo — Era Vargas.pdf
        <span className="blp-minicard__tag">processando…</span>
      </div>
    </div>
  )
}

const HERO_AVATAR_COLORS = ['#7eb8a8', '#c4a882', '#8899cc', '#b8889a'] as const

export function LandingPage() {
  usePageMeta({ title: LP_PAGE_TITLE, description: LP_PAGE_DESCRIPTION })
  const rootRef = useRevealOnScroll<HTMLDivElement>()
  const [demoOpen, setDemoOpen] = useState(false)
  const openDemo = useCallback(() => setDemoOpen(true), [])
  const closeDemo = useCallback(() => setDemoOpen(false), [])

  const heroBrand = LP_FICTIONAL_BRANDS[0]
  const stepVisuals = [
    <UploadMiniCard key="upload" />,
    <StudentPhoneRoutineMock key="phone" brand={heroBrand} />,
    <div key="dash" className="blp-pillar__dash-wrap">
      <BrowserFrame url="painel.cursinhovetor.com.br">
        <ManagerDashboardMock brand={heroBrand} />
      </BrowserFrame>
    </div>,
  ]

  return (
    <div ref={rootRef} className="blp">
      <LandingPageNavbar onOpenDemo={openDemo} />

      <main>
        {/* 1. Hero */}
        <section id="top" className="blp-hero" aria-labelledby="lp-hero-title">
          <div className="blp-hero__leaf" aria-hidden />
          <div className="blp__container">
            <div className="blp-hero__grid">
              <div className="blp-hero__copy">
                <h1 id="lp-hero-title" className="blp-hero__title">
                  {LP_HERO.headlineBefore}
                  <span className="blp-hero__title-accent">{LP_HERO.headlineHighlight}</span>
                </h1>
                <p className="blp-hero__sub">{LP_HERO.sub}</p>
                <ul className="blp-hero__features" aria-label="Capacidades da plataforma">
                  {LP_HERO.features.map(({ icon: Icon, label }) => (
                    <li key={label} className="blp-hero__feature">
                      <span className="blp-hero__feature-icon" aria-hidden>
                        <Icon size={15} strokeWidth={2} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
                <div className="blp-hero__actions">
                  <button type="button" className="blp-btn blp-btn--dark" onClick={openDemo}>
                    {LP_CTA_LABEL}
                    <ArrowRight size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="blp-btn blp-btn--outline"
                    onClick={() => scrollToId('lp-como-funciona')}
                  >
                    <CirclePlay size={18} aria-hidden />
                    {LP_HERO.ctaSecondary}
                  </button>
                </div>
                <div className="blp-hero__social">
                  <div className="blp-hero__avatars" aria-hidden>
                    {HERO_AVATAR_COLORS.map((color, index) => (
                      <span
                        key={color}
                        className="blp-hero__avatar"
                        style={{ background: color, zIndex: HERO_AVATAR_COLORS.length - index }}
                      />
                    ))}
                  </div>
                  <p className="blp-hero__social-text">{LP_HERO.socialProof}</p>
                </div>
              </div>
              <div className="blp-hero__visual">
                <div className="blp-hero__decor blp-hero__decor--waves" aria-hidden />
                <div className="blp-hero__decor blp-hero__decor--dots" aria-hidden />
                <div className="blp-hero-dash-wrap">
                  <HeroOverviewDashboardMock brand={heroBrand} />
                </div>
                <div className="blp-hero__phone-wrap">
                  <HeroPhoneMock brand={heroBrand} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <ChallengeSection />
        <SolutionSection />
        <TargetAudienceSection />
        <DifferentialsSection />
        <ProductSection onOpenDemo={openDemo} />
        <ApplicationExampleSection onOpenDemo={openDemo} />
        <StyledFaqSection />

        {/* 4. A Virada (como funciona) */}
        <section
          id="lp-como-funciona"
          className="blp-section blp--center"
          aria-labelledby="lp-how-title"
        >
          <div className="blp__container">
            <div className="blp-section__head blp-reveal">
              <h2 id="lp-how-title" className="blp__h2">
                {LP_HOW_IT_WORKS.headline}
              </h2>
            </div>
            <ol className="blp-how__steps">
              {LP_HOW_IT_WORKS.steps.map((step, index) => (
                <li key={step.n} className="blp-how__step blp-reveal">
                  <div className="blp-how__step-copy">
                    <span className="blp-how__step-num">{step.n}</span>
                    <h3 className="blp-how__step-title">{step.title}</h3>
                    <p className="blp-how__step-text">{step.text}</p>
                  </div>
                  <div className="blp-how__step-visual">{stepVisuals[index]}</div>
                </li>
              ))}
            </ol>
            <div className="blp-how__cta blp-reveal">
              <button type="button" className="blp-textlink" onClick={openDemo}>
                {LP_HOW_IT_WORKS.ctaContext} {LP_CTA_LABEL}
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {/* 5–7. Pilares */}
        <StudentPillarSection />
        <ManagerPillarSection onOpenDemo={openDemo} />
        <WhiteLabelSection />

        {/* 8–11. Prova, ICPs, FAQ e CTA final */}
        <EnemProofSection onOpenDemo={openDemo} />
        <AudienceSection />
        <FaqSection />
        <FinalCtaSection onOpenDemo={openDemo} />
      </main>

      <footer className="blp-footer">
        <div className="blp-footer__inner">
          <div>
            <p className="blp-footer__brand">
              broto<span className="blp-nav__brand-dot">.</span>
            </p>
            <p className="blp-footer__tagline">{LP_FOOTER_TAGLINE}</p>
          </div>
          <nav className="blp-footer__nav" aria-label="Links do rodapé">
            <a href="mailto:contato@broto.app">Contato</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <span>Política de Privacidade</span>
            <span>LGPD</span>
            <span>© {new Date().getFullYear()} Broto</span>
          </nav>
        </div>
      </footer>

      <DemoFormModal open={demoOpen} onClose={closeDemo} />
    </div>
  )
}
