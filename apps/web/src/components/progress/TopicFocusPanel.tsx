import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { filterDisplayAreas } from '@broto/shared'
import type { AreaStat, TopicoStat } from '@/hooks/useProgress'
import { TrendingDown, TrendingUp } from 'lucide-react'

function areaKeyForTopic(areas: AreaStat[], topicValue: string): string {
  for (const a of areas) {
    if (a.topicos.some((t) => t.value === topicValue)) return a.value
  }
  return 'linguagens'
}

function getTopFortes(areas: AreaStat[]): TopicoStat[] {
  return filterDisplayAreas(areas)
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered >= 3)
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 3)
}

function getTopFracos(areas: AreaStat[]): TopicoStat[] {
  return filterDisplayAreas(areas)
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered >= 3)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 3)
}

interface TopicFocusPanelProps {
  areas: AreaStat[]
}

function TopicRow({
  topic,
  variant,
  areas,
}: {
  topic: TopicoStat
  variant: 'forte' | 'fraco'
  areas: AreaStat[]
}) {
  const isForte = variant === 'forte'
  const Icon = isForte ? TrendingUp : TrendingDown
  const areaKey = areaKeyForTopic(areas, topic.value)

  return (
    <div className="broto-prog-topic-chip-wrapper">
      <div className={`broto-topic-chip broto-topic-chip--${variant} broto-progress-topic-row`}>
        <Icon size={16} className="broto-progress-topic-row__icon" aria-hidden />
        <div className="broto-progress-topic-row__body">
          <div className="broto-progress-topic-row__title">{topic.label}</div>
          <div className="broto-progress-topic-row__meta">{topic.totalAnswered} questões</div>
        </div>
        <span className="broto-progress-topic-row__pct">{topic.accuracyPct}%</span>
      </div>
      <Link to={`/study/${areaKey}`} className="broto-progress-topic-cta">
        Abrir área
      </Link>
    </div>
  )
}

export function TopicFocusPanel({ areas }: TopicFocusPanelProps) {
  const fortes = useMemo(() => getTopFortes(areas), [areas])
  const fracos = useMemo(() => getTopFracos(areas), [areas])

  if (fortes.length === 0 && fracos.length === 0) return null

  return (
    <section
      className="broto-perf-section broto-progress-topic-section"
      aria-labelledby="progress-topics-title"
    >
      <div className="broto-perf-external-head">
        <div className="broto-section-heading-row broto-section-heading-row--progress-stack">
          <div className="broto-progress-heading-stack">
            <h2 id="progress-topics-title" className="broto-perf-card__title">
              Foco por tópico
            </h2>
            <p className="broto-progress-block-lede">
              Tópicos com pelo menos 3 questões — úteis para revisão rápida antes de uma sessão tipo
              simulado.
            </p>
          </div>
        </div>
      </div>
      <div className="broto-perf-card">
        <p className="broto-perf-card__subtitle broto-perf-card__subtitle--tight">
          Legenda: pelo menos 3 questões no tópico para entrar na lista.
        </p>
        <div className="broto-prog-topics broto-progress-topic-cols">
          {fortes.length > 0 ? (
            <div className="broto-prog-topic-group">
              <h3 className="broto-prog-topic-heading broto-prog-topic-heading--forte">
                <TrendingUp size={14} /> Pontos fortes
              </h3>
              <div className="broto-prog-topic-stack">
                {fortes.map((t) => (
                  <TopicRow key={t.value} topic={t} variant="forte" areas={areas} />
                ))}
              </div>
            </div>
          ) : null}
          {fracos.length > 0 ? (
            <div className="broto-prog-topic-group">
              <h3 className="broto-prog-topic-heading broto-prog-topic-heading--fraco">
                <TrendingDown size={14} /> A melhorar
              </h3>
              <div className="broto-prog-topic-stack">
                {fracos.map((t) => (
                  <TopicRow key={t.value} topic={t} variant="fraco" areas={areas} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
