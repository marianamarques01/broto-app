import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { AreaBars } from '@/components/progress/AreaBars'
import { TopicInsights } from '@/components/progress/TopicInsights'
import { useProgress } from '@/hooks/useProgress'
import { Target, CheckCircle2, XCircle } from 'lucide-react'
import { DEFAULT_AREAS } from '@/lib/default-areas'

export function Progress() {
  const { progress, loading } = useProgress()

  const hasData = !loading && progress !== null && progress.totalAnswered > 0
  const areas = progress?.areas ?? DEFAULT_AREAS
  const accuracyPct = progress?.accuracyPct ?? 0

  return (
    <div>
      <TopBar title="Progresso" />

      <div className="broto-main-inner">
        {/* Hero accuracy card */}
        <div className="broto-progress-hero broto-fade-in">
          <p className="broto-section-label" style={{ marginBottom: 8 }}>
            Taxa de acerto geral
          </p>
          <p className="broto-progress-hero__pct">
            {loading ? '—' : hasData ? `${accuracyPct}%` : '—'}
          </p>
          <div className="broto-progress-stats">
            {[
              {
                label: 'Questões',
                value: loading ? '—' : (progress?.totalAnswered ?? 0),
                icon: Target,
                color: 'var(--green-400)',
              },
              {
                label: 'Acertos',
                value: loading ? '—' : (progress?.totalCorrect ?? 0),
                icon: CheckCircle2,
                color: 'var(--green-500)',
              },
              {
                label: 'Erros',
                value: loading
                  ? '—'
                  : (progress?.totalAnswered ?? 0) - (progress?.totalCorrect ?? 0),
                icon: XCircle,
                color: 'var(--red-400)',
              },
            ].map((stat) => (
              <div key={stat.label} className="broto-progress-stat">
                <stat.icon size={16} style={{ color: stat.color, marginBottom: 4 }} />
                <div className="broto-progress-stat__value">{stat.value}</div>
                <div className="broto-progress-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Bars */}
        <div className="broto-fade-in broto-fade-in-delay-1">
          <h3 className="broto-section-label">Desempenho por área</h3>
          <AreaBars areas={areas} loading={loading} />
        </div>

        {/* Topic Insights */}
        {hasData && (
          <div className="broto-fade-in broto-fade-in-delay-2" style={{ marginTop: 28 }}>
            <TopicInsights areas={progress!.areas} />
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasData && (
          <div
            className="broto-empty-state broto-fade-in broto-fade-in-delay-2"
            style={{ marginTop: 8 }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{'\u{1F4CA}'}</div>
            <p
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 6px',
              }}
            >
              Seu progresso aparece aqui
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>
              Responda questões para ver desempenho por área e tópico.
            </p>
            <Link to="/study" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <button type="button" className="broto-btn-primary broto-btn-primary--inline">
                Praticar questões
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
