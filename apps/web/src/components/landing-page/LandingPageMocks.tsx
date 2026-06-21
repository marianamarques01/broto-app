import type { CSSProperties, ReactNode } from 'react'
import { Flame } from 'lucide-react'
import type { LpFictionalBrand } from '@/lib/landing-page-content'

type BrandStyle = CSSProperties & {
  '--brand-accent'?: string
  '--brand-accent-soft'?: string
}

function brandVars(brand: LpFictionalBrand): BrandStyle {
  return {
    '--brand-accent': brand.accent,
    '--brand-accent-soft': brand.accentSoft,
  }
}

/** Mock do hero — painel "Visão geral" com KPIs, gráficos e dificuldades. */
export function HeroOverviewDashboardMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-hero-dash" style={brandVars(brand)} aria-hidden>
      <aside className="blp-hero-dash__sidebar">
        <span className="blp-hero-dash__sidebar-mark">{brand.initial}</span>
        <span className="blp-hero-dash__sidebar-icon blp-hero-dash__sidebar-icon--active" />
        <span className="blp-hero-dash__sidebar-icon" />
        <span className="blp-hero-dash__sidebar-icon" />
        <span className="blp-hero-dash__sidebar-icon" />
      </aside>
      <div className="blp-hero-dash__main">
        <header className="blp-hero-dash__header">
          <h3 className="blp-hero-dash__title">Visão geral</h3>
          <p className="blp-hero-dash__subtitle">Acompanhe o desempenho geral da sua instituição</p>
        </header>
        <div className="blp-hero-dash__kpis">
          <div className="blp-hero-dash__kpi">
            <span className="blp-hero-dash__kpi-label">Alunos ativos</span>
            <strong>2.341</strong>
            <span className="blp-hero-dash__kpi-delta">+12% vs mês anterior</span>
          </div>
          <div className="blp-hero-dash__kpi">
            <span className="blp-hero-dash__kpi-label">Engajamento médio</span>
            <strong>78%</strong>
            <span className="blp-hero-dash__kpi-delta">+8% vs mês anterior</span>
          </div>
          <div className="blp-hero-dash__kpi">
            <span className="blp-hero-dash__kpi-label">Atividades concluídas</span>
            <strong>15.782</strong>
            <span className="blp-hero-dash__kpi-delta">+21% vs mês anterior</span>
          </div>
          <div className="blp-hero-dash__kpi">
            <span className="blp-hero-dash__kpi-label">Taxa de evolução</span>
            <strong>64%</strong>
            <span className="blp-hero-dash__kpi-delta">+5% vs mês anterior</span>
          </div>
        </div>
        <div className="blp-hero-dash__charts">
          <div className="blp-hero-dash__chart-card">
            <span className="blp-hero-dash__chart-title">Evolução de desempenho</span>
            <svg
              className="blp-hero-dash__line-chart"
              viewBox="0 0 120 40"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="var(--brand-accent, #2fb573)"
                strokeWidth="2"
                points="0,32 20,28 40,24 60,18 80,14 100,10 120,6"
              />
            </svg>
            <div className="blp-hero-dash__chart-axis">
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
            </div>
          </div>
          <div className="blp-hero-dash__chart-card">
            <span className="blp-hero-dash__chart-title">Distribuição de níveis</span>
            <div className="blp-hero-dash__donut-wrap">
              <div className="blp-hero-dash__donut" />
              <ul className="blp-hero-dash__donut-legend">
                <li>
                  <span className="blp-hero-dash__dot blp-hero-dash__dot--adv" /> Avançado 24%
                </li>
                <li>
                  <span className="blp-hero-dash__dot blp-hero-dash__dot--mid" /> Intermediário 41%
                </li>
                <li>
                  <span className="blp-hero-dash__dot blp-hero-dash__dot--basic" /> Básico 35%
                </li>
              </ul>
            </div>
          </div>
          <div className="blp-hero-dash__chart-card">
            <span className="blp-hero-dash__chart-title">Dificuldades principais</span>
            <ul className="blp-hero-dash__difficulties">
              <li>
                Funções <span className="blp-hero-dash__tag-high">Alta</span>
              </li>
              <li>
                Geometria <span className="blp-hero-dash__tag-high">Alta</span>
              </li>
              <li>
                Termologia <span className="blp-hero-dash__tag-mid">Média</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Mock do hero — app mobile com próxima atividade e plano de estudos. */
