import { FormEvent, useCallback, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  AUDIENCE_ITEMS,
  DEMO_FORM_SEGMENTS,
  DIFFERENTIALS,
  FAQ_ITEMS,
  HOW_IT_WORKS_STEPS,
  IMPLEMENTATION_WEEKS,
  NAV_ANCHORS,
  PLATFORM_VIEWS,
  PROBLEM_ITEMS,
  TRUST_ITEMS,
  USE_CASES,
} from '@/lib/institutions-landing-content'
import {
  HERO_VARIANTS,
  resolveInstitutionsLandingVariant,
  type InstitutionsLandingVariant,
} from '@/lib/institutions-landing-variant'

const PAGE_TITLE = 'Broto para instituições — aprendizagem adaptativa'
const PAGE_DESCRIPTION =
  'Transforme o conteúdo da sua instituição em jornadas personalizadas de aprendizagem, com visibilidade pedagógica para coordenadores e gestores.'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function VariantDevBadge({
  variant,
  show,
}: {
  variant: InstitutionsLandingVariant
  show: boolean
}) {
  if (!show) return null
  return (
    <div className="broto-inst__variant-badge" role="status" aria-live="polite">
      Variante {variant.toUpperCase()} ·{' '}
      <Link to={`/instituicoes?variant=${variant === 'a' ? 'b' : 'a'}&preview=1`}>
        ver {variant === 'a' ? 'B' : 'A'}
      </Link>
    </div>
  )
}

