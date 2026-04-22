import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { AreaStat, TopicoStat } from '@/hooks/useProgress'
import { TrendingDown, TrendingUp } from 'lucide-react'

function areaKeyForTopic(areas: AreaStat[], topicValue: string): string {
  for (const a of areas) {
    if (a.topicos.some((t) => t.value === topicValue)) return a.value
  }
  return 'linguagens'
}

function getTopFortes(areas: AreaStat[]): TopicoStat[] {
  return areas
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered >= 3)
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 3)
}

function getTopFracos(areas: AreaStat[]): TopicoStat[] {
  return areas
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
  const color = isForte ? 'var(--green-400)' : 'var(--red-400)'
  const Icon = isForte ? TrendingUp : TrendingDown
  const areaKey = areaKeyForTopic(areas, topic.value)

  return (
    <div className="broto-prog-topic-chip-wrapper">
      <div
        className={`broto-topic-chip broto-topic-chip--${variant}`}
        style={{ alignItems: 'center' }}
      >
        <Icon size={16} style={{ color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {topic.label}
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: 2, color: 'var(--text-muted)' }}>
            {topic.totalAnswered} questões
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{topic.accuracyPct}%</span>
      </div>
      <Link
        to={`/study/${areaKey}?hub=bank`}
        className="broto-progress-topic-cta"
      >
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
        <div className="broto-section-heading-row">
          <h2 id="progress-topics-title" className="broto-perf-card__title">
            Foco por tópico
          </h2>
        </div>
      </div>
      <div className="broto-perf-card">
        <p className="broto-perf-card__subtitle">
          Com base em tópicos com pelo menos 3 questões respondidas.
        </p>
        <div className="broto-prog-topics broto-progress-topic-cols">
        {fortes.length > 0 ? (
          <div className="broto-prog-topic-group">
            <h3 className="broto-prog-topic-heading broto-prog-topic-heading--forte">
              <TrendingUp size={14} /> Pontos fortes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
