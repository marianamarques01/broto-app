import type { WeakTopicSummary } from '@broto/shared'

type Props = {
  weakTopics: readonly WeakTopicSummary[]
  loading: boolean
  studentCount: number
}

export function ClassWeakTopicsPanel({ weakTopics, loading, studentCount }: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando habilidades…</p>
  }

  if (studentCount === 0) {
    return null
  }

  if (weakTopics.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
        Nenhum tópico com domínio baixo em massa ainda — dados insuficientes ou turma equilibrada.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Habilidades fracas na turma</h2>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        Tópicos com p_know médio baixo — sinal para retomar em aula.
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {weakTopics.map((topic) => (
          <li
            key={topic.topicoValue}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 14,
            }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{topic.topicoValue}</span>
            <span style={{ color: 'var(--red-400)', fontWeight: 600 }}>
              {Math.round(topic.avgPKnow * 100)}% · {topic.studentCount} alunos
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
