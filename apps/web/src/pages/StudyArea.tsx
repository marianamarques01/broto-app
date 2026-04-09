import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TopBar, type StudyBreadcrumbParts } from '@/components/layout/TopBar'
import { AREA_CONFIG, getAreaColor } from '@/lib/area-config'
import {
  BookOpen,
  BookMarked,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  HelpCircle,
  Map,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Zap,
  Loader2,
  ClipboardList,
  ArrowDownUp,
} from 'lucide-react'
import {
  getMockTopics,
  getMockStudyPackage,
  type StudyPackage,
  type StudyFlashcard,
  type TopicOption,
  type MindMapNode,
} from '@/lib/study-area-mock'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import { QuestionBankView } from '@/components/study/QuestionBankView'

/* ─── Types ────────────────────────────────── */

type Step = 'select' | 'loading' | 'study'
type Tab = 'summary' | 'flashcards' | 'questions' | 'mindmap'
type HubSurface = 'menu' | 'guided' | 'bank'

const RING_R = 19
const RING_C = 2 * Math.PI * RING_R

/** Áreas reais do ENEM — `sem_area` é só fallback de dados, não entra na grade. */
const STUDY_AREA_CARD_KEYS = Object.keys(AREA_CONFIG).filter((k) => k !== 'sem_area')

function computeTopicStats(topics: TopicOption[]) {
  const totalAnswered = topics.reduce((s, t) => s + t.totalAnswered, 0)
  const withData = topics.filter((t) => t.accuracy !== null)
  let weightedAcc: number | null = null
  if (withData.length > 0) {
    const num = withData.reduce((s, t) => s + t.accuracy! * t.totalAnswered, 0)
    const den = withData.reduce((s, t) => s + t.totalAnswered, 0)
    weightedAcc = den > 0 ? Math.round(num / den) : null
  }
  const lowest =
    withData.length > 0 ? Math.min(...withData.map((t) => t.accuracy!)) : null
  return {
    totalAnswered,
    weightedAcc,
    lowest,
    topicCount: topics.length,
  }
}

function topicsForScope(areaKey: string | null): TopicOption[] {
  if (areaKey) return getMockTopics(areaKey)
  return STUDY_AREA_CARD_KEYS.flatMap((k) => getMockTopics(k))
}

function areaCardAverage(areaKey: string): number | null {
  const topics = getMockTopics(areaKey)
  const withData = topics.filter((t) => t.accuracy !== null)
  if (withData.length === 0) return null
  const num = withData.reduce((s, t) => s + t.accuracy! * t.totalAnswered, 0)
  const den = withData.reduce((s, t) => s + t.totalAnswered, 0)
  return den > 0 ? Math.round(num / den) : null
}

