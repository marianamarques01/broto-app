import { useId } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'
import { DAILY_MISSION_VOLUME_QUEST_GOAL } from '@broto/shared'

/** Alinhado a Home.tsx (meta gamificada do dia). */
const META_QUESTOES_DIA = DAILY_MISSION_VOLUME_QUEST_GOAL

export type PetBannerNextSteps = {
  revisaoLinha: string
  areaSlug: string
  /** Texto complementar quando não há `topicAnswerCount` (evita repetir números). */
  contextualHint?: string
  topicAnswerCount?: number
  /** Área foco da rotina semanal para o dia atual (quando existe). */
  todayRoutineAreaLabel?: string | null
  todayRoutineAreaSlug?: string | null
  todayRoutineMinutes?: number
  todayIsRoutineRest?: boolean
}

type HomePetBannerProps = {
  nextSteps?: PetBannerNextSteps | null
}

function PetXpRing({ pct, size }: { pct: number; size: number }) {
  const rawId = useId()
  const gradId = `broto-pet-ring-grad-${rawId.replace(/:/g, '')}`
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const dash = (p / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      className="broto-home-pet-banner__ring-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(110, 167, 131, 0.95)" />
          <stop offset="100%" stopColor="rgba(74, 139, 102, 0.88)" />
        </linearGradient>
      </defs>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="broto-home-pet-banner__ring-track"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="broto-home-pet-banner__ring-progress"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </g>
    </svg>
  )
}

function formatRoutineStudyHint(min: number | undefined): string | null {
  if (min === undefined || min <= 0) return null
  if (min >= 60) {
    const hours = min / 60
    const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace('.', ',')
    return `≈ ${rounded} h previstas para hoje na rotina`
  }
  return `≈ ${min} min previstos para hoje na rotina`
}

function routineSecondStep(ns: PetBannerNextSteps): { to: string; title: string; hint: string } {
  if (ns.todayIsRoutineRest) {
    return {
      to: '/study/mock-exam',
      title: 'Sessão no formato ENEM',
      hint: 'Dia diferente na semana — mantenha o ritmo com um bloco guiado.',
    }
  }
  if (ns.todayRoutineAreaSlug && ns.todayRoutineAreaLabel) {
    const rhythm = formatRoutineStudyHint(ns.todayRoutineMinutes)
    return {
      to: `/study/${ns.todayRoutineAreaSlug}`,
      title: `Rotina de hoje · ${ns.todayRoutineAreaLabel}`,
      hint: rhythm ?? 'Área sugerida na sua rotina semanal — encaixe após o reforço.',
    }
  }
  return {
    to: '/study/mock-exam',
    title: 'Bloco rápido de questões',
    hint: 'Siga com prática objetiva antes de navegar pelo restante do app.',
  }
}

