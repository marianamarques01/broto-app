import { Link } from 'react-router-dom'
import type { ClassRankingEntry } from '@broto/shared'
import { EmptyOrgState } from '@/components/school/EmptyOrgState'

type Props = {
  rankings: ClassRankingEntry[]
  loading: boolean
  orgActive7dPct: number
  totalStudents: number
  totalClasses: number
  abandonmentRiskIndex: number
  computedAt: string | null
  computedInline: boolean
  onManageClasses?: () => void
}

function pctLabel(value: number) {
  return `${Math.round(value)}%`
}

export function OrgDashboard({
  rankings,
  loading,
  orgActive7dPct,
  totalStudents,
  totalClasses,
  abandonmentRiskIndex,
  computedAt,
  computedInline,
  onManageClasses,
}: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando indicadores…</p>
  }

  if (totalClasses === 0) {
    return <EmptyOrgState onManageClasses={onManageClasses} />
  }

  const computedLabel = computedAt
    ? new Date(computedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Visão geral</h2>
        {computedLabel && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Atualizado em {computedLabel}
            {computedInline ? ' · cálculo em tempo real' : ''}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <MetricCard label="Turmas" value={String(totalClasses)} />
        <MetricCard label="Alunos" value={String(totalStudents)} />
        <MetricCard label="Ativos 7d" value={pctLabel(orgActive7dPct)} accent />
        <MetricCard label="Índice de risco" value={pctLabel(abandonmentRiskIndex)} warn />
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
          Ranking de turmas — % ativos (7 dias)
        </h3>

        {rankings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Nenhuma turma com dados de engajamento ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankings.map((entry, index) => (
              <div
                key={entry.classId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span
                  style={{
                    width: 28,
                    fontWeight: 700,
                    color: index < 3 ? 'var(--green-400)' : 'var(--text-muted)',
                    fontSize: 14,
                  }}
                >
                  #{index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to={`/classes/${entry.classId}/painel`}
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {entry.className}
                  </Link>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {entry.totalStudents} aluno{entry.totalStudents !== 1 ? 's' : ''}
                    {entry.missingCount > 0
                      ? ` · ${entry.missingCount} sumido${entry.missingCount !== 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color:
                        entry.active7dPct >= 70
                          ? 'var(--green-400)'
                          : entry.active7dPct >= 40
                            ? 'var(--gold-600)'
                            : 'var(--red-400)',
                    }}
                  >
                    {pctLabel(entry.active7dPct)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>ativos 7d</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string
  value: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 22,
          fontWeight: 700,
          color: accent ? 'var(--green-400)' : warn ? 'var(--gold-600)' : 'var(--text-primary)',
        }}
      >
        {value}
      </p>
    </div>
  )
}
