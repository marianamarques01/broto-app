import { filterDisplayAreas } from '@broto/shared'
import type { AreaStat, TopicoStat } from '@/hooks/useProgress'
import { TrendingUp, TrendingDown } from 'lucide-react'

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

interface TopicInsightsProps {
  areas: AreaStat[]
}

function TopicChip({ topic, variant }: { topic: TopicoStat; variant: 'forte' | 'fraco' }) {
  const isForte = variant === 'forte'
  const color = isForte ? 'var(--green-400)' : 'var(--red-400)'
  const bg = isForte ? 'rgba(16, 185, 129, 0.08)' : 'rgba(224, 82, 82, 0.08)'
  const borderColor = isForte ? 'rgba(16, 185, 129, 0.2)' : 'rgba(224, 82, 82, 0.2)'
  const Icon = isForte ? TrendingUp : TrendingDown

  return (
    <div
      className={`broto-topic-chip broto-topic-chip--${variant}`}
      style={{ background: bg, borderColor }}
    >
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {topic.label}
        </div>
        <div style={{ fontSize: '0.68rem', marginTop: 2, color: 'var(--text-muted)' }}>
          {topic.totalAnswered} questões
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{topic.accuracyPct}%</span>
    </div>
  )
}

export function TopicInsights({ areas }: TopicInsightsProps) {
  const fortes = getTopFortes(areas)
  const fracos = getTopFracos(areas)

  if (fortes.length === 0 && fracos.length === 0) return null

  return (
    <div className="broto-topic-insights">
      {fortes.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--green-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 10px',
            }}
          >
            Pontos fortes
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fortes.map((t) => (
              <TopicChip key={t.value} topic={t} variant="forte" />
            ))}
          </div>
        </div>
      )}
      {fracos.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--red-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 10px',
            }}
          >
            A melhorar
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fracos.map((t) => (
              <TopicChip key={t.value} topic={t} variant="fraco" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
