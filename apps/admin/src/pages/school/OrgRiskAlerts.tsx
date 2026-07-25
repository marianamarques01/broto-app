import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { OrgAtRiskAlert } from '@broto/shared'
import { EngagementStateBadge } from '@/components/teacher/EngagementStateBadge'

type Props = {
  alerts: OrgAtRiskAlert[]
  loading: boolean
}

const SEVERITY_LABELS: Record<number, string> = {
  100: 'Crítico',
  60: 'Atenção',
}

function severityMeta(severity: number) {
  if (severity >= 100) {
    return {
      label: SEVERITY_LABELS[100]!,
      color: 'var(--red-400)',
      bg: 'rgba(248, 113, 113, 0.08)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }
  return {
    label: SEVERITY_LABELS[60]!,
    color: 'var(--gold-600)',
    bg: 'rgba(245, 200, 66, 0.08)',
    border: 'rgba(245, 200, 66, 0.35)',
  }
}

export function OrgRiskAlerts({ alerts, loading }: Props) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'attention'>('all')

  const filtered = useMemo(() => {
    if (filter === 'critical') return alerts.filter((a) => a.severity >= 100)
    if (filter === 'attention') return alerts.filter((a) => a.severity < 100)
    return alerts
  }, [alerts, filter])

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando alertas…</p>
  }

  const criticalCount = alerts.filter((a) => a.severity >= 100).length
  const attentionCount = alerts.length - criticalCount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Alertas cross-turma</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Alunos com queda abrupta de engajamento, ordenados por severidade.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`Todos (${alerts.length})`}
        />
        <FilterChip
          active={filter === 'critical'}
          onClick={() => setFilter('critical')}
          label={`Críticos (${criticalCount})`}
        />
        <FilterChip
          active={filter === 'attention'}
          onClick={() => setFilter('attention')}
          label={`Atenção (${attentionCount})`}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Nenhum alerta no momento — turmas engajadas!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((alert) => {
            const meta = severityMeta(alert.severity)
            return (
              <div
                key={`${alert.classId}-${alert.userId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link
                      to={`/classes/${alert.classId}/students/${alert.userId}`}
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                    >
                      {alert.nome}
                    </Link>
                    <EngagementStateBadge state={alert.engagementState} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {alert.className}
                    {alert.streak > 0 ? ` · streak ${alert.streak}d` : ''}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    color: meta.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--green-600)' : 'var(--border-strong)'}`,
        background: active ? 'rgba(76, 175, 80, 0.12)' : 'transparent',
        color: active ? 'var(--green-400)' : 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