export function HeroPhoneMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-phone blp-phone--hero" style={brandVars(brand)} aria-hidden>
      <div className="blp-phone__notch" />
      <p className="blp-phone__greeting blp-phone__greeting--hero">Olá, Ana!</p>
      <div className="blp-phone__next-card">
        <span className="blp-phone__next-label">Sua próxima atividade</span>
        <strong>Funções de 1º grau</strong>
        <span className="blp-phone__next-meta">15 min · Matemática</span>
        <span className="blp-phone__next-btn">Começar</span>
      </div>
      <div className="blp-phone__plan">
        <div className="blp-phone__plan-head">
          <span>Seu plano de estudos</span>
          <span>3/7</span>
        </div>
        <span className="blp-phone__progress">
          <span className="blp-phone__progress-fill" style={{ width: '43%' }} />
        </span>
      </div>
      <div className="blp-phone__reco">
        <span className="blp-phone__reco-label">Recomendado para você</span>
        <div className="blp-phone__reco-item">Revisão — Era Vargas</div>
        <div className="blp-phone__reco-item">10 questões — Termologia</div>
      </div>
    </div>
  )
}

/** Mock do app do aluno — tela de rotina do dia (white-label: marca fictícia). */
export function StudentPhoneRoutineMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-phone" style={brandVars(brand)} aria-hidden>
      <div className="blp-phone__notch" />
      <div className="blp-phone__header">
        <span className="blp-phone__brand">
          <span className="blp-phone__brand-mark">{brand.initial}</span>
          <span className="blp-phone__brand-name">{brand.name}</span>
        </span>
        <span className="blp-phone__streak">
          <Flame size={11} /> 12 dias
        </span>
      </div>
      <p className="blp-phone__greeting">Boa tarde, Júlia — sua rotina de hoje:</p>
      <div className="blp-phone__routine-card">
        <span className="blp-phone__routine-title">Rotina de hoje</span>
        <span className="blp-phone__routine-meta">45 min · 3 blocos · 68% concluído</span>
        <span className="blp-phone__progress">
          <span className="blp-phone__progress-fill" style={{ width: '68%' }} />
        </span>
      </div>
      <div className="blp-phone__missions">
        <div className="blp-phone__mission blp-phone__mission--done">
          <span className="blp-phone__mission-check" />
          Revisar Funções — 15 min
        </div>
        <div className="blp-phone__mission blp-phone__mission--done">
          <span className="blp-phone__mission-check" />
          10 questões de Termologia
        </div>
        <div className="blp-phone__mission">
          <span className="blp-phone__mission-check" />
          Resumo: Era Vargas — 10 min
        </div>
      </div>
      <div className="blp-phone__pet">
        <span className="blp-phone__pet-sprout" aria-hidden>
          🌱
        </span>
        Seu broto cresceu com o estudo de hoje
      </div>
    </div>
  )
}

/** Mock do app do aluno — tela de questão com feedback imediato. */
export function StudentPhoneQuestionMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-phone" style={brandVars(brand)} aria-hidden>
      <div className="blp-phone__notch" />
      <div className="blp-phone__header">
        <span className="blp-phone__brand">
          <span className="blp-phone__brand-mark">{brand.initial}</span>
          <span className="blp-phone__brand-name">{brand.name}</span>
        </span>
      </div>
      <span className="blp-phone__question-tag">Matemática · Funções</span>
      <div className="blp-phone__stem-line" />
      <div className="blp-phone__stem-line" />
      <div className="blp-phone__stem-line blp-phone__stem-line--short" />
      <div className="blp-phone__alts">
        <div className="blp-phone__alt">
          <span className="blp-phone__alt-letter">A</span> f(x) = 2x − 1
        </div>
        <div className="blp-phone__alt blp-phone__alt--correct">
          <span className="blp-phone__alt-letter">B</span> f(x) = 3x + 2
        </div>
        <div className="blp-phone__alt">
          <span className="blp-phone__alt-letter">C</span> f(x) = x² − 4
        </div>
      </div>
      <span className="blp-phone__feedback">Correta! Veja a resolução comentada →</span>
    </div>
  )
}

/** Frame de navegador para envolver o dashboard do gestor. */
export function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="blp-mock-browser" aria-hidden>
      <div className="blp-mock-browser__bar">
        <span className="blp-mock-browser__dot" />
        <span className="blp-mock-browser__dot" />
        <span className="blp-mock-browser__dot" />
        <span className="blp-mock-browser__url">{url}</span>
      </div>
      {children}
    </div>
  )
}

