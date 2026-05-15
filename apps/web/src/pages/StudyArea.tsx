import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { Question, StudyJourneyTab } from '@broto/shared'
import {
  getQuestionId,
  studyJourneyCompletedCount,
  studyJourneyNextIncompleteTab,
  STUDY_JOURNEY_STAGES,
  STUDY_JOURNEY_TABS,
  brotoCelebrateLine,
} from '@broto/shared'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import {
  fetchQuestionDetailForBank,
  getQuestionBankStaticBaseUrl,
  type QuestionBankRow,
} from '@/hooks/useQuestionBank'
import {
  Link,
  Navigate,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { TopBar, type StudyBreadcrumbParts } from '@/components/layout/TopBar'
import { AREA_CONFIG, getAreaColor } from '@/lib/area-config'
import {
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Zap,
  Loader2,
  ClipboardList,
  ArrowDownUp,
  Timer,
  BookOpen,
} from 'lucide-react'
import {
  getMockStudyPackage,
  getStudyTopicCatalog,
  mergeTopicCatalogWithStats,
  type StudyPackage,
  type StudyFlashcard,
  type TopicOption,
  type MindMapNode,
} from '@/lib/study-area-mock'
import {
  StudyPackageLeaveDialog,
  GrowthTrail,
  HumanTrailProgress,
  StickyContextCta,
  StudyBackLink,
  StudyPackageJourneyGrid,
  StudySanctuaryHeader,
} from '@/components/study/StudyPackageJourney'
/** Conteúdo só via pacote estático em `@broto/shared` — sem NotebookLM/runtime LM nesta rota (MVP). */
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import { QuestionBankView } from '@/components/study/QuestionBankView'
import { StudyPackageSimuladoSessionCard } from '@/components/study/StudyPackageSimuladoSessionCard'
import { MockExamConfigurator } from '@/components/mock-exam/MockExamConfigurator'
import { useProgress, type ProgressData, type AreaStat } from '@/hooks/useProgress'
import type { BlockerFunction } from 'react-router-dom'
import {
  clearStudyPackageSessionDraft,
  loadStudyPackageSessionDraft,
  saveStudyPackageSessionDraft,
} from '@/lib/study-package-session-storage'

/* ─── Types ────────────────────────────────── */

type Step = 'select' | 'loading' | 'study'
type Tab = StudyJourneyTab
type HubSurface = 'menu' | 'guided' | 'bank'

const RING_R = 19
const RING_C = 2 * Math.PI * RING_R

/** Áreas reais do ENEM — `sem_area` é só fallback de dados, não entra na grade. */
const STUDY_AREA_CARD_KEYS = Object.keys(AREA_CONFIG).filter((k) => k !== 'sem_area')

function areaBlockForKey(areas: AreaStat[] | undefined, areaKey: string): AreaStat | undefined {
  return areas?.find((a) => a.value === areaKey)
}

const STUDY_TOPIC_JOURNEY_TOTAL = STUDY_JOURNEY_TABS.length

function topicsForAreaKey(areaKey: string, areas: AreaStat[] | undefined): TopicOption[] {
  const cat = getStudyTopicCatalog(areaKey)
  const block = areaBlockForKey(areas, areaKey)
  const merged = mergeTopicCatalogWithStats(cat, block?.topicos)
  return merged.map((t) => {
    const draft = loadStudyPackageSessionDraft(areaKey, t.value)
    const jc = draft ? studyJourneyCompletedCount(draft.completed) : 0
    return jc > 0 ? { ...t, journeyStagesCompleted: jc } : t
  })
}

function landingQuickStats(progress: ProgressData | undefined) {
  const totalAnswered = progress?.totalAnswered ?? 0
  if (!progress || totalAnswered < 1) {
    return { totalAnswered, weightedAcc: null as number | null, lowest: null as number | null }
  }
  const topicRows = progress.areas
    .filter((a) => a.value !== 'outros')
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered > 0)
  const lowest =
    topicRows.length > 0 ? Math.round(Math.min(...topicRows.map((t) => t.accuracyPct))) : null
  return {
    totalAnswered,
    weightedAcc: Math.round(progress.accuracyPct),
    lowest,
  }
}

function topicTier(
  accuracy: number | null,
  journeyStagesCompleted = 0,
): {
  label: string
  tagClass: string
  ringColor: string
  displayPct: number
  metaHint: string
} {
  if (accuracy === null) {
    if (journeyStagesCompleted > 0) {
      const displayPct = Math.round((journeyStagesCompleted / STUDY_TOPIC_JOURNEY_TOTAL) * 100)
      if (journeyStagesCompleted >= STUDY_TOPIC_JOURNEY_TOTAL) {
        return {
          label: 'Trilha ok',
          tagClass: 'study-topic-card__tag--manter',
          ringColor: 'var(--teal-400)',
          displayPct,
          metaHint: 'Pratique questões no banco para medir acerto',
        }
      }
      return {
        label: 'Em estudo',
        tagClass: 'study-topic-card__tag--reforcar',
        ringColor: 'var(--gold-400)',
        displayPct,
        metaHint: 'Progresso no pacote guiado (fora do banco)',
      }
    }
    return {
      label: 'Novo',
      tagClass: 'study-topic-card__tag--novo',
      ringColor: 'var(--text-muted)',
      displayPct: 0,
      metaHint: 'Sem dados ainda',
    }
  }
  if (accuracy < 50) {
    return {
      label: 'Focar',
      tagClass: 'study-topic-card__tag--focar',
      ringColor: 'var(--status-coral)',
      displayPct: accuracy,
      metaHint: 'Prioridade alta',
    }
  }
  if (accuracy < 70) {
    return {
      label: 'Reforçar',
      tagClass: 'study-topic-card__tag--reforcar',
      ringColor: 'var(--gold-400)',
      displayPct: accuracy,
      metaHint: 'Progresso moderado',
    }
  }
  return {
    label: 'Manter',
    tagClass: 'study-topic-card__tag--manter',
    ringColor: 'var(--teal-400)',
    displayPct: accuracy,
    metaHint: 'Bom desempenho',
  }
}

