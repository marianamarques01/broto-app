import { Link } from 'react-router-dom'

export interface PerformanceDonutCardProps {
  /** 0–100 accuracy */
  accuracyPct: number
  totalAnswered: number
  totalInArea: number
  loading: boolean
  correct: number
  errors: number
  pendingApprox: number
}

export function PerformanceDonutCard({
  accuracyPct,
  totalAnswered,
  totalInArea,
  loading,
  correct,
  errors,
  pendingApprox,
}: PerformanceDonutCardProps) {
  if (loading) {
    return (
      <div className="broto-qbank-donut-card">
        <h3 className="broto-qbank-side-title">Desempenho na área</h3>
        <div className="broto-skeleton" style={{ height: 160, borderRadius: 20, margin: '0 auto' }} />
      </div>
    )
  }

  const hasData = totalInArea > 0
  const acc = Math.max(0, Math.min(100, accuracyPct))
  const base = Math.max(1, totalInArea)
  const shareOk = (correct / base) * 100
  const shareErr = (errors / base) * 100
  const sharePend = Math.max(0, 100 - shareOk - shareErr)

  const grad = hasData
    ? `conic-gradient(
        var(--broto-qbank-t4) 0% ${shareOk}%,
        var(--broto-qbank-coral) ${shareOk}% ${shareOk + shareErr}%,
        var(--broto-qbank-bg-ch) ${shareOk + shareErr}% 100%
      )`
    : `conic-gradient(var(--broto-qbank-bg-ch) 0% 100%)`

  return (
    <div className="broto-qbank-donut-card">
      <h3 className="broto-qbank-side-title">Desempenho na área</h3>
      <div className="broto-qbank-donut-wrap">
        <div className="broto-qbank-donut" style={{ background: grad }}>
          <div className="broto-qbank-donut__hole" />
          <div className="broto-qbank-donut__label">
            <span className="broto-qbank-donut__pct">
              {hasData && totalAnswered > 0 ? `${Math.round(acc)}%` : '—'}
            </span>
            <span className="broto-qbank-donut__sub">acerto</span>
          </div>
        </div>
      </div>
      <ul className="broto-qbank-donut-legend">
        <li>
          <span className="broto-qbank-donut-dot" data-tone="ok" />
          Acertos
          {hasData ? <span className="broto-qbank-donut-legend-pct">{Math.round(shareOk)}%</span> : null}
        </li>
        <li>
          <span className="broto-qbank-donut-dot" data-tone="bad" />
          Erros
          {hasData ? <span className="broto-qbank-donut-legend-pct">{Math.round(shareErr)}%</span> : null}
        </li>
        <li>
          <span className="broto-qbank-donut-dot" data-tone="pend" />
          Pendentes
          <span className="broto-qbank-donut-legend-pct">
            {hasData ? `${Math.round(sharePend)}%` : '—'}
          </span>
        </li>
      </ul>
      <p className="broto-qbank-donut-meta">
        ~{pendingApprox.toLocaleString('pt-BR')} questões ainda sem fazer (aprox.)
      </p>
      <Link className="broto-qbank-donut-link" to="/progress">
        Ver análise completa
      </Link>
    </div>
  )
}
