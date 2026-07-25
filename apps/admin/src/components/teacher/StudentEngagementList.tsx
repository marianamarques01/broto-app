import { Link } from 'react-router-dom'
import type { ClassEngagementSnapshot } from '@broto/shared'
import { EngagementStateBadge, engagementStateMeta } from './EngagementStateBadge'
import { FollowUpButton } from './FollowUpButton'
import { EmptyClassState, resolveEmptyClassVariant } from './EmptyClassState'

type Props = {
  classId: string
  snapshot: ClassEngagementSnapshot | null
  followUpStudentIds: ReadonlySet<string>
  loading: boolean
  accessCode?: string
  onFollowUp: (studentId: string, action: 'mark' | 'resolve') => Promise<void>
}

export function StudentEngagementList({
  classId,
  snapshot,
  followUpStudentIds,
  loading,
  accessCode,
  onFollowUp,
}: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando alunos…</p>
  }

  const emptyVariant = snapshot
    ? resolveEmptyClassVariant(
        snapshot.totalStudents,
        snapshot.active7dCount,
        snapshot.weakTopics.length > 0 ||
          snapshot.students.some((s) => s.lastActivityAt !== null),
      )
    : 'no_students'

  if (!snapshot || emptyVariant === 'no_students' || emptyVariant === 'no_activity') {
    return (
      <EmptyClassState
        variant={emptyVariant ?? 'no_students'}
        accessCode={accessCode}
      />
    )
  }

  const students = [...snapshot.students].sort((a, b) => {
    const order = { missing: 0, at_risk: 1, engaged: 2 }
    return order[a.engagementState] - order[b.engagementState]
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {emptyVariant === 'insufficient_data' && (
        <EmptyClassState variant="insufficient_data" />
      )}

      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        <LegendDot color="var(--green-400)" label={`${snapshot.active7dCount} engajados`} />
        <LegendDot color="var(--gold-600)" label={`${snapshot.streakBrokenCount} em risco`} />
        <LegendDot color="var(--red-400)" label={`${snapshot.missingCount} sumidos`} />
      </div>

      {students.map((student) => {
        const inFollowUp = followUpStudentIds.has(student.userId)
        const meta = engagementStateMeta(student.engagementState)

        return (
          <div
            key={student.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px 12px 12px',
              borderRadius: 10,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderLeft: `4px solid ${meta.color}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  to={`/classes/${classId}/students/${student.userId}`}
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  {student.nome}
                </Link>
                <EngagementStateBadge state={student.engagementState} />
                {inFollowUp && (
                  <span style={{ fontSize: 11, color: 'var(--gold-600)' }}>Em acompanhamento</span>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {student.lastActivityAt
                  ? `Última atividade ${new Date(student.lastActivityAt).toLocaleDateString('pt-BR')}`
                  : 'Sem atividade recente'}
              </p>
            </div>
            <FollowUpButton
              active={inFollowUp}
              onMark={() => onFollowUp(student.userId, 'mark')}
              onResolve={() => onFollowUp(student.userId, 'resolve')}
            />
          </div>
        )
      })}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
        }}
      />
      {label}
    </span>
  )
}