function RingProgress({
  pct,
  stroke,
  centerLabel,
}: {
  pct: number
  stroke: string
  centerLabel: string
}) {
  const off = RING_C - (pct / 100) * RING_C
  return (
    <div className="study-ring-wrap">
      <svg className="study-ring-svg" viewBox="0 0 48 48" aria-hidden>
        <circle className="study-ring-bg" cx={24} cy={24} r={RING_R} />
        <circle
          className="study-ring-fill"
          cx={24}
          cy={24}
          r={RING_R}
          stroke={stroke}
          strokeDasharray={RING_C}
          style={
            {
              '--ring-circ': RING_C,
              '--ring-offset': off,
            } as CSSProperties
          }
        />
      </svg>
      <div className="study-ring-label" style={{ color: stroke }}>
        {centerLabel}
      </div>
    </div>
  )
}

/* ─── Landing: só escolha de área ─────────── */

function StudyLandingPick({ progress }: { progress: ProgressData | undefined }) {
  const navigate = useNavigate()
  const welcomeStats = landingQuickStats(progress)
  const areaKeys = STUDY_AREA_CARD_KEYS
  const areaDelays = [100, 180, 260, 340]

  return (
    <div>
      <div className="study-welcome">
        <div className="study-welcome__text">
          <h2 className="study-welcome__title">
            Escolha seu caminho
            <br />
            de <em>estudo</em>
          </h2>
          <p className="study-welcome__sub">
            Cada área tem <strong>trilha por tópico</strong> e <strong>banco de questões</strong>.
            Para treinar em bloco no <strong>estilo de um simulado</strong> (cronômetro opcional,
            quantidade à sua escolha — não é a prova inteira), use a <strong>sessão ENEM</strong> no
            card abaixo.
          </p>
        </div>
        <div className="study-quickstats" aria-label="Resumo de desempenho">
          <div className="study-quickstat">
            <span className="study-quickstat__val">{welcomeStats.totalAnswered}</span>
            <span className="study-quickstat__lab">Questões</span>
          </div>
          <div className="study-quickstat">
            <span
              className={`study-quickstat__val${welcomeStats.weightedAcc !== null ? ' study-quickstat__val--teal' : ''}`}
            >
              {welcomeStats.weightedAcc !== null ? `${welcomeStats.weightedAcc}%` : '—'}
            </span>
            <span className="study-quickstat__lab">Acerto geral</span>
          </div>
          <div
            className={`study-quickstat${welcomeStats.lowest !== null ? ' study-quickstat--coral' : ''}`}
          >
            <span className="study-quickstat__val">
              {welcomeStats.lowest !== null ? `${welcomeStats.lowest}%` : '—'}
            </span>
            <span className="study-quickstat__lab">Menor nota</span>
          </div>
        </div>
      </div>

      <div className="study-areas-label">Área de conhecimento</div>
      <div className="study-areas">
        {areaKeys.map((key, i) => {
          const cfg = AREA_CONFIG[key]
          const Icon = cfg.icon
          const block = areaBlockForKey(progress?.areas, key)
          const avg =
            block != null && block.totalAnswered > 0 ? Math.round(block.accuracyPct) : null
          const n = topicsForAreaKey(key, progress?.areas).length
          const av = AREA_ACCENT_VARS[key] ?? AREA_ACCENT_VARS.linguagens
          return (
            <button
              key={key}
              type="button"
              className="study-area-card"
              style={
                {
                  '--study-area-accent': cfg.color,
                  '--ac-dim': av.dim,
                  '--ac-glow': av.glow,
                  animation: 'study-scale-in 0.4s ease-out both',
                  animationDelay: `${areaDelays[i] ?? 340}ms`,
                } as CSSProperties
              }
              onClick={() => navigate(`/study/${key}`)}
            >
              <StudyAreaCardPattern areaKey={key} />
              <div className="study-area-card__glow" aria-hidden />
              <span className="study-area-card__dot" aria-hidden />
              <div className="study-area-card__icon">
                <Icon size={20} color="currentColor" strokeWidth={1.8} />
              </div>
              <p className="study-area-card__label">{cfg.label}</p>
              <p className="study-area-card__meta">
                {n} tópicos · {avg !== null ? `${avg}% média` : 'sem média'}
              </p>
            </button>
          )
        })}
      </div>

      <div className="study-simulado-label">Sessão (estilo simulado)</div>
      <Link
        to="/study/mock-exam"
        className="study-simulado-landing"
        aria-label="Sessão ENEM — montar bloco tipo simulado com filtros e quantidade"
      >
        <div className="study-simulado-landing__icon">
          <Timer size={22} strokeWidth={1.8} aria-hidden />
        </div>
        <div className="study-simulado-landing__body">
          <h3 className="study-simulado-landing__title">Sessão ENEM</h3>
          <p className="study-simulado-landing__desc">
            Monte um bloco personalizado no <strong>estilo de um simulado</strong> (filtros por
            área, ano e quantidade; tempo limite opcional). Você não fica preso ao formato inteiro
            da prova.
          </p>
        </div>
        <span className="study-simulado-landing__trailing-chev" aria-hidden>
          <ChevronRight size={15} strokeWidth={2.2} />
        </span>
      </Link>
    </div>
  )
}

/* ─── Menu: o que fazer na área ───────────── */

