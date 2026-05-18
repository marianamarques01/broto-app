import { Link } from 'react-router-dom'
import { usePageMeta, DEFAULT_PAGE_DESCRIPTION, DEFAULT_PAGE_TITLE } from '@/hooks/usePageMeta'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Sprout,
  Target,
  ChevronRight,
} from 'lucide-react'

const LANDING_FIREFLIES = [
  { left: '8%', top: '18%', color: 'var(--green-400)', duration: '4.4s', delay: '0s' },
  { left: '88%', top: '12%', color: 'var(--gold-400)', duration: '5.2s', delay: '1.1s' },
  { left: '22%', top: '72%', color: 'var(--green-300)', duration: '3.6s', delay: '0.4s' },
  { left: '72%', top: '68%', color: 'var(--gold-300)', duration: '4.8s', delay: '2s' },
  { left: '48%', top: '38%', color: 'var(--teal-400)', duration: '5.6s', delay: '0.8s' },
  { left: '15%', top: '52%', color: 'var(--gold-400)', duration: '4.1s', delay: '1.6s' },
  { left: '92%', top: '44%', color: 'var(--green-400)', duration: '3.9s', delay: '0.2s' },
]

const AREA_CHIPS = [
  { key: 'linguagens', label: 'Linguagens', cssVar: 'var(--area-linguagens)' },
  { key: 'humanas', label: 'Humanas', cssVar: 'var(--area-humanas)' },
  { key: 'natureza', label: 'Natureza', cssVar: 'var(--area-natureza)' },
  { key: 'matematica', label: 'Matemática', cssVar: 'var(--area-matematica)' },
] as const

const VALUE_ITEMS = [
  {
    icon: BookOpen,
    title: 'Questões por área',
    text: 'Pratique no ritmo certo, com foco nas competências do ENEM.',
  },
  {
    icon: CalendarDays,
    title: 'Rotina que cabe no seu dia',
    text: 'Organize blocos de estudo alinhados ao tempo que você tem disponível.',
  },
  {
    icon: Sprout,
    title: 'Broto que cresce com você',
    text: 'Gamificação leve para manter constância sem perder o foco no aprendizado.',
  },
  {
    icon: Target,
    title: 'Sessões no estilo prova',
    text: 'Monte blocos tipo simulado e acompanhe seu progresso ao longo do tempo.',
  },
] as const

const STEPS = [
  {
    n: '1',
    title: 'Crie sua conta',
    text: 'Entre com e-mail e defina como prefere estudar.',
  },
  {
    n: '2',
    title: 'Escolha áreas e metas',
    text: 'Monte sua rotina e abra o banco de questões quando quiser.',
  },
  {
    n: '3',
    title: 'Pratique e evolua',
    text: 'Responda, revise e acompanhe métricas no painel de progresso.',
  },
] as const

