import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClassAtRiskData } from '@broto/shared'

type Props = {
  atRisk: ClassAtRiskData
  loading: boolean
  studentCount: number
  classId: string
}

export function ClassAtRiskAlerts({ atRisk, loading, studentCount, classId }: Props) {
  const [showInactive, setShowInactive] = useState(false)
  const [showStruggling, setShowStruggling] = useState(false)

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando alertas…</p>
  }

  if (studentCount === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Sem alunos matriculados — alertas aparecerão quando a turma tiver atividade.
      </p>
    )
  }

  const { inactive, struggling } = atRisk
  const hasAlerts = inactive.length > 0 || struggling.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Atenção</h2>

      {inactive.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(245, 200, 66, 0.08)',
            border: '1px solid rgba(245, 200, 66, 0.35)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--gold-600)' }}>
            {inactive.length} aluno{inactive.length > 1 ? 's' : ''} sem atividade há 7+ dias
          </p>
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            style={{
              marginTop: 6,
              padding: 0,
              border: 'none',
              background: 'none',
              fontSize: 12,
              color: 'var(--gold-600)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {showInactive ? 'Ocultar alunos' : 'Ver alunos'}
          </button>
          {showInactive && (
            <ul
              style={{
                margin: '10px 0 0',
                paddingLeft: 18,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {inactive.map((s) => (
                <li key={s.userId} style={{ marginBottom: 4 }}>
                  <Link
                    to={`/classes/${classId}/students/${s.userId}`}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  >
                    {s.nome}
                  </Link>
                  {s.streak > 0 ? ` · streak ${s.streak}d` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {struggling.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--red-400)' }}>
            {struggling.length} aluno{struggling.length > 1 ? 's' : ''} com domínio baixo em 3+
            tópicos
          </p>
          <button
            type="button"
            onClick={() => setShowStruggling((v) => !v)}
            style={{
              marginTop: 6,
              padding: 0,
              border: 'none',
              background: 'none',
              fontSize: 12,
              color: 'var(--red-400)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {showStruggling ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
          {showStruggling && (
            <ul
              style={{
                margin: '10px 0 0',
                paddingLeft: 18,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {struggling.map((s) => (
                <li key={s.userId} style={{ marginBottom: 4 }}>
                  <Link
                    to={`/classes/${classId}/students/${s.userId}`}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  >
                    {s.nome}
                  </Link>
                  {` · ${s.weakTopicCount} tópicos · mín. ${Math.round(s.lowestPKnow * 100)}%`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hasAlerts && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          Nenhum alerta no momento. Turma engajada!
        </p>
      )}
    </div>
  )
}