function StudyHubMenu({
  areaKey,
  topics,
  onChooseBank,
  onChangeArea,
  onStartTopic,
}: {
  areaKey: string
  topics: TopicOption[]
  onChooseBank: () => void
  onChangeArea: () => void
  onStartTopic: (areaKey: string, topico: TopicOption) => void
}) {
  const cfg = AREA_CONFIG[areaKey]
  const Icon = cfg?.icon ?? BookOpen
  const [sortWeakestFirst, setSortWeakestFirst] = useState(true)

  const sorted = [...topics].sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) return 0
    if (a.accuracy === null) return 1
    if (b.accuracy === null) return -1
    return sortWeakestFirst ? a.accuracy - b.accuracy : b.accuracy - a.accuracy
  })

  const weakestInArea = sorted.find((t) => t.accuracy !== null)
  const spotlight =
    weakestInArea != null ? { topic: weakestInArea, areaLabel: cfg?.label ?? '' } : null
  const suggestedValue = weakestInArea?.value

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${cfg?.color}18`,
              border: `1px solid ${cfg?.color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cfg?.color,
            }}
          >
            <Icon size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              Área selecionada
            </p>
            <h2
              style={{
                margin: '2px 0 0',
                fontSize: '1.28rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {cfg?.label ?? ''}
            </h2>
          </div>
        </div>
        <button
          type="button"
          className="study-sort-btn"
          onClick={onChangeArea}
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          Outras áreas
        </button>
      </div>

      {/* ── Topics + AI spotlight embedded ── */}
      <div className="study-split">
        <div className="study-side">
          <div className="study-spotlight">
            <div className="study-spotlight__badge">✨ Recomendação IA</div>
            <h3 className="study-spotlight__title">
              {spotlight ? spotlight.topic.label : 'Pratique mais para ver sugestões'}
            </h3>
            <p className="study-spotlight__body">
              {spotlight
                ? `Seu ponto mais fraco em ${spotlight.areaLabel}, com ${spotlight.topic.accuracy}% de acerto e ${spotlight.topic.totalAnswered} questões. Foque aqui para subir sua nota mais rápido.`
                : 'Assim que você praticar mais questões, indicamos o melhor próximo passo automaticamente.'}
            </p>
            <button
              type="button"
              className="study-spotlight__cta"
              disabled={!spotlight}
              onClick={() => {
                if (!spotlight) return
                void onStartTopic(areaKey, spotlight.topic)
              }}
            >
              Estudar agora
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            className="study-banco"
            onClick={onChooseBank}
            style={
              {
                textAlign: 'left',
                marginTop: 14,
                '--study-banco-accent': cfg?.color ?? '#2dd4a8',
              } as CSSProperties
            }
          >
            <div className="study-banco__head">
              <div className="study-banco__icon">
                <ClipboardList size={16} strokeWidth={1.8} aria-hidden />
              </div>
              <h4 className="study-banco__title">Banco de questões</h4>
            </div>
            <p className="study-banco__desc">
              Pratique com filtros por ano, tópico e dificuldade — fora do pacote guiado.
            </p>
            <div className="study-banco__arrow">
              Abrir banco
              <ChevronRight size={14} strokeWidth={2} aria-hidden />
            </div>
          </button>
        </div>

        <div className="study-topics">
          <div className="study-topics__header">
            <h2 className="study-topics__title">Tópicos de {cfg?.label ?? ''}</h2>
            <button
              type="button"
              className="study-sort-btn"
              onClick={() => setSortWeakestFirst((v) => !v)}
            >
              <ArrowDownUp size={12} strokeWidth={2} aria-hidden />
              {sortWeakestFirst ? 'Menor acerto' : 'Maior acerto'}
            </button>
          </div>

          <div className="study-topics-grid">
            {sorted.map((topic, idx) => {
              const jc = topic.journeyStagesCompleted ?? 0
              const tier = topicTier(topic.accuracy, jc)
              const isSuggested = topic.value === suggestedValue && topic.accuracy !== null
              const activityLine =
                topic.totalAnswered >= 1
                  ? `${topic.totalAnswered === 1 ? '1 questão' : `${topic.totalAnswered} questões`}${
                      jc > 0 ? ` · Trilha ${jc}/${STUDY_TOPIC_JOURNEY_TOTAL}` : ''
                    }`
                  : jc > 0
                    ? `Trilha · ${jc}/${STUDY_TOPIC_JOURNEY_TOTAL}`
                    : '0 questões'
              const staggerMs = 450 + idx * 60
              return (
                <button
                  key={topic.value}
                  type="button"
                  className={`study-topic-card${isSuggested ? ' study-topic-card--suggested' : ''}`}
                  style={
                    {
                      animation: 'study-slide-up 0.4s ease-out both',
                      animationDelay: `${staggerMs}ms`,
                    } as CSSProperties
                  }
                  onClick={() => onStartTopic(areaKey, topic)}
                >
                  <RingProgress
                    pct={tier.displayPct}
                    stroke={tier.ringColor}
                    centerLabel={
                      topic.accuracy !== null || jc > 0 ? `${tier.displayPct}%` : '—'
                    }
                  />
                  <div className="study-topic-card__body">
                    <p className="study-topic-card__name">{topic.label}</p>
                    <div className="study-topic-card__meta">
                      <span>{activityLine}</span>
                      <span className="study-topic-card__meta-sep" aria-hidden />
                      <span>{tier.metaHint}</span>
                    </div>
                  </div>
                  <span className={`study-topic-card__tag ${tier.tagClass}`}>{tier.label}</span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className="study-topic-card__chev"
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Loading State ────────────────────────── */

function PackageLoading({ areaKey, topicoLabel }: { areaKey: string; topicoLabel: string }) {
  const color = getAreaColor(areaKey)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 340,
        gap: 20,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: `${color}15`,
          border: `1px solid ${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={28} color={color} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Gerando pacote de estudo...
        </p>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Preparando conteudo sobre <strong style={{ color }}>{topicoLabel}</strong>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ─── Summary Section ──────────────────────── */

function SummarySection({
  summary,
  areaColor,
  onDone,
  simuladoCard,
}: {
  summary: StudyPackage['summary']
  areaColor: string
  onDone: () => void
  simuladoCard?: ReactNode
}) {
  return (
    <div>
      <h2
        style={{
          margin: '0 0 18px',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {summary.title}
      </h2>

      {/* Markdown-like content */}
      <div
        style={{
          fontSize: '0.9rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {summary.content.split('\n\n').map((paragraph, i) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3
                key={i}
                style={{
                  margin: '20px 0 8px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {paragraph.replace('### ', '')}
              </h3>
            )
          }
          if (paragraph.startsWith('- ')) {
            return (
              <ul key={i} style={{ margin: '8px 0', paddingLeft: 20 }}>
                {paragraph.split('\n').map((line, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    {line
                      .replace('- ', '')
                      .split('**')
                      .map((seg, k) =>
                        k % 2 === 1 ? (
                          <strong key={k} style={{ color: 'var(--text-primary)' }}>
                            {seg}
                          </strong>
                        ) : (
                          <span key={k}>{seg}</span>
                        ),
                      )}
                  </li>
                ))}
              </ul>
            )
          }
          return (
            <p key={i} style={{ margin: '10px 0' }}>
              {paragraph.split('**').map((seg, k) =>
                k % 2 === 1 ? (
                  <strong key={k} style={{ color: 'var(--text-primary)' }}>
                    {seg}
                  </strong>
                ) : (
                  <span key={k}>{seg}</span>
                ),
              )}
            </p>
          )
        })}
      </div>

      {/* Key points */}
      <div
        style={{
          marginTop: 18,
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: `${areaColor}08`,
          border: `1px solid ${areaColor}18`,
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: areaColor,
          }}
        >
          Pontos-chave
        </p>
        {summary.keyPoints.map((point, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}
          >
            <CheckCircle2 size={14} color={areaColor} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {point}
            </span>
          </div>
        ))}
      </div>

      {simuladoCard ? <div style={{ marginTop: 18 }}>{simuladoCard}</div> : null}

      <button
        type="button"
        onClick={onDone}
        className="broto-btn-primary"
        style={{ marginTop: 20, justifyContent: 'center' }}
      >
        Continuar leitura e seguir <ArrowRight size={18} />
      </button>
    </div>
  )
}

/* ─── Flashcard Deck ───────────────────────── */

function FlashcardDeck({
  cards,
  areaColor,
  onDone,
}: {
  cards: StudyFlashcard[]
  areaColor: string
  onDone: () => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())

  const card = cards[currentIdx]
  const isLast = currentIdx === cards.length - 1
  const allReviewed = reviewed.size === cards.length

  const DIFF_COLORS: Record<string, string> = {
    easy: 'var(--green-400)',
    medium: 'var(--gold-400)',
    hard: 'var(--red-400)',
  }
  const DIFF_LABELS: Record<string, string> = { easy: 'Facil', medium: 'Medio', hard: 'Dificil' }

  function handleNext() {
    setReviewed((prev) => new Set(prev).add(currentIdx))
    if (!isLast) {
      setFlipped(false)
      setCurrentIdx((prev) => prev + 1)
    } else {
      setReviewed((prev) => new Set(prev).add(currentIdx))
    }
  }

  return (
    <div>
      {/* Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Card {currentIdx + 1} de {cards.length}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: `${DIFF_COLORS[card.difficulty]}18`,
            color: DIFF_COLORS[card.difficulty],
          }}
        >
          {DIFF_LABELS[card.difficulty]}
        </span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          minHeight: 220,
          padding: '32px 28px',
          borderRadius: 'var(--radius-lg)',
          border: `1.5px solid ${flipped ? areaColor + '44' : 'var(--border-default)'}`,
          background: flipped
            ? `linear-gradient(160deg, ${areaColor}10, var(--bg-card))`
            : 'var(--bg-card)',
          cursor: 'pointer',
          transition: 'all 0.25s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <p
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
          }}
        >
          {flipped ? 'Resposta' : 'Pergunta'}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: flipped ? '0.92rem' : '1.05rem',
            fontWeight: flipped ? 400 : 600,
            lineHeight: 1.6,
            color: flipped ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}
        >
          {flipped ? card.back : card.front}
        </p>

        <p
          style={{
            position: 'absolute',
            bottom: 14,
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          {flipped ? '' : 'Clique para ver a resposta'}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => {
            setFlipped(false)
            setCurrentIdx((prev) => prev - 1)
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
            opacity: currentIdx === 0 ? 0.4 : 1,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${areaColor}44`,
            background: `${areaColor}12`,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: areaColor,
          }}
        >
          {isLast ? 'Finalizar' : 'Proximo'} <ArrowRight size={16} />
        </button>
      </div>

      {/* Dots indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIdx ? 20 : 8,
              height: 8,
              borderRadius: 999,
              background: reviewed.has(i)
                ? areaColor
                : i === currentIdx
                  ? `${areaColor}88`
                  : 'var(--border-strong)',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      {allReviewed && (
        <button
          type="button"
          onClick={onDone}
          className="broto-btn-primary"
          style={{ marginTop: 20, justifyContent: 'center' }}
        >
          Continuar para fixação <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

/* ─── Practice Questions (banco real; persiste respostas) ─── */

function GuidedBankPracticeQuestions({
  areaKey,
  rows,
  onDone,
  simuladoCard,
}: {
  areaKey: string
  rows: QuestionBankRow[]
  onDone: (correct: number, total: number) => void
  simuladoCard?: ReactNode
}) {
  const baseUrl = getQuestionBankStaticBaseUrl()
  const [idx, setIdx] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [loadingQ, setLoadingQ] = useState(true)
  const [stats, setStats] = useState({ correct: 0, answered: 0 })
  const correctRef = useRef(0)
  const fetchGen = useRef(0)

  const row = rows[idx]

  useEffect(() => {
    correctRef.current = 0
    setStats({ correct: 0, answered: 0 })
    setIdx(0)
  }, [rows])

  useEffect(() => {
    if (!baseUrl || !row) {
      setQuestion(null)
      setLoadingQ(false)
      return
    }
    fetchGen.current += 1
    const gen = fetchGen.current
    setLoadingQ(true)
    setQuestion(null)
    void fetchQuestionDetailForBank(baseUrl, row.year, row.index, row.language).then((q) => {
      if (gen !== fetchGen.current) return
      setQuestion(q)
      setLoadingQ(false)
    })
  }, [baseUrl, row])

  const goNext = useCallback(() => {
    if (idx >= rows.length - 1) {
      onDone(correctRef.current, rows.length)
    } else {
      setIdx((i) => i + 1)
    }
  }, [idx, rows.length, onDone])

  if (!baseUrl) {
    return (
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        Não foi possível carregar o banco de questões.
      </p>
    )
  }

  return (
    <div>
      {simuladoCard ? <div style={{ marginBottom: 20 }}>{simuladoCard}</div> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Questão {idx + 1} de {rows.length}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--green-glow)',
            color: 'var(--green-400)',
          }}
        >
          {stats.correct}/{stats.answered} corretas
        </span>
      </div>
      {loadingQ ? (
        <div className="broto-skeleton" style={{ height: 220, borderRadius: 20 }} />
      ) : !question ? (
        <div
          style={{
            padding: 20,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Não foi possível carregar esta questão.
          </p>
          <button type="button" className="broto-btn-primary" onClick={goNext}>
            {idx >= rows.length - 1 ? 'Continuar' : 'Pular questão'}
          </button>
        </div>
      ) : (
        <QuestionPlayer
          key={getQuestionId(question)}
          question={question}
          areaKey={areaKey}
          onNext={goNext}
          onAnswerRecorded={({ isCorrect }) => {
            if (isCorrect) correctRef.current += 1
            setStats((s) => ({
              correct: s.correct + (isCorrect ? 1 : 0),
              answered: s.answered + 1,
            }))
          }}
        />
      )}
    </div>
  )
}

/* ─── Practice Questions (conteúdo estático do pacote) ───── */

function PracticeQuestions({
  questions,
  onDone,
  simuladoCard,
}: {
  questions: StudyPackage['practiceQuestions']
  onDone: (correct: number, total: number) => void
  simuladoCard?: ReactNode
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const q = questions[currentIdx]
  const correct = q.alternatives.find((a) => a.isCorrect)?.letter ?? ''
  const isLast = currentIdx === questions.length - 1

  function handleSelect(letter: string) {
    if (answered) return
    setSelected(letter)
    setAnswered(true)
    setResults((prev) => [...prev, letter === correct])
  }

  function handleNext() {
    if (isLast) {
      const c = results.filter(Boolean).length
      onDone(c, results.length)
    } else {
      setSelected(null)
      setAnswered(false)
      setCurrentIdx((prev) => prev + 1)
    }
  }

  return (
    <div>
      {simuladoCard ? <div style={{ marginBottom: 20 }}>{simuladoCard}</div> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Questao {currentIdx + 1} de {questions.length}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--green-glow)',
            color: 'var(--green-400)',
          }}
        >
          {results.filter(Boolean).length}/{results.length} corretas
        </span>
      </div>

      {/* Question text */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          marginBottom: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}
        >
          {q.question}
        </p>
      </div>

      {/* Alternatives */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.alternatives.map((alt) => {
          const isSelected = selected === alt.letter
          const isCorrectAlt = alt.isCorrect
          let bg = 'var(--bg-deep)'
          let borderColor = 'var(--border-default)'
          let textColor = 'var(--text-primary)'
          let icon: React.ReactNode = null

          if (answered) {
            if (isCorrectAlt) {
              bg = 'rgba(16, 185, 129, 0.1)'
              borderColor = 'var(--green-500)'
              textColor = 'var(--green-400)'
              icon = <CheckCircle2 size={18} color="var(--green-400)" />
            } else if (isSelected) {
              bg = 'var(--red-glow)'
              borderColor = 'var(--red-500)'
              textColor = 'var(--red-400)'
              icon = <XCircle size={18} color="var(--red-400)" />
            }
          } else if (isSelected) {
            bg = 'var(--green-glow)'
            borderColor = 'var(--green-500)'
          }

          return (
            <button
              key={alt.letter}
              type="button"
              onClick={() => handleSelect(alt.letter)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${borderColor}`,
                background: bg,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background:
                    answered && isCorrectAlt ? 'var(--green-500)' : 'rgba(16,185,129,0.1)',
                  color: answered && isCorrectAlt ? '#fff' : 'var(--green-400)',
                }}
              >
                {alt.letter}
              </div>
              <span style={{ flex: 1, fontSize: '0.88rem', color: textColor }}>{alt.text}</span>
              {icon}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div
          style={{
            marginTop: 14,
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            background: selected === correct ? 'rgba(16,185,129,0.06)' : 'rgba(224,82,82,0.06)',
            border: `1px solid ${selected === correct ? 'rgba(16,185,129,0.15)' : 'rgba(224,82,82,0.15)'}`,
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: selected === correct ? 'var(--green-400)' : 'var(--red-400)',
            }}
          >
            {selected === correct ? 'Correto!' : 'Resposta incorreta'}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {q.explanation}
          </p>
        </div>
      )}

      {answered && (
        <button
          type="button"
          onClick={handleNext}
          className="broto-btn-primary"
          style={{ marginTop: 16, justifyContent: 'center' }}
        >
          {isLast ? 'Ver resultado' : 'Proxima questao'} <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

/* ─── Mind Map ─────────────────────────────── */

function MindMapView({
  mindMap,
  areaColor,
  onDone,
}: {
  mindMap: StudyPackage['mindMap']
  areaColor: string
  onDone: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderNode(node: MindMapNode, depth: number) {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = expanded.has(node.id)
    const isRoot = depth === 0

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? 20 : 0 }}>
        <button
          type="button"
          onClick={() => hasChildren && toggle(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isRoot ? '12px 16px' : '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: isRoot ? `1.5px solid ${areaColor}44` : '1px solid var(--border-subtle)',
            background: isRoot ? `${areaColor}10` : 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            marginBottom: 6,
            transition: 'background 0.15s',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown size={14} color="var(--text-muted)" />
            ) : (
              <ChevronRight size={14} color="var(--text-muted)" />
            ))}
          {!hasChildren && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: areaColor,
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: isRoot ? '0.95rem' : '0.85rem',
              fontWeight: isRoot ? 700 : depth === 1 ? 600 : 400,
              color: isRoot ? areaColor : 'var(--text-primary)',
            }}
          >
            {node.label}
          </span>
        </button>
        {hasChildren && isOpen && (
          <div
            style={{
              borderLeft: `2px solid ${areaColor}22`,
              marginLeft: 14,
              paddingLeft: 4,
            }}
          >
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Brain size={18} color={areaColor} />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Mapa Mental: {mindMap.topic}
        </h3>
      </div>

      <div
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {renderNode(mindMap.root, 0)}
      </div>

      <button
        type="button"
        onClick={() => {
          setExpanded(new Set(getAllIds(mindMap.root)))
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 12,
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          cursor: 'pointer',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
        }}
      >
        Expandir tudo
      </button>

      <button
        type="button"
        onClick={onDone}
        className="broto-btn-primary"
        style={{ marginTop: 16, justifyContent: 'center' }}
      >
        Fechar trilha <Trophy size={18} />
      </button>
    </div>
  )
}

function getAllIds(node: MindMapNode): string[] {
  const ids = [node.id]
  if (node.children) node.children.forEach((c) => ids.push(...getAllIds(c)))
  return ids
}

/* ─── Session Summary ──────────────────────── */

function SessionSummaryView({
  pkg,
  questionsCorrect,
  questionsTotal,
  flashcardsCount,
  areaColor,
  onBack,
  completed,
}: {
  pkg: StudyPackage
  questionsCorrect: number
  questionsTotal: number
  flashcardsCount: number
  areaColor: string
  onBack: () => void
  completed: Record<Tab, boolean>
}) {
  const xp = 50 + questionsCorrect * 10
  const trailHuman = STUDY_JOURNEY_STAGES.filter((s) => completed[s.tab])
    .map((s) => s.title)
    .join(' → ')
  const lastDoneTab = [...STUDY_JOURNEY_STAGES].reverse().find((s) => completed[s.tab])?.tab
  const brotoClose = lastDoneTab
    ? brotoCelebrateLine(lastDoneTab)
    : 'Orgulho do Broto: você chegou até aqui com calma.'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: `linear-gradient(135deg, ${areaColor}20, var(--gold-glow))`,
          border: `2px solid ${areaColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Trophy size={36} color="var(--gold-400)" />
      </div>

      <h2
        style={{
          margin: '0 0 8px',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Sessao concluida!
      </h2>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Você completou a trilha de <strong style={{ color: areaColor }}>{pkg.topicoLabel}</strong>
      </p>
      <p
        style={{
          margin: '14px 0 0',
          fontSize: '0.88rem',
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          maxWidth: 420,
        }}
      >
        {brotoClose}
      </p>
      {trailHuman ? (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          Etapas: {trailHuman}
        </p>
      ) : null}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          marginTop: 28,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {[
          {
            label: 'XP Ganho',
            value: `+${xp}`,
            icon: <Zap size={18} color="var(--gold-400)" />,
            color: 'var(--gold-glow)',
          },
          {
            label: 'Quiz',
            value: `${questionsCorrect}/${questionsTotal}`,
            icon: <CheckCircle2 size={18} color="var(--green-400)" />,
            color: 'var(--green-glow)',
          },
          {
            label: 'Flashcards',
            value: `${flashcardsCount}`,
            icon: <RotateCcw size={18} color={areaColor} />,
            color: `${areaColor}15`,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '18px 12px',
              borderRadius: 'var(--radius-md)',
              background: s.color,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {s.icon}
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {s.value}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Next suggestion */}
      <div
        style={{
          marginTop: 28,
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          width: '100%',
          maxWidth: 420,
          textAlign: 'left',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          Proximo passo sugerido
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          Continue praticando <strong>questoes do ENEM</strong> sobre {pkg.topicoLabel} para
          reforcar o aprendizado.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, width: '100%', maxWidth: 420 }}>
        <button
          type="button"
          onClick={onBack}
          className="broto-btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Estudar outro topico
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ────────────────────────────── */

export function StudyArea() {
  const { areaKey: areaKeyParam } = useParams<{ areaKey: string }>()
  const navigate = useNavigate()
  const { progress } = useProgress()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loadingTopicLabel, setLoadingTopicLabel] = useState('…')
  const [step, setStep] = useState<Step>('select')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [pkg, setPkg] = useState<StudyPackage | null>(null)
  /** Filas do banco quando o fluxo vem do “Foco de hoje” — questões ENEM reais com submit. */
  const [guidedBankRows, setGuidedBankRows] = useState<QuestionBankRow[] | null>(null)
  const [completed, setCompleted] = useState<Record<Tab, boolean>>({
    summary: false,
    flashcards: false,
    questions: false,
    mindmap: false,
  })
  const [questionsResult, setQuestionsResult] = useState({ correct: 0, total: 0 })
  const [showSummary, setShowSummary] = useState(false)
  const [simuladoModalOpen, setSimuladoModalOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const stageMainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!simuladoModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSimuladoModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [simuladoModalOpen])

  useEffect(() => {
    const bank = searchParams.get('bank')
    const areaParam = searchParams.get('area')
    if (bank !== '1') return
    const keys = STUDY_AREA_CARD_KEYS
    const area = areaParam && keys.includes(areaParam) ? areaParam : (keys[0] ?? null)
    const tid = window.setTimeout(() => {
      if (area) {
        navigate(`/study/${area}?hub=bank`, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }, 0)
    return () => window.clearTimeout(tid)
  }, [searchParams, setSearchParams, navigate])

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const invalidAreaKey =
    areaKeyParam != null && areaKeyParam !== '' && !STUDY_AREA_CARD_KEYS.includes(areaKeyParam)

  const selectedArea =
    areaKeyParam && STUDY_AREA_CARD_KEYS.includes(areaKeyParam) ? areaKeyParam : null

  const hubTopics = selectedArea ? topicsForAreaKey(selectedArea, progress?.areas) : []

  const hubSurface: HubSurface | null = !selectedArea
    ? null
    : searchParams.get('hub') === 'guided'
      ? 'guided'
      : searchParams.get('hub') === 'bank'
        ? 'bank'
        : 'menu'

  const areaColor = pkg ? getAreaColor(pkg.areaKey) : 'var(--green-500)'
  const areaLabel = pkg ? (AREA_CONFIG[pkg.areaKey]?.label ?? '') : ''

  const simuladoStudyCard = useMemo(() => {
    if (!pkg) return undefined
    return (
      <StudyPackageSimuladoSessionCard
        areaKey={pkg.areaKey}
        topicoValue={pkg.topicoValue}
        topicoLabel={pkg.topicoLabel}
        areaColor={areaColor}
        onOpenModal={() => setSimuladoModalOpen(true)}
      />
    )
  }, [pkg, areaColor])

  async function handleStart(
    areaKey: string,
    topico: TopicOption,
    bankPracticeRows?: QuestionBankRow[] | null,
  ) {
    setSimuladoModalOpen(false)
    setLoadingTopicLabel(topico.label)
    setStep('loading')
    setActiveTab('summary')
    setCompleted({ summary: false, flashcards: false, questions: false, mindmap: false })
    setShowSummary(false)
    setFocusMode(false)
    setLeaveDialogOpen(false)
    setGuidedBankRows(bankPracticeRows && bankPracticeRows.length > 0 ? bankPracticeRows : null)

    const data = await getMockStudyPackage(areaKey, topico.value)
    const blank: Record<Tab, boolean> = {
      summary: false,
      flashcards: false,
      questions: false,
      mindmap: false,
    }
    const draft = loadStudyPackageSessionDraft(areaKey, topico.value)
    let nextCompleted = { ...blank }
    let nextTab: Tab = 'summary'
    if (draft) {
      nextCompleted = { ...blank, ...draft.completed }
      nextTab = studyJourneyNextIncompleteTab(nextCompleted) ?? draft.activeTab
    }
    setCompleted(nextCompleted)
    setActiveTab(nextTab)
    setPkg({
      ...data,
      performance: {
        accuracy: topico.accuracy ?? 0,
        totalAnswered: topico.totalAnswered,
      },
    })
    setStep('study')
  }

  function markDone(tab: Tab) {
    setCompleted((prev) => ({ ...prev, [tab]: true }))
  }

  const goToTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab)
      scrollToTop()
    },
    [scrollToTop],
  )

  const handleBack = useCallback(() => {
    const key = pkg?.areaKey
    setSimuladoModalOpen(false)
    setStep('select')
    setPkg(null)
    setGuidedBankRows(null)
    setShowSummary(false)
    setFocusMode(false)
    setLeaveDialogOpen(false)
    if (key) navigate(`/study/${key}`)
  }, [pkg?.areaKey, navigate])

  const needsExitGuard = useMemo(
    () =>
      step === 'study' &&
      pkg != null &&
      !showSummary &&
      studyJourneyNextIncompleteTab(completed) !== null,
    [step, pkg, showSummary, completed],
  )

  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (!needsExitGuard) return false
      if (
        currentLocation.pathname === nextLocation.pathname &&
        currentLocation.search === nextLocation.search &&
        currentLocation.hash === nextLocation.hash
      ) {
        return false
      }
      return true
    },
    [needsExitGuard],
  )

  const blocker = useBlocker(shouldBlockNavigation)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveDialogOpen(true)
    }
  }, [blocker.state])

  /** Persistência contínua: o hub lê este rascunho; antes só gravava ao “Salvar e sair”. */
  useEffect(() => {
    if (step !== 'study' || !pkg) return
    saveStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue, { completed, activeTab })
  }, [step, pkg, completed, activeTab])

  useEffect(() => {
    if (!needsExitGuard) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [needsExitGuard])

  const requestStudyHubBack = useCallback(() => {
    if (needsExitGuard) {
      setLeaveDialogOpen(true)
    } else {
      handleBack()
    }
  }, [needsExitGuard, handleBack])

  const handleLeaveDialogContinue = useCallback(() => {
    setLeaveDialogOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const handleLeaveSaveAndExit = useCallback(() => {
    if (pkg) {
      saveStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue, { completed, activeTab })
    }
    setLeaveDialogOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    } else {
      handleBack()
    }
  }, [pkg, completed, activeTab, blocker, handleBack])

  const handleLeaveDiscardAndExit = useCallback(() => {
    if (pkg) {
      clearStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue)
    }
    setLeaveDialogOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    } else {
      handleBack()
    }
  }, [pkg, blocker, handleBack])

  const sessionStickyCopy = useMemo(() => {
    const label = pkg?.topicoLabel?.trim() ? pkg.topicoLabel : 'este tópico'
    const topicTitle = pkg?.topicoLabel?.trim() || 'tópico'
    return {
      title: 'Sessão no estilo ENEM',
      sub: `Monte um bloco focado em ${label} — quantidade de questões e ano à tua escolha.`,
      buttonText: `Fazer sessão de ${topicTitle}`,
    }
  }, [pkg?.topicoLabel])

  const handleSessionStickyPrimary = useCallback(() => {
    setSimuladoModalOpen(true)
  }, [])

  let studyBreadcrumb: StudyBreadcrumbParts | undefined
  if (step === 'loading' && selectedArea) {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'preparando…',
    }
  } else if (step === 'select' && selectedArea && hubSurface === 'menu') {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'O que estudar',
    }
  } else if (step === 'select' && selectedArea && hubSurface === 'bank') {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'Banco de questões',
    }
  } else if (pkg) {
    studyBreadcrumb = { area: areaLabel, detail: pkg.topicoLabel }
  }

  if (invalidAreaKey) {
    return <Navigate to="/study" replace />
  }

  return (
    <>
      <TopBar variant="study" title="Área de Estudo" studyBreadcrumb={studyBreadcrumb} />
      <div className="broto-main-inner broto-main-inner--study" ref={mainRef}>
        {step === 'select' && !selectedArea ? (
          <StudyLandingPick progress={progress ?? undefined} />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'menu' ? (
          <StudyHubMenu
            areaKey={selectedArea}
            topics={hubTopics}
            onChooseBank={() => navigate(`/study/${selectedArea}?hub=bank`)}
            onChangeArea={() => navigate('/study')}
            onStartTopic={handleStart}
          />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'guided' ? (
          <Navigate to={`/study/${selectedArea}`} replace />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'bank' ? (
          <QuestionBankView
            embedded
            preferredArea={selectedArea}
            onBackToHub={() => navigate(`/study/${selectedArea}`)}
            onOpenStudyPackageForRow={(row, practiceRows) => {
              if (!selectedArea) return
              const topico = hubTopics.find((t) => t.value === row.topicoValue) ?? {
                value: row.topicoValue ?? '',
                label: row.topicoLabel?.trim() ? row.topicoLabel : (row.topicoValue ?? 'Tópico'),
                accuracy: null,
                totalAnswered: 0,
              }
              if (!topico.value) return
              void handleStart(selectedArea, topico, practiceRows)
            }}
          />
        ) : null}

        {step === 'loading' && pkg === null && (
          <PackageLoading areaKey={selectedArea ?? ''} topicoLabel={loadingTopicLabel} />
        )}

        {step === 'study' && pkg && !showSummary && (
          <>
            <div
              className={`study-package-journey${focusMode ? ' study-package-journey--focus' : ''}`}
            >
              <StudyBackLink onClick={requestStudyHubBack} />

              <StudySanctuaryHeader
                topicLabel={pkg.topicoLabel}
                areaLabel={areaLabel}
                focusMode={focusMode}
                onToggleFocus={() => setFocusMode((v) => !v)}
                areaColor={areaColor}
              />
              <HumanTrailProgress
                completedCount={studyJourneyCompletedCount(completed)}
                areaColor={areaColor}
              />

              <StudyPackageJourneyGrid
                focusMode={focusMode}
                aside={
                  <GrowthTrail
                    activeTab={activeTab}
                    completed={completed}
                    onSelectTab={goToTab}
                    areaColor={areaColor}
                  />
                }
                main={
                  <div id="study-stage-main" ref={stageMainRef} className="study-stage-main">
                    {activeTab === 'summary' && (
                      <SummarySection
                        summary={pkg.summary}
                        areaColor={areaColor}
                        onDone={() => {
                          markDone('summary')
                          goToTab('flashcards')
                        }}
                      />
                    )}

                    {activeTab === 'flashcards' && (
                      <FlashcardDeck
                        cards={pkg.flashcards}
                        areaColor={areaColor}
                        onDone={() => {
                          markDone('flashcards')
                          goToTab('questions')
                        }}
                      />
                    )}

                    {activeTab === 'questions' &&
                      (guidedBankRows && guidedBankRows.length > 0 ? (
                        <GuidedBankPracticeQuestions
                          areaKey={pkg.areaKey}
                          rows={guidedBankRows}
                          simuladoCard={simuladoStudyCard}
                          onDone={(correct, total) => {
                            markDone('questions')
                            setQuestionsResult({ correct, total })
                            goToTab('mindmap')
                          }}
                        />
                      ) : (
                        <PracticeQuestions
                          questions={pkg.practiceQuestions}
                          simuladoCard={simuladoStudyCard}
                          onDone={(correct, total) => {
                            markDone('questions')
                            setQuestionsResult({ correct, total })
                            goToTab('mindmap')
                          }}
                        />
                      ))}

                    {activeTab === 'mindmap' && (
                      <MindMapView
                        mindMap={pkg.mindMap}
                        areaColor={areaColor}
                        onDone={() => {
                          markDone('mindmap')
                          clearStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue)
                          setShowSummary(true)
                          scrollToTop()
                        }}
                      />
                    )}
                  </div>
                }
              />

              <StickyContextCta
                title={sessionStickyCopy.title}
                sub={sessionStickyCopy.sub}
                buttonText={sessionStickyCopy.buttonText}
                areaColor={areaColor}
                onClick={handleSessionStickyPrimary}
              />
            </div>

            <StudyPackageLeaveDialog
              open={leaveDialogOpen}
              completedCount={studyJourneyCompletedCount(completed)}
              stageCount={STUDY_JOURNEY_STAGES.length}
              onContinue={handleLeaveDialogContinue}
              onSaveAndLeave={handleLeaveSaveAndExit}
              onDiscardAndLeave={handleLeaveDiscardAndExit}
            />
          </>
        )}

        {step === 'study' && pkg && showSummary && (
          <SessionSummaryView
            pkg={pkg}
            questionsCorrect={questionsResult.correct}
            questionsTotal={questionsResult.total}
            flashcardsCount={pkg.flashcards.length}
            areaColor={areaColor}
            onBack={handleBack}
            completed={completed}
          />
        )}
      </div>

      {simuladoModalOpen && pkg ? (
        <div
          role="presentation"
          className="broto-study-simulado-modal-backdrop"
          onClick={() => setSimuladoModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-simulado-modal-title"
            className="broto-study-simulado-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="study-simulado-modal-title" className="broto-sr-only">
              Configurar sessão ENEM (estilo simulado)
            </h2>
            <MockExamConfigurator
              variant="modal"
              presetArea={pkg.areaKey}
              presetTopicoValue={pkg.topicoValue}
              presetTopicoLabelHint={pkg.topicoLabel}
              onClose={() => setSimuladoModalOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