export function Landing() {
  usePageMeta({ title: DEFAULT_PAGE_TITLE, description: DEFAULT_PAGE_DESCRIPTION })
  return (
    <div className="broto-landing">
      {LANDING_FIREFLIES.map((f, i) => (
        <div
          key={i}
          className="broto-firefly"
          style={{
            left: f.left,
            top: f.top,
            background: f.color,
            boxShadow: `0 0 8px ${f.color}`,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
          aria-hidden
        />
      ))}

      <header className="broto-landing__header">
        <Link to="/inicio" className="broto-landing__brand" aria-current="page">
          broto
        </Link>
        <nav className="broto-landing__nav" aria-label="Ações principais">
          <Link to="/login" className="broto-btn-ghost broto-btn-ghost--inline">
            Entrar
          </Link>
          <Link to="/signup" className="broto-btn-primary broto-btn-primary--inline">
            Começar grátis
          </Link>
        </nav>
      </header>

      <main className="broto-landing__main">
        <section className="broto-landing__hero" aria-labelledby="landing-hero-title">
          <div className="broto-landing__hero-copy">
            <p className="broto-landing__eyebrow">ENEM com método e leveza</p>
            <h1 id="landing-hero-title" className="broto-landing__title">
              Estude com propósito.{' '}
              <span className="broto-landing__title-accent">Floresça no ENEM.</span>
            </h1>
            <p className="broto-landing__lead">
              O Broto reúne questões, rotina e acompanhamento em um só lugar — para você manter o
              ritmo sem se perder no caos da preparação.
            </p>
            <div className="broto-landing__hero-cta">
              <Link to="/signup" className="broto-btn-primary broto-btn-primary--inline">
                Criar conta
                <ChevronRight size={18} aria-hidden />
              </Link>
              <Link to="/login" className="broto-btn-secondary broto-btn-secondary--inline">
                Já tenho conta
              </Link>
            </div>
          </div>
          <div className="broto-landing__hero-visual" aria-hidden>
            <div className="broto-landing__hero-card broto-card">
              <p className="broto-section-label broto-landing__hero-card-label">Áreas do ENEM</p>
              <ul className="broto-landing__area-list">
                {AREA_CHIPS.map((a) => (
                  <li key={a.key} className="broto-landing__area-item">
                    <span
                      className="broto-landing__area-dot"
                      style={{ background: a.cssVar }}
                    />
                    {a.label}
                  </li>
                ))}
              </ul>
              <div className="broto-landing__hero-card-footer">
                <ClipboardList size={18} className="broto-landing__hero-card-icon" aria-hidden />
                <span>Rotina + banco + progresso</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="broto-landing__section broto-landing__value"
          aria-labelledby="landing-value-heading"
        >
          <div className="broto-landing__section-head">
            <h2 id="landing-value-heading" className="broto-landing__section-title">
              Tudo que você precisa para ir fundo na preparação
            </h2>
            <p className="broto-landing__section-desc">
              Ferramentas pensadas para o estudante que quer consistência, não só mais uma lista de
              links.
            </p>
          </div>
          <div className="broto-landing__value-grid">
            {VALUE_ITEMS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="broto-landing__value-card broto-card">
                <div className="broto-landing__value-icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="broto-landing__value-title">{title}</h3>
                <p className="broto-landing__value-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="broto-landing__section broto-landing__steps"
          aria-labelledby="landing-steps-heading"
        >
          <div className="broto-landing__section-head broto-landing__section-head--narrow">
            <h2 id="landing-steps-heading" className="broto-landing__section-title">
              Como funciona
            </h2>
            <p className="broto-landing__section-desc">
              Três passos para sair do zero e manter o ritmo até o dia da prova.
            </p>
          </div>
          <ol className="broto-landing__steps-list">
            {STEPS.map((step) => (
              <li key={step.n} className="broto-landing__step">
                <span className="broto-landing__step-num">{step.n}</span>
                <div>
                  <h3 className="broto-landing__step-title">{step.title}</h3>
                  <p className="broto-landing__step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="broto-landing__cta-band" aria-labelledby="landing-cta-heading">
          <div className="broto-landing__cta-inner">
            <h2 id="landing-cta-heading" className="broto-landing__cta-title">
              Pronto para colocar a preparação em dia?
            </h2>
            <p className="broto-landing__cta-desc">
              Leva menos de um minuto para começar. Você ajusta turma e rotina quando quiser.
            </p>
            <div className="broto-landing__cta-actions">
              <Link to="/signup" className="broto-btn-primary broto-btn-primary--inline">
                Criar minha conta
              </Link>
              <Link to="/login" className="broto-btn-ghost broto-btn-ghost--inline">
                Entrar
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="broto-landing__footer">
        <p className="broto-landing__footer-copy">broto — estude &amp; floresça</p>
        <p className="broto-landing__footer-note">© {new Date().getFullYear()} Broto</p>
      </footer>
    </div>
  )
}
