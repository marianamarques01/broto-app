import type { RecentSessionRow, StudentActivityStats } from '@/hooks/useStudentEngagementDetail'
import type { StudentEngagementRow } from '@broto/shared'
import { EngagementStateBadge } from './EngagementStateBadge'
import { FollowUpButton } from './FollowUpButton'

type Props = {
  classId: string
  studentRow: StudentEngagementRow | null
  sessions: RecentSessionRow[]
  activity: StudentActivityStats | null
  inFollowUp: boolean
  loading: boolean
  onFollowUp: (action: 'mark' | 'resolve') => Promise<void>
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sessionKindLabel(kind: string): string {
  return kind === 'class_assignment' ? 'Atividade da turma' : 'Simulado'
}

export function StudentEngagementDetail({
  classId: _classId,
  studentRow,
  sessions,
  activity,
  inFollowUp,
  loading,
  onFollowUp,
}: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando engajamento…</p>
  }

  const lastActivity = activity?.lastActivityAt ?? studentRow?.lastActivityAt ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          {studentRow && <EngagementStateBadge state={studentRow.engagementState} />}
          <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Streak {studentRow?.streak ?? 0}d · última atividade {formatDate(lastActivity)}
          </p>
        </div>
        <FollowUpButton
          active={inFollowUp}
          onMark={() => onFollowUp('mark')}
          onResolve={() => onFollowUp('resolve')}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {[
          { label: 'Respostas (7d)', value: activity?.answers7d ?? 0 },
          { label: 'Acertos (7d)', value: activity?.correct7d ?? 0, color: 'var(--green-400)' },
          { label: 'Erros (7d)', value: activity?.incorrect7d ?? 0, color: 'var(--red-400)' },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-muted)' }}>
              {metric.label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 600,
                color: metric.color ?? 'var(--text-primary)',
              }}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Sessões recentes</h3>
        </div>

        {sessions.length === 0 ? (
          <p style={{ padding: '20px 18px', margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Nenhuma sessão de prática registrada ainda.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {sessions.map((session) => (
              <li
                key={session.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 13,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {sessionKindLabel(session.kind)}
                  </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                    {formatDate(session.createdAt)}
                    {!session.completedAt && ' · em andamento'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {session.totalQuestions > 0 ? (
                    <>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {session.totalCorrect}/{session.totalQuestions}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          color:
                            session.percentCorrect >= 70
                              ? 'var(--green-400)'
                              : session.percentCorrect >= 40
                                ? 'var(--gold-600)'
                                : 'var(--red-400)',
                        }}
                      >
                        {session.percentCorrect}%
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
