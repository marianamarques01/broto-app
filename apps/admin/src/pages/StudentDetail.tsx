import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

type StudentData = {
  nome: string
  image: string | null
  streak: number
  xp: number
  nivel: number
  topicPerformance: {
    topico_value: string
    total_answered: number
    total_correct: number
    accuracy_pct: number
  }[]
}

export function StudentDetail() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const [userRes, petRes, perfRes] = await Promise.all([
        supabase.from('users').select('nome, image, streak').eq('id', studentId).single(),
        supabase.from('pets').select('xp, nivel').eq('user_id', studentId).single(),
        supabase
          .from('topic_performance')
          .select('topico_value, total_answered, total_correct, accuracy_pct')
          .eq('user_id', studentId),
      ])

      setStudent({
        nome: userRes.data?.nome ?? 'Aluno',
        image: userRes.data?.image ?? null,
        streak: userRes.data?.streak ?? 0,
        xp: petRes.data?.xp ?? 0,
        nivel: petRes.data?.nivel ?? 1,
        topicPerformance: perfRes.data ?? [],
      })
      setLoading(false)
    }

    if (studentId) load()
  }, [studentId])

  const metricCard = (label: string, value: string | number) => (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={loading ? 'Aluno' : student?.nome ?? 'Aluno'}
          backTo={`/classes/${classId}`}
        />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
          ) : student ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                {student.image ? (
                  <img
                    src={student.image}
                    alt={student.nome}
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--green-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--green-600)',
                  }}>
                    {student.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{student.nome}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Nivel {student.nivel}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                {metricCard('XP', student.xp)}
                {metricCard('Nivel', student.nivel)}
                {metricCard('Streak', `${student.streak}d`)}
                {metricCard('Questoes', student.topicPerformance.reduce((s, t) => s + t.total_answered, 0))}
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Desempenho por topico</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-deep)' }}>
                      {['Topico', 'Respondidas', 'Corretas', 'Acerto'].map(h => (
                        <th key={h} style={{
                          padding: '10px 20px',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border-default)',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {student.topicPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          Nenhum dado de desempenho ainda
                        </td>
                      </tr>
                    ) : student.topicPerformance
                      .sort((a, b) => b.total_answered - a.total_answered)
                      .map(tp => {
                        const rate = tp.total_answered > 0 ? tp.total_correct / tp.total_answered : 0
                        return (
                          <tr key={tp.topico_value} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{tp.topico_value}</td>
                            <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{tp.total_answered}</td>
                            <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{tp.total_correct}</td>
                            <td style={{ padding: '12px 20px' }}>
                              <span style={{
                                color: rate >= 0.7 ? 'var(--green-600)' : rate >= 0.4 ? 'var(--gold-600)' : 'var(--red-400)',
                                fontWeight: 500,
                              }}>
                                {Math.round(rate * 100)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Aluno nao encontrado.</p>
          )}
        </main>
      </div>
    </div>
  )
}