export function InstitutionsLanding() {
  const [searchParams] = useSearchParams()
  const variant = useMemo(() => resolveInstitutionsLandingVariant(searchParams), [searchParams])
  const hero = HERO_VARIANTS[variant]
  const showVariantBadge = searchParams.get('preview') === '1'
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const formId = useId()

  usePageMeta({ title: PAGE_TITLE, description: PAGE_DESCRIPTION })

  const handleDemoSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDemoSubmitted(true)
  }, [])

  return (
    <div className="broto-inst">
      <VariantDevBadge variant={variant} show={showVariantBadge} />

      <header className="broto-inst__header">
        <Link to="/instituicoes" className="broto-inst__brand">
          broto
        </Link>
        <nav className="broto-inst__header-nav" aria-label="Seções da página">
          {NAV_ANCHORS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="broto-inst__nav-link"
              onClick={() => scrollToId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="broto-inst__header-actions">
          <Link
            to="/login"
            className="broto-btn-ghost broto-btn-ghost--inline broto-inst__access-link"
          >
            Acesso aluno
          </Link>
          <button
            type="button"
            className="broto-btn-primary broto-btn-primary--inline"
            onClick={() => scrollToId('contato')}
          >
            Agendar demonstração
          </button>
        </div>
      </header>

      <main className="broto-inst__main">
        <section className="broto-inst__hero" aria-labelledby="inst-hero-title">
          <div className="broto-inst__hero-copy">
            <p className="broto-inst__eyebrow">{hero.eyebrow}</p>
            <h1 id="inst-hero-title" className="broto-inst__title">
              {hero.title} <span className="broto-inst__title-accent">{hero.titleAccent}</span>
            </h1>
            <p className="broto-inst__lead">{hero.lead}</p>
            <div className="broto-inst__hero-cta">
              <button
                type="button"
                className="broto-btn-primary broto-btn-primary--inline"
                onClick={() => scrollToId('contato')}
              >
                Agendar demonstração
                <ChevronRight size={18} aria-hidden />
              </button>
              <button
                type="button"
                className="broto-btn-secondary broto-btn-secondary--inline"
                onClick={() => scrollToId('como-funciona')}
              >
                Ver como funciona
              </button>
            </div>
            <p className="broto-inst__hero-note">
              Demonstração gratuita · Sem compromisso · Resposta em 1 dia útil
            </p>
          </div>

          <div className="broto-inst__hero-visual" aria-hidden>
            <div className="broto-inst__mock-split">
              <article className="broto-inst__mock-panel broto-card">
                <div className="broto-inst__mock-head">
                  <LayoutDashboard size={18} />
                  <span>Painel do gestor</span>
                </div>
                <ul className="broto-inst__mock-stats">
                  <li>
                    <strong>128</strong>
                    <span>alunos ativos</span>
                  </li>
                  <li>
                    <strong>73%</strong>
                    <span>consistência semanal</span>
                  </li>
                  <li>
                    <strong>12</strong>
                    <span>alunos em atenção</span>
                  </li>
                </ul>
                <p className="broto-inst__mock-caption">Indicadores por turma e por aluno</p>
              </article>
              <article className="broto-inst__mock-panel broto-card broto-inst__mock-panel--student">
                <div className="broto-inst__mock-head">
                  <Sparkles size={18} />
                  <span>Experiência do aluno</span>
                </div>
                <p className="broto-inst__mock-routine">Rotina de hoje · 45 min</p>
                <div className="broto-inst__mock-progress">
                  <span style={{ width: '68%' }} />
                </div>
                <p className="broto-inst__mock-caption">Trilha personalizada com seu material</p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="broto-inst__section broto-inst__problem"
          aria-labelledby="inst-problem-title"
        >
          <div className="broto-inst__section-head">
            <h2 id="inst-problem-title" className="broto-inst__section-title">
              Você já tem conteúdo excelente. O difícil é fazer o aluno usar — e saber se funcionou.
            </h2>
          </div>
          <div className="broto-inst__problem-grid">
            {PROBLEM_ITEMS.map((item) => (
              <article key={item.title} className="broto-inst__problem-card broto-card">
                <h3 className="broto-inst__card-title">{item.title}</h3>
                <p className="broto-inst__card-text">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="broto-inst__section-bridge">
            O Broto conecta o que você já produziu à rotina diária do aluno — e devolve indicadores
            acionáveis para quem cuida da turma.
          </p>
        </section>

        <section
          id="como-funciona"
          className="broto-inst__section broto-inst__how"
          aria-labelledby="inst-how-title"
        >
          <div className="broto-inst__section-head broto-inst__section-head--narrow">
            <h2 id="inst-how-title" className="broto-inst__section-title">
              Do upload ao acompanhamento em quatro passos
            </h2>
          </div>
          <ol className="broto-inst__steps-list">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.n} className="broto-inst__step">
                <span className="broto-inst__step-num">{step.n}</span>
                <div>
                  <h3 className="broto-inst__step-title">{step.title}</h3>
                  <p className="broto-inst__step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="broto-inst__section-cta">
            <button
              type="button"
              className="broto-btn-secondary broto-btn-secondary--inline"
              onClick={() => scrollToId('contato')}
            >
              Quero ver na prática
            </button>
          </div>
        </section>

        <section
          id="para-quem"
          className="broto-inst__section broto-inst__audience"
          aria-labelledby="inst-audience-title"
        >
          <div className="broto-inst__section-head">
            <h2 id="inst-audience-title" className="broto-inst__section-title">
              Feito para quem forma pessoas — não só distribui conteúdo
            </h2>
          </div>
          <div className="broto-inst__audience-grid">
            {AUDIENCE_ITEMS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="broto-inst__audience-card broto-card">
                <div className="broto-inst__icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="broto-inst__card-title">{title}</h3>
                <p className="broto-inst__card-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="broto-inst__section broto-inst__platform"
          aria-labelledby="inst-platform-title"
        >
          <div className="broto-inst__section-head">
            <h2 id="inst-platform-title" className="broto-inst__section-title">
              Uma experiência para o aluno. Controle total para a instituição.
            </h2>
          </div>
          <div className="broto-inst__platform-grid">
            {(['admin', 'student'] as const).map((key) => (
              <article key={key} className="broto-inst__platform-card broto-card">
                <h3 className="broto-inst__platform-label">{PLATFORM_VIEWS[key].label}</h3>
                <ul className="broto-inst__platform-list">
                  {PLATFORM_VIEWS[key].items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="broto-inst__platform-note">
            Gamificação leve sustenta o hábito — sem infantilizar a experiência.
          </p>
        </section>

        <section className="broto-inst__section broto-inst__diff" aria-labelledby="inst-diff-title">
          <div className="broto-inst__section-head">
            <h2 id="inst-diff-title" className="broto-inst__section-title">
              Por que instituições escolhem o Broto
            </h2>
          </div>
          <div className="broto-inst__diff-grid">
            {DIFFERENTIALS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="broto-inst__diff-card broto-card">
                <div className="broto-inst__icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="broto-inst__card-title">{title}</h3>
                <p className="broto-inst__card-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="broto-inst__section broto-inst__cases"
          aria-labelledby="inst-cases-title"
        >
          <div className="broto-inst__section-head">
            <h2 id="inst-cases-title" className="broto-inst__section-title">
              Onde o Broto se aplica hoje
            </h2>
          </div>
          <div className="broto-inst__cases-grid">
            {USE_CASES.map((item) => (
              <article key={item.title} className="broto-inst__case-card broto-card">
                <div className="broto-inst__case-head">
                  <h3 className="broto-inst__card-title">{item.title}</h3>
                  {item.badge ? <span className="broto-inst__case-badge">{item.badge}</span> : null}
                </div>
                <p className="broto-inst__card-text">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="broto-inst__section broto-inst__timeline"
          aria-labelledby="inst-timeline-title"
        >
          <div className="broto-inst__section-head broto-inst__section-head--narrow">
            <h2 id="inst-timeline-title" className="broto-inst__section-title">
              Operacional em semanas — não um projeto de um ano
            </h2>
          </div>
          <ol className="broto-inst__timeline-list">
            {IMPLEMENTATION_WEEKS.map((item) => (
              <li key={item.week} className="broto-inst__timeline-item">
                <span className="broto-inst__timeline-week">{item.week}</span>
                <p className="broto-inst__timeline-text">{item.text}</p>
              </li>
            ))}
          </ol>
          <p className="broto-inst__timeline-foot">
            Incluído: suporte de implantação, treinamento da equipe pedagógica e ambiente isolado
            por instituição.
          </p>
        </section>

        <section
          id="seguranca"
          className="broto-inst__section broto-inst__trust"
          aria-labelledby="inst-trust-title"
        >
          <div className="broto-inst__section-head">
            <h2 id="inst-trust-title" className="broto-inst__section-title">
              Construído para instituições — não para experimento em sala
            </h2>
          </div>
          <div className="broto-inst__trust-grid">
            {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="broto-inst__trust-card broto-card">
                <div className="broto-inst__icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="broto-inst__card-title">{title}</h3>
                <p className="broto-inst__card-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="broto-inst__section broto-inst__faq" aria-labelledby="inst-faq-title">
          <div className="broto-inst__section-head broto-inst__section-head--narrow">
            <h2 id="inst-faq-title" className="broto-inst__section-title">
              Perguntas frequentes
            </h2>
          </div>
          <div className="broto-inst__faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index
              const panelId = `${formId}-faq-${index}`
              return (
                <article key={item.q} className="broto-inst__faq-item broto-card">
                  <button
                    type="button"
                    className="broto-inst__faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`broto-inst__faq-chevron${isOpen ? ' broto-inst__faq-chevron--open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={panelId}
                    className={`broto-inst__faq-panel${isOpen ? ' broto-inst__faq-panel--open' : ''}`}
                    hidden={!isOpen}
                  >
                    <p>{item.a}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section id="contato" className="broto-inst__cta-band" aria-labelledby="inst-cta-title">
          <div className="broto-inst__cta-inner">
            <h2 id="inst-cta-title" className="broto-inst__cta-title">
              Veja o Broto com os olhos da sua instituição
            </h2>
            <p className="broto-inst__cta-desc">
              Agende uma demonstração de 30 minutos. Mostramos o painel do gestor, a experiência do
              aluno e como seria com seus materiais.
            </p>

            {demoSubmitted ? (
              <div className="broto-inst__demo-success" role="status">
                <p className="broto-inst__demo-success-title">Solicitação registrada (preview)</p>
                <p className="broto-inst__demo-success-text">
                  Integração com envio real em breve. Esta página é apenas protótipo da landing B2B.
                </p>
              </div>
            ) : (
              <form className="broto-inst__demo-form" onSubmit={handleDemoSubmit} noValidate>
                <div className="broto-inst__form-row broto-inst__form-row--2">
                  <label className="broto-inst__field">
                    <span>Nome</span>
                    <input name="name" type="text" autoComplete="name" required />
                  </label>
                  <label className="broto-inst__field">
                    <span>Cargo</span>
                    <input name="role" type="text" autoComplete="organization-title" required />
                  </label>
                </div>
                <div className="broto-inst__form-row broto-inst__form-row--2">
                  <label className="broto-inst__field">
                    <span>Instituição</span>
                    <input name="organization" type="text" autoComplete="organization" required />
                  </label>
                  <label className="broto-inst__field">
                    <span>E-mail corporativo</span>
                    <input name="email" type="email" autoComplete="email" required />
                  </label>
                </div>
                <div className="broto-inst__form-row broto-inst__form-row--2">
                  <label className="broto-inst__field">
                    <span>Telefone</span>
                    <input name="phone" type="tel" autoComplete="tel" />
                  </label>
                  <label className="broto-inst__field">
                    <span>Nº aproximado de alunos</span>
                    <input name="students" type="number" min={1} inputMode="numeric" />
                  </label>
                </div>
                <label className="broto-inst__field">
                  <span>Segmento</span>
                  <select name="segment" defaultValue="">
                    <option value="" disabled>
                      Selecione
                    </option>
                    {DEMO_FORM_SEGMENTS.map((segment) => (
                      <option key={segment} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="broto-inst__field">
                  <span>Mensagem (opcional)</span>
                  <textarea name="message" rows={3} />
                </label>
                <button
                  type="submit"
                  className="broto-btn-primary broto-btn-primary--inline broto-inst__submit"
                >
                  Solicitar demonstração
                </button>
                <p className="broto-inst__form-note">Sem spam. Integração de envio em breve.</p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="broto-inst__footer">
        <p className="broto-inst__footer-tagline">Aprendizagem adaptativa para instituições</p>
        <nav className="broto-inst__footer-nav" aria-label="Links do rodapé">
          <button
            type="button"
            className="broto-inst__footer-link"
            onClick={() => scrollToId('como-funciona')}
          >
            Como funciona
          </button>
          <button
            type="button"
            className="broto-inst__footer-link"
            onClick={() => scrollToId('seguranca')}
          >
            Segurança
          </button>
          <button
            type="button"
            className="broto-inst__footer-link"
            onClick={() => scrollToId('contato')}
          >
            Contato
          </button>
          <Link to="/login" className="broto-inst__footer-link">
            Acesso aluno
          </Link>
          <Link to="/inicio" className="broto-inst__footer-link">
            Sou estudante
          </Link>
        </nav>
        <p className="broto-inst__footer-copy">© {new Date().getFullYear()} Broto</p>
      </footer>
    </div>
  )
}