const DASH_AREAS = [
  { label: 'Linguagens', value: 72 },
  { label: 'Humanas', value: 81 },
  { label: 'Natureza', value: 64 },
  { label: 'Matemática', value: 58 },
] as const

/** Mock do painel pedagógico do gestor (white-label: marca fictícia). */
export function ManagerDashboardMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-dash" style={brandVars(brand)}>
      <div className="blp-dash__topbar">
        <span className="blp-dash__brand">
          <span className="blp-dash__brand-mark">{brand.initial}</span>
          {brand.name}
        </span>
        <span className="blp-dash__label">Painel pedagógico</span>
      </div>
      <div className="blp-dash__stats">
        <div className="blp-dash__stat">
          <strong>128</strong>
          <span>alunos ativos</span>
        </div>
        <div className="blp-dash__stat blp-dash__stat--positive">
          <strong>73%</strong>
          <span>consistência semanal</span>
        </div>
        <div className="blp-dash__stat blp-dash__stat--warn">
          <strong>12</strong>
          <span>alunos em atenção</span>
        </div>
      </div>
      <div className="blp-dash__chart">
        {DASH_AREAS.map((area) => (
          <div key={area.label} className="blp-dash__chart-row">
            <span>{area.label}</span>
            <span className="blp-dash__chart-track">
              <span className="blp-dash__chart-fill" style={{ width: `${area.value}%` }} />
            </span>
            <span className="blp-dash__chart-value">{area.value}%</span>
          </div>
        ))}
      </div>
      <div className="blp-dash__alerts">
        <div className="blp-dash__alert">
          Ana Souza — 5 dias sem estudar
          <span className="blp-dash__alert-badge">atenção</span>
        </div>
        <div className="blp-dash__alert">
          Turma 3B — lacuna em Funções
          <span className="blp-dash__alert-badge">intervir</span>
        </div>
      </div>
    </div>
  )
}

/** Mock do produto — plano de estudos com desempenho lateral. */
export function ProductStudyPlanMock({ brand }: { brand: LpFictionalBrand }) {
  return (
    <div className="blp-product-mock" style={brandVars(brand)} aria-hidden>
      <aside className="blp-product-mock__sidebar">
        <span className="blp-product-mock__sidebar-mark">{brand.initial}</span>
        <span className="blp-product-mock__sidebar-icon blp-product-mock__sidebar-icon--active" />
        <span className="blp-product-mock__sidebar-icon" />
        <span className="blp-product-mock__sidebar-icon" />
        <span className="blp-product-mock__sidebar-icon" />
      </aside>
      <div className="blp-product-mock__main">
        <header className="blp-product-mock__header">
          <h3>Plano de estudos</h3>
          <span>Funções do 1º grau</span>
        </header>
        <div className="blp-product-mock__progress-head">
          <span>Progresso do tópico</span>
          <span>6/8</span>
        </div>
        <span className="blp-product-mock__progress">
          <span className="blp-product-mock__progress-fill" style={{ width: '75%' }} />
        </span>
        <p className="blp-product-mock__section-label">Continue seus estudos</p>
        <div className="blp-product-mock__topics">
          <div className="blp-product-mock__topic">Funções de 2º grau</div>
          <div className="blp-product-mock__topic">Inequações</div>
          <div className="blp-product-mock__topic">Sistemas de equações</div>
        </div>
        <div className="blp-product-mock__reco">
          <span className="blp-product-mock__reco-label">Atividade recomendada</span>
          <div className="blp-product-mock__reco-card">
            <strong>Geometria analítica</strong>
            <span>20 min · 12 questões</span>
            <span className="blp-product-mock__reco-btn">Iniciar</span>
          </div>
        </div>
      </div>
      <aside className="blp-product-mock__aside">
        <p className="blp-product-mock__aside-title">Seu desempenho</p>
        <div className="blp-product-mock__stat">
          <strong>84%</strong>
          <span>acertos</span>
        </div>
        <div className="blp-product-mock__stat">
          <strong>128</strong>
          <span>questões resolvidas</span>
        </div>
        <div className="blp-product-mock__streak">
          <Flame size={12} /> 7 dias
        </div>
      </aside>
    </div>
  )
}
