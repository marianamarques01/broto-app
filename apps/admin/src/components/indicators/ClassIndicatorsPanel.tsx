import { Link } from 'react-router-dom'
import type { ClassIndicatorsData } from '@/hooks/useClassIndicators'

type Props = {
  indicators: ClassIndicatorsData | null
  loading: boolean
  classId: string
}

export function ClassIndicatorsPanel({ indicators, loading, classId }: Props) {
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Carregando indicadores...</p>
  if (!indicators) return <p style={{ color: 'var(--text-muted)' }}>Sem dados ainda.</p>

  const metricCard = (label: string, value: string | number) => (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {metricCard('Alunos', indicators.total_students)}
        {metricCard('Ativos (7 dias)', indicators.active_students)}
        {metricCard('Acerto medio', `${Math.round(indicators.avg_accuracy_rate * 100)}%`)}
        {metricCard('Streak medio', `${Math.round(indicators.avg_streak)}d`)}
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Alunos</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-deep)' }}>
              {['Aluno', 'Questoes', 'Acerto', 'Streak', 'XP', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 20px',
                    textAlign: 'left',
                    fontWeight: 500,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  Nenhum aluno matriculado ainda
                </td>
              </tr>
            ) : (
              indicators.students.map((student) => (
                <tr
                  key={student.student_id}
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {student.image ? (
                        <img
                          src={student.image}
                          alt={student.nome}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--green-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--green-600)',
                          }}
                        >
                          {student.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ color: 'var(--text-primary)' }}>{student.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {student.total_questions}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span
                      style={{
                        color:
                          student.accuracy_rate >= 0.7
                            ? 'var(--green-600)'
                            : student.accuracy_rate >= 0.4
                              ? 'var(--gold-600)'
                              : 'var(--red-400)',
                        fontWeight: 500,
                      }}
                    >
                      {Math.round(student.accuracy_rate * 100)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {student.streak}d
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {student.xp}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Link
                      to={`/classes/${classId}/students/${student.student_id}`}
                      style={{ color: 'var(--green-600)', fontSize: 13, textDecoration: 'none' }}
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