export function HomePetBanner({ nextSteps = null }: HomePetBannerProps) {
  const { pet, loading } = usePet()

  const fase = pet?.fase ?? 'semente'
  const brotoNome = pet?.nome?.trim() || 'Broto'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpInLevel = xp % 100
  const questoesHoje = pet?.questoesHoje ?? 0
  const acertosHoje = pet?.acertosHoje ?? 0
  const streak = pet?.streak ?? 0
  const metaCount = Math.min(questoesHoje, META_QUESTOES_DIA)
  const hitPct = questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : null
  const metaPct = loading ? 0 : Math.round((metaCount / META_QUESTOES_DIA) * 100)
  const xpPct = loading ? 0 : Math.min(100, Math.max(0, xpInLevel))

  /** Diâmetro do anel XP — anel mais justo ao emoji (tamanho do emoji só no CSS). */
  const ringSize = 108

  const showNextColumn = Boolean(nextSteps)

  const sectionClass = [
    'broto-home-pet-banner',
    'broto-home-pet-banner--square',
    showNextColumn && 'broto-home-pet-banner--with-next',
  ]
    .filter(Boolean)
    .join(' ')

  const routineFollowStep = nextSteps ? routineSecondStep(nextSteps) : null

  return (
    <section className={sectionClass} aria-label={`${brotoNome} e indicadores de hoje`}>
      <div className="broto-home-pet-banner__square-inner">
        <div className="broto-home-pet-banner__pet-pane">
          <header className="broto-home-pet-banner__block broto-home-pet-banner__block--identity">
            <p className="broto-home-pet-banner__sq-kicker">{loading ? '…' : FASE_LABEL[fase]}</p>
            <h2 className="broto-home-pet-banner__sq-name">{loading ? '…' : brotoNome}</h2>
          </header>

          {/* Faixa de micro-progresso — ocultada no desktop quando a coluna "próximos passos" substitui o bloco */}
          <div
            className="broto-home-pet-banner__block broto-home-pet-banner__block--aside-hint"
            aria-hidden
          >
            <div className="broto-home-pet-banner__micro-strip">
              <div className="broto-home-pet-banner__micro-head">
                <span className="broto-home-pet-banner__micro-label">Meta do dia</span>
                <span className="broto-home-pet-banner__micro-nums">
                  {loading ? '…' : `${metaCount}/${META_QUESTOES_DIA}`}
                </span>
              </div>
              <div className="broto-home-pet-banner__micro-track">
                <span
                  className="broto-home-pet-banner__micro-fill broto-home-pet-banner__micro-fill--meta"
                  style={{ width: `${metaPct}%` }}
                />
              </div>
              <div className="broto-home-pet-banner__micro-head">
                <span className="broto-home-pet-banner__micro-label">XP no nível</span>
                <span className="broto-home-pet-banner__micro-nums">
                  {loading ? '…' : `${xpInLevel}/100`}
                </span>
              </div>
              <div className="broto-home-pet-banner__micro-track">
                <span
                  className="broto-home-pet-banner__micro-fill broto-home-pet-banner__micro-fill--xp"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="broto-home-pet-banner__block broto-home-pet-banner__block--progress">
            <div
              className="broto-home-pet-banner__ring-wrap"
              style={{ width: ringSize, height: ringSize }}
            >
              <PetXpRing pct={loading ? 0 : xpInLevel} size={ringSize} />
              <div className="broto-home-pet-banner__ring-center" aria-hidden>
                {loading ? '…' : FASE_EMOJI[fase]}
              </div>
            </div>
            <p className="broto-home-pet-banner__level-pill" aria-label={`Nível ${nivel}`}>
              {loading ? '…' : `Nv. ${nivel}`}
            </p>
            <p className="broto-home-pet-banner__ring-xp">
              {loading ? (
                '…'
              ) : (
                <>
                  <span className="broto-home-pet-banner__ring-xp-values">
                    <span className="broto-home-pet-banner__ring-xp-num">{xpInLevel}</span>
                    <span className="broto-home-pet-banner__ring-xp-sep">/</span>
                    <span className="broto-home-pet-banner__ring-xp-den">100</span>
                  </span>{' '}
                  <span className="broto-home-pet-banner__ring-xp-unit">XP</span>
                </>
              )}
            </p>
          </div>

          <footer className="broto-home-pet-banner__block broto-home-pet-banner__block--stats">
            <div className="broto-home-pet-banner__sq-metrics">
              <div className="broto-home-pet-banner__sq-metric">
                <span className="broto-home-pet-banner__sq-metric-label">Meta hoje</span>
                <span className="broto-home-pet-banner__sq-metric-val">
                  {loading ? (
                    '—'
                  ) : (
                    <>
                      <span className="broto-home-pet-banner__sq-metric-num">{metaCount}</span>
                      <span className="broto-home-pet-banner__sq-metric-sep">/</span>
                      <span className="broto-home-pet-banner__sq-metric-den">
                        {META_QUESTOES_DIA}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="broto-home-pet-banner__sq-metric">
                <span className="broto-home-pet-banner__sq-metric-label">Acerto hoje</span>
                <span className="broto-home-pet-banner__sq-metric-val">
                  {loading ? (
                    '—'
                  ) : hitPct === null ? (
                    '—'
                  ) : (
                    <>
                      <span className="broto-home-pet-banner__sq-metric-num">{hitPct}</span>
                      <span className="broto-home-pet-banner__sq-metric-unit">%</span>
                    </>
                  )}
                </span>
              </div>
              <div className="broto-home-pet-banner__sq-metric">
                <span className="broto-home-pet-banner__sq-metric-label">Sequência</span>
                <span className="broto-home-pet-banner__sq-metric-val">
                  {loading ? (
                    '—'
                  ) : (
                    <>
                      <span className="broto-home-pet-banner__sq-metric-num">{streak}</span>
                      <span className="broto-home-pet-banner__sq-metric-unit broto-home-pet-banner__sq-metric-unit--word">
                        {streak === 1 ? 'dia' : 'dias'}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </footer>
        </div>

        {nextSteps ? (
          <aside
            className="broto-home-pet-banner__next-pane"
            aria-label="Próximos passos na rotina"
          >
            <div className="broto-home-pet-banner__next-panel">
              <div className="broto-home-pet-banner__next-spotlight">
                <div className="broto-home-pet-banner__next-spotlight-top">
                  <span className="broto-home-pet-banner__next-step-chip">Prioridade · agora</span>
                </div>

                <p className="broto-home-pet-banner__next-spotlight-title">
                  {nextSteps.revisaoLinha}
                </p>
                <p className="broto-home-pet-banner__next-spotlight-micro">
                  {nextSteps.topicAnswerCount !== undefined ? (
                    <>Na página da área você encontra questões e flashcards para consolidar.</>
                  ) : (
                    <>
                      {nextSteps.contextualHint ??
                        'O broto sugere esse foco porque concentra o maior ganho de desempenho agora.'}
                    </>
                  )}
                </p>

                <Link
                  className="broto-home-tl__show-more broto-home-pet-banner__next-spotlight-cta"
                  to={`/study/${nextSteps.areaSlug}`}
                >
                  Abrir esta área e praticar
                </Link>
              </div>

              {routineFollowStep ? (
                <ol
                  className="broto-home-pet-banner__next-rail-list"
                  aria-label="Próximo na sequência"
                >
                  <li className="broto-home-pet-banner__next-rail-li">
                    <Link
                      className="broto-home-pet-banner__next-rail-link"
                      to={routineFollowStep.to}
                    >
                      <span className="broto-home-pet-banner__next-rail-num">2</span>
                      <span className="broto-home-pet-banner__next-rail-text">
                        <span className="broto-home-pet-banner__next-rail-head">
                          {routineFollowStep.title}
                        </span>
                        <span className="broto-home-pet-banner__next-rail-hint">
                          {routineFollowStep.hint}
                        </span>
                      </span>
                      <span className="broto-home-pet-banner__next-rail-chevrons" aria-hidden>
                        <ChevronRight size={18} strokeWidth={2} />
                      </span>
                    </Link>
                  </li>
                </ol>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
