import type { NetworkEngagementView } from '@broto/shared'
import './network-dashboard.css'

type Props = {
  view: NetworkEngagementView | null
  loading: boolean
  computedInline: boolean
  periodDays: number | undefined
  regional: string
  grade: string
  onPeriodChange: (days: number | undefined) => void
  onRegionalChange: (value: string) => void
  onGradeChange: (value: string) => void
}

function pctLabel(value: number) {
  return `${Math.round(value)}%`
}

function riskTone(index: number): 'warn' | 'good' | '' {
  if (index >= 60) return 'warn'
  if (index < 40) return 'good'
  return ''
}

export function NetworkDashboard({
  view,
  loading,
  computedInline,
  periodDays,
  regional,
  grade,
  onPeriodChange,
  onRegionalChange,
  onGradeChange,
}: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Carregando painel de rede…</p>
  }

  const computedLabel = view?.computedAt
    ? new Date(view.computedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="network-dashboard" data-testid="network-dashboard">
      {view?.hasDemoData && (
        <div className="network-dashboard__demo-banner" data-testid="network-demo-banner">
          Dados de demonstração — métricas agregadas para apresentação comercial. Nomes de alunos
          não são exibidos nesta visão.
        </div>
      )}

      <div className="network-dashboard__filters">
        <div className="network-dashboard__filter">
          <label htmlFor="network-filter-period">Período</label>
          <select
            id="network-filter-period"
            data-testid="network-filter-period"
            value={periodDays ?? 'all'}
            onChange={(e) => {
              const v = e.target.value
              onPeriodChange(v === 'all' ? undefined : Number(v))
            }}
          >
            <option value="all">Último snapshot</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <div className="network-dashboard__filter">
          <label htmlFor="network-filter-regional">Regional</label>
          <select
            id="network-filter-regional"
            data-testid="network-filter-regional"
            value={regional}
            onChange={(e) => onRegionalChange(e.target.value)}
          >
            <option value="all">Todas</option>
            {(view?.availableRegionals ?? []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="network-dashboard__filter">
          <label htmlFor="network-filter-grade">Série</label>
          <select
            id="network-filter-grade"
            data-testid="network-filter-grade"
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
          >
            <option value="all">Todas</option>
            {(view?.availableGrades ?? []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {computedLabel && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Atualizado em {computedLabel}
          {computedInline ? ' · cálculo em tempo real' : ''}
        </p>
      )}

      <div className="network-dashboard__hero">
        <div className="network-dashboard__metric">
          <p className="network-dashboard__metric-label">Escolas</p>
          <p className="network-dashboard__metric-value">{view?.totalSchools ?? 0}</p>
        </div>
        <div className="network-dashboard__metric">
          <p className="network-dashboard__metric-label">Alunos (agregado)</p>
          <p className="network-dashboard__metric-value">{view?.totalStudents ?? 0}</p>
        </div>
        <div className="network-dashboard__metric">
          <p className="network-dashboard__metric-label">Média ativos 7d</p>
          <p
            className={`network-dashboard__metric-value network-dashboard__metric-value--good`}
            data-testid="network-summary-active"
          >
            {pctLabel(view?.avgActive7dPct ?? 0)}
          </p>
        </div>
        <div className="network-dashboard__metric">
          <p className="network-dashboard__metric-label">Índice risco médio</p>
          <p
            className={`network-dashboard__metric-value network-dashboard__metric-value--${riskTone(view?.avgAbandonmentRiskIndex ?? 0)}`}
            data-testid="network-summary-risk"
          >
            {pctLabel(view?.avgAbandonmentRiskIndex ?? 0)}
          </p>
        </div>
      </div>

      <p className="network-dashboard__formula">
        <strong>Índice de risco de abandono (0–100):</strong> 40% × inativos 7d + 35% × alunos
        sumidos + 25% × streak quebrado. Acima de 60 = alto risco. Fórmula v1 documentada em{' '}
        <code>docs/instituicoes-arquitetura.md</code> e{' '}
        <code>packages/shared/src/engagement/compute-org-engagement-index.ts</code>.
      </p>

      {(view?.schools.length ?? 0) === 0 ? (
        <p data-testid="network-empty-state" style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          Nenhuma escola com dados para os filtros selecionados. Execute o seed de demo ou aguarde o
          job de snapshots.
        </p>
      ) : (
        <div className="network-dashboard__schools">
          {view?.schools.map((school) => (
            <article
              key={school.organizationId}
              className="network-dashboard__school-card"
              data-testid={`network-school-card-${school.organizationId}`}
            >
              <div>
                <h3 className="network-dashboard__school-name">{school.schoolName}</h3>
                <p className="network-dashboard__school-meta">
                  {[school.regionalLabel, school.gradeLabel].filter(Boolean).join(' · ') ||
                    'Sem regional/série'}
                  {school.isDemo ? ' · Demo' : ''}
                </p>
              </div>

              <div className="network-dashboard__school-stats">
                <div className="network-dashboard__school-stat">
                  <span className="network-dashboard__school-stat-label">Ativos 7d</span>
                  <span className="network-dashboard__school-stat-value">
                    {pctLabel(school.active7dPct)}
                  </span>
                </div>
                <div className="network-dashboard__school-stat">
                  <span className="network-dashboard__school-stat-label">Índice risco</span>
                  <span
                    className={`network-dashboard__school-stat-value`}
                    style={{
                      color:
                        school.abandonmentRiskIndex >= 60
                          ? 'var(--red-400)'
                          : school.abandonmentRiskIndex < 40
                            ? 'var(--green-400)'
                            : 'var(--text-primary)',
                    }}
                  >
                    {pctLabel(school.abandonmentRiskIndex)}
                  </span>
                </div>
                <div className="network-dashboard__school-stat">
                  <span className="network-dashboard__school-stat-label">Alunos</span>
                  <span className="network-dashboard__school-stat-value">
                    {school.totalStudents}
                  </span>
                </div>
                <div className="network-dashboard__school-stat">
                  <span className="network-dashboard__school-stat-label">Sumidos</span>
                  <span className="network-dashboard__school-stat-value">{school.missingCount}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
