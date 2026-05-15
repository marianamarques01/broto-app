import { useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronRight, ArrowDownUp } from 'lucide-react'
import { STUDY_JOURNEY_TABS } from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import type { TopicOption } from '@/lib/study-area-mock'
import { StudyAreaBankCard } from '@/components/study/StudyAreaBankCard'

const RING_R = 19
const RING_C = 2 * Math.PI * RING_R

const STUDY_TOPIC_JOURNEY_TOTAL = STUDY_JOURNEY_TABS.length

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

export type StudyAreaTopicsPanelProps = {
  areaKey: string
  topics: TopicOption[]
  onStartTopic: (areaKey: string, topico: TopicOption) => void
  onBankClick: () => void
  /** Quando true, reduz margem superior (ex.: dentro do hub do banco). */
  compactTop?: boolean
  /** Cartão ✨ Recomendação IA na barra lateral (default: true). */
  showAiRecommendation?: boolean
  /** Cartão «Banco de questões» na barra lateral (default: true). */
  showBankInSidebar?: boolean
}

export function StudyAreaTopicsPanel({
  areaKey,
  topics,
  onStartTopic,
  onBankClick,
  compactTop = false,
  showAiRecommendation = true,
  showBankInSidebar = true,
}: StudyAreaTopicsPanelProps) {
  const cfg = AREA_CONFIG[areaKey]
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

  const showSidebar = showAiRecommendation || showBankInSidebar

  return (
    <div
      className={`study-split${compactTop ? ' study-split--compact-top' : ''}${!showSidebar ? ' study-split--topics-only' : ''}`}
    >
      {showSidebar ? (
        <div className="study-side">
          {showAiRecommendation ? (
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
          ) : null}

          {showBankInSidebar ? (
            <StudyAreaBankCard areaKey={areaKey} onBankClick={onBankClick} />
          ) : null}
        </div>
      ) : null}

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
                  centerLabel={topic.accuracy !== null || jc > 0 ? `${tier.displayPct}%` : '—'}
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
  )
}