function topicTier(accuracy: number | null): {
  label: string
  tagClass: string
  ringColor: string
  displayPct: number
  metaHint: string
} {
  if (accuracy === null) {
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

function RingProgress({ pct, stroke, centerLabel }: { pct: number; stroke: string; centerLabel: string }) {
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

function StudyLandingPick({ onPickArea }: { onPickArea: (areaKey: string) => void }) {
  const scopeTopics = topicsForScope(null)
  const welcomeStats = computeTopicStats(scopeTopics)
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
            Selecione uma área — depois você escolhe trilha guiada por tópico (resumo, flashcards, quiz e
            mapa) ou o <strong>banco completo de questões</strong> do ENEM.
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
          const avg = areaCardAverage(key)
          const n = getMockTopics(key).length
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
              onClick={() => onPickArea(key)}
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
    </div>
  )
}

/* ─── Menu: o que fazer na área ───────────── */

function StudyHubMenu({
  areaKey,
  onChooseGuided,
  onChooseBank,
  onChangeArea,
}: {
  areaKey: string
  onChooseGuided: () => void
  onChooseBank: () => void
  onChangeArea: () => void
}) {
  const cfg = AREA_CONFIG[areaKey]
  const Icon = cfg?.icon ?? BookOpen

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
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Área selecionada
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: '1.28rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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

      <p style={{ margin: '0 0 18px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Como você quer estudar nesta área?
      </p>

      <div
        className="study-hub-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        <button type="button" className="study-banco" onClick={onChooseGuided} style={{ textAlign: 'left' }}>
          <div className="study-banco__head">
            <div className="study-banco__icon">
              <BookMarked size={16} strokeWidth={1.8} aria-hidden />
            </div>
            <h4 className="study-banco__title">Trilha por tópico</h4>
          </div>
          <p className="study-banco__desc">
            Escolha um tópico e siga resumo, flashcards, quiz rápido e mapa mental (conteúdo guiado).
          </p>
          <div className="study-banco__arrow">
            Começar
            <ChevronRight size={14} strokeWidth={2} aria-hidden />
          </div>
        </button>

        <button type="button" className="study-banco" onClick={onChooseBank} style={{ textAlign: 'left' }}>
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

        <Link className="study-banco" to="/study/mock-exam" style={{ textAlign: 'left' }}>
          <div className="study-banco__head">
            <div className="study-banco__icon">
              <Brain size={16} strokeWidth={1.8} aria-hidden />
            </div>
            <h4 className="study-banco__title">Simulado ENEM</h4>
          </div>
          <p className="study-banco__desc">
            Monte um simulado com quantidade e filtros personalizados e acompanhe o resultado.
          </p>
          <div className="study-banco__arrow">
            Configurar
            <ChevronRight size={14} strokeWidth={2} aria-hidden />
          </div>
        </Link>
      </div>
    </div>
  )
}

/* ─── Trilha: tópicos + spotlight (sem cards de área) ─ */

function StudyGuidedPanel({
  selectedArea,
  onStart,
  onBackToMenu,
}: {
  selectedArea: string
  onStart: (areaKey: string, topico: TopicOption) => void
  onBackToMenu: () => void
}) {
  const [sortWeakestFirst, setSortWeakestFirst] = useState(true)
  const topics = getMockTopics(selectedArea)

  const sorted = [...topics].sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) return 0
    if (a.accuracy === null) return 1
    if (b.accuracy === null) return -1
    return sortWeakestFirst ? a.accuracy - b.accuracy : b.accuracy - a.accuracy
  })

  const weakestInArea = sorted.find((t) => t.accuracy !== null)
  const spotlight =
    weakestInArea != null
      ? {
          areaKey: selectedArea,
          topic: weakestInArea,
          areaLabel: AREA_CONFIG[selectedArea]?.label ?? '',
        }
      : null

  const suggestedValue = weakestInArea?.value

  return (
    <div>
      <button
        type="button"
        onClick={onBackToMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          padding: '6px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
        }}
      >
        <ArrowLeft size={14} aria-hidden />
        Voltar ao menu da área
      </button>

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
                void onStart(spotlight.areaKey, spotlight.topic)
              }}
            >
              Estudar agora
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div className="study-topics">
          <div className="study-topics__header">
            <h2 className="study-topics__title">
              Tópicos de {AREA_CONFIG[selectedArea]?.label ?? ''}
            </h2>
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
              const tier = topicTier(topic.accuracy)
              const isSuggested = topic.value === suggestedValue && topic.accuracy !== null
              const q =
                topic.totalAnswered === 1 ? '1 questão' : `${topic.totalAnswered} questões`
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
                  onClick={() => onStart(selectedArea, topic)}
                >
                  <RingProgress
                    pct={tier.displayPct}
                    stroke={tier.ringColor}
                    centerLabel={topic.accuracy === null ? '—' : `${tier.displayPct}%`}
                  />
                  <div className="study-topic-card__body">
                    <p className="study-topic-card__name">{topic.label}</p>
                    <div className="study-topic-card__meta">
                      <span>{q}</span>
                      <span className="study-topic-card__meta-sep" aria-hidden />
                      <span>{tier.metaHint}</span>
                    </div>
                  </div>
                  <span className={`study-topic-card__tag ${tier.tagClass}`}>{tier.label}</span>
                  <ChevronRight size={16} strokeWidth={2} className="study-topic-card__chev" aria-hidden />
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

