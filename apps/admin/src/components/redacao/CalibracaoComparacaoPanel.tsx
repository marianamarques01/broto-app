import { REDACAO_COMPETENCIA_SHORT, type CalibracaoComparacaoCompetencia } from '@broto/shared'

type Props = {
  comparacao: CalibracaoComparacaoCompetencia[]
}

export function CalibracaoComparacaoPanel({ comparacao }: Props) {
  return (
    <section
      style={{
        marginTop: 24,
        background: 'rgba(46, 204, 142, 0.08)',
        border: '1px solid rgba(46, 204, 142, 0.3)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Comparação IA × humano</h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px 12px 8px 0' }}>Comp.</th>
              <th style={{ padding: '8px 12px' }}>IA</th>
              <th style={{ padding: '8px 12px' }}>Humano</th>
              <th style={{ padding: '8px 12px' }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {comparacao.map((row) => {
              const destaque = row.diferenca_absoluta >= 40
              return (
                <tr
                  key={row.competencia}
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    background: destaque ? 'rgba(251, 126, 106, 0.06)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 12px 10px 0' }}>
                    <strong>{row.competencia}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                      {REDACAO_COMPETENCIA_SHORT[row.competencia]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{row.nota_ia}</td>
                  <td style={{ padding: '10px 12px' }}>{row.nota_humana}</td>
                  <td style={{ padding: '10px 12px', fontWeight: destaque ? 700 : 400 }}>
                    {row.diferenca > 0 ? '+' : ''}
                    {row.diferenca}
                    {destaque ? ' ⚠' : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
