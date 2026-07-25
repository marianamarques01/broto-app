import type { OrgEngagementSnapshot } from '@broto/shared'
import { ENGAGEMENT_STATE_LABELS } from '@broto/shared'
import './org-report-print.css'

type Props = {
  snapshot: OrgEngagementSnapshot
  orgName: string
  generatedAt: string
}

export function OrgReportPrint({ snapshot, orgName, generatedAt }: Props) {
  const dateLabel = new Date(generatedAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div id="org-report-print" className="org-report-print" aria-hidden>
      <header className="org-report-print__header">
        <div>
          <p className="org-report-print__brand">broto</p>
          <h1>Relatório de engajamento</h1>
          <p className="org-report-print__org">{orgName}</p>
        </div>
        <p className="org-report-print__meta">Gerado em {dateLabel}</p>
      </header>

      <section className="org-report-print__summary">
        <div className="org-report-print__metric">
          <span>Turmas</span>
          <strong>{snapshot.totalClasses}</strong>
        </div>
        <div className="org-report-print__metric">
          <span>Alunos</span>
          <strong>{snapshot.totalStudents}</strong>
        </div>
        <div className="org-report-print__metric">
          <span>Ativos 7d</span>
          <strong>{Math.round(snapshot.active7dPct)}%</strong>
        </div>
        <div className="org-report-print__metric">
          <span>Índice de risco</span>
          <strong>{Math.round(snapshot.abandonmentRiskIndex)}%</strong>
        </div>
      </section>

      <section>
        <h2>Ranking de turmas — % ativos (7 dias)</h2>
        <table className="org-report-print__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Turma</th>
              <th>Alunos</th>
              <th>Ativos 7d</th>
              <th>Sumidos</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.classRankings.map((row, index) => (
              <tr key={row.classId}>
                <td>{index + 1}</td>
                <td>{row.className}</td>
                <td>{row.totalStudents}</td>
                <td>{Math.round(row.active7dPct)}%</td>
                <td>{row.missingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {snapshot.atRiskAlerts.length > 0 && (
        <section>
          <h2>Alertas prioritários</h2>
          <table className="org-report-print__table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Estado</th>
                <th>Severidade</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.atRiskAlerts.slice(0, 15).map((alert) => (
                <tr key={`${alert.classId}-${alert.userId}`}>
                  <td>{alert.nome}</td>
                  <td>{alert.className}</td>
                  <td>{ENGAGEMENT_STATE_LABELS[alert.engagementState]}</td>
                  <td>{alert.severity >= 100 ? 'Crítico' : 'Atenção'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="org-report-print__footer">
        <p>Documento gerado pelo painel Broto — uso interno da instituição.</p>
      </footer>
    </div>
  )
}

export function printOrgReport() {
  window.print()
}