/* ─── Session Progress Bar ─────────────────── */

function SessionProgress({
  current,
  tabs,
  activeTab,
  onTabChange,
  areaColor,
}: {
  current: Record<Tab, boolean>
  tabs: Tab[]
  activeTab: Tab
  onTabChange: (t: Tab) => void
  areaColor: string
}) {
  const done = tabs.filter((t) => current[t]).length
  const pct = Math.round((done / tabs.length) * 100)
  const ICONS: Record<Tab, typeof BookOpen> = {
    summary: BookOpen,
    flashcards: RotateCcw,
    questions: HelpCircle,
    mindmap: Map,
  }
  const LABELS: Record<Tab, string> = {
    summary: 'Resumo',
    flashcards: 'Flashcards',
    questions: 'Quiz',
    mindmap: 'Mapa Mental',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.28)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${areaColor}, ${areaColor}cc)`,
              transition: 'width 0.4s ease',
              boxShadow: `0 0 12px ${areaColor}40`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: areaColor,
            minWidth: 36,
            textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {tabs.map((tab) => {
          const Icon = ICONS[tab]
          const active = activeTab === tab
          const completed = current[tab]
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                border: active ? `1.5px solid ${areaColor}` : '1px solid var(--border-default)',
                background: active ? `${areaColor}12` : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 500,
                color: active
                  ? areaColor
                  : completed
                    ? 'var(--green-400)'
                    : 'var(--text-secondary)',
              }}
            >
              {completed && !active ? <CheckCircle2 size={14} /> : <Icon size={14} />}
              {LABELS[tab]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Summary Section ──────────────────────── */

function SummarySection({
  summary,
  areaColor,
  onDone,
}: {
  summary: StudyPackage['summary']
  areaColor: string
  onDone: () => void
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

      <button
        type="button"
        onClick={onDone}
        className="broto-btn-primary"
        style={{ marginTop: 20, justifyContent: 'center' }}
      >
        Continuar para Flashcards <ArrowRight size={18} />
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
          Continuar para Quiz <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

/* ─── Practice Questions ───────────────────── */

function PracticeQuestions({
  questions,
  onDone,
}: {
  questions: StudyPackage['practiceQuestions']
  onDone: (correct: number, total: number) => void
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
        Concluir sessao <Trophy size={18} />
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
}: {
  pkg: StudyPackage
  questionsCorrect: number
  questionsTotal: number
  flashcardsCount: number
  areaColor: string
  onBack: () => void
}) {
  const xp = 50 + questionsCorrect * 10
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
        Voce completou o estudo de <strong style={{ color: areaColor }}>{pkg.topicoLabel}</strong>
      </p>

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [hubSurface, setHubSurface] = useState<HubSurface | null>(null)
  const [loadingTopicLabel, setLoadingTopicLabel] = useState('…')
  const [step, setStep] = useState<Step>('select')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [pkg, setPkg] = useState<StudyPackage | null>(null)
  const [completed, setCompleted] = useState<Record<Tab, boolean>>({
    summary: false,
    flashcards: false,
    questions: false,
    mindmap: false,
  })
  const [questionsResult, setQuestionsResult] = useState({ correct: 0, total: 0 })
  const [showSummary, setShowSummary] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bank = searchParams.get('bank')
    const areaParam = searchParams.get('area')
    if (bank !== '1') return
    const keys = STUDY_AREA_CARD_KEYS
    const area =
      areaParam && keys.includes(areaParam) ? areaParam : keys[0] ?? null
    const tid = window.setTimeout(() => {
      if (area) {
        setSelectedArea(area)
        setHubSurface('bank')
        setStep('select')
      }
      setSearchParams({}, { replace: true })
    }, 0)
    return () => window.clearTimeout(tid)
  }, [searchParams, setSearchParams])

  const areaColor = pkg ? getAreaColor(pkg.areaKey) : 'var(--green-500)'
  const areaLabel = pkg ? (AREA_CONFIG[pkg.areaKey]?.label ?? '') : ''

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  async function handleStart(areaKey: string, topico: TopicOption) {
    setSelectedArea(areaKey)
    setLoadingTopicLabel(topico.label)
    setStep('loading')
    setActiveTab('summary')
    setCompleted({ summary: false, flashcards: false, questions: false, mindmap: false })
    setShowSummary(false)

    const data = await getMockStudyPackage(areaKey, topico.value)
    setPkg(data)
    setStep('study')
  }

  function markDone(tab: Tab) {
    setCompleted((prev) => ({ ...prev, [tab]: true }))
  }

  function goToTab(tab: Tab) {
    setActiveTab(tab)
    scrollToTop()
  }

  function handleBack() {
    setStep('select')
    setPkg(null)
    setShowSummary(false)
    setHubSurface('guided')
  }

  const TABS: Tab[] = ['summary', 'flashcards', 'questions', 'mindmap']

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
  } else if (step === 'select' && selectedArea && hubSurface === 'guided') {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'Trilha por tópico',
    }
  } else if (step === 'select' && selectedArea && hubSurface === 'bank') {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'Banco de questões',
    }
  } else if (pkg) {
    studyBreadcrumb = { area: areaLabel, detail: pkg.topicoLabel }
  }

  return (
    <>
      <TopBar variant="study" title="Área de Estudo" studyBreadcrumb={studyBreadcrumb} />
      <div className="broto-main-inner broto-main-inner--study" ref={mainRef}>
        {step === 'select' && !selectedArea ? (
          <StudyLandingPick
            onPickArea={(key) => {
              setSelectedArea(key)
              setHubSurface('menu')
            }}
          />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'menu' ? (
          <StudyHubMenu
            areaKey={selectedArea}
            onChooseGuided={() => setHubSurface('guided')}
            onChooseBank={() => setHubSurface('bank')}
            onChangeArea={() => {
              setSelectedArea(null)
              setHubSurface(null)
            }}
          />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'guided' ? (
          <StudyGuidedPanel
            selectedArea={selectedArea}
            onStart={handleStart}
            onBackToMenu={() => setHubSurface('menu')}
          />
        ) : null}

        {step === 'select' && selectedArea && hubSurface === 'bank' ? (
          <QuestionBankView
            embedded
            preferredArea={selectedArea}
            onBackToHub={() => setHubSurface('menu')}
          />
        ) : null}

        {step === 'loading' && pkg === null && (
          <PackageLoading areaKey={selectedArea ?? ''} topicoLabel={loadingTopicLabel} />
        )}

        {step === 'study' && pkg && !showSummary && (
          <>
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
                padding: '6px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}
            >
              <ArrowLeft size={14} /> Voltar para selecao
            </button>

            <SessionProgress
              current={completed}
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={goToTab}
              areaColor={areaColor}
            />

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

            {activeTab === 'questions' && (
              <PracticeQuestions
                questions={pkg.practiceQuestions}
                onDone={(correct, total) => {
                  markDone('questions')
                  setQuestionsResult({ correct, total })
                  goToTab('mindmap')
                }}
              />
            )}

            {activeTab === 'mindmap' && (
              <MindMapView
                mindMap={pkg.mindMap}
                areaColor={areaColor}
                onDone={() => {
                  markDone('mindmap')
                  setShowSummary(true)
                  scrollToTop()
                }}
              />
            )}
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
          />
        )}
      </div>
    </>
  )
}
