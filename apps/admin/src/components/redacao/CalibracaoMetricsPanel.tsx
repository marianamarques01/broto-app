import {
  REDACAO_COMPETENCIA_SHORT,
  REDACAO_COMPETENCIAS,
  REDACAO_NOTAS_VALIDAS,
  type CalibracaoMetricasCompetencia,
} from '@broto/shared'

type Props = {
  totalRevisoes: number
  porCompetencia: CalibracaoMetricasCompetencia[]
  loading: boolean
}

export function CalibracaoMetricsPanel({ totalRevisoes, porCompetencia, loading }: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', margin: 0 }}>Carregando métricas…</p>
  }

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Concordância IA × humano</h2>
      <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
        {totalRevisoes} revisão{totalRevisoes === 1 ? '' : 'ões'} concluída
        {totalRevisoes === 1 ? '' : 's'}. Meta inicial: diferença média absoluta &lt; 40 pts.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {REDACAO_COMPETENCIAS.map((comp) => {
          const metric = porCompetencia.find((m) => m.competencia === comp)
          const diff = metric?.diferenca_media_absoluta ?? 0
          const amostras = metric?.amostras ?? 0
          const acimaMeta = amostras > 0 && diff >= 40

          return (
            <div
              key={comp}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${acimaMeta ? 'rgba(251, 126, 106, 0.4)' : 'var(--border-subtle)'}`,
                background: acimaMeta ? 'rgba(251, 126, 106, 0.08)' : 'var(--bg-void)',
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Comp. {comp}</p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>
                {amostras === 0 ? '—' : `${diff} pts`}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                {REDACAO_COMPETENCIA_SHORT[comp]} · n={amostras}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export { REDACAO_NOTAS_VALIDAS }
