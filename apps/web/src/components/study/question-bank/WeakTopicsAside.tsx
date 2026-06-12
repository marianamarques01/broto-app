import { isAreaRollupTopicValue, type TopicoStat } from '@broto/shared'

export interface WeakTopicsAsideProps {
  topicos: TopicoStat[] | undefined
  loading: boolean
}

function priorityLabel(
  accuracyPct: number,
  answered: number,
): { text: string; tone: 'high' | 'mid' | 'low' } {
  if (answered < 2) return { text: 'A calibrar', tone: 'low' }
  if (accuracyPct < 45) return { text: 'Prioridade alta', tone: 'high' }
  if (accuracyPct < 65) return { text: 'Prioridade média', tone: 'mid' }
  return { text: 'Em revisão', tone: 'low' }
}

export function WeakTopicsAside({ topicos, loading }: WeakTopicsAsideProps) {
  if (loading) {
    return (
      <div className="broto-qbank-side-card">
        <h3 className="broto-qbank-side-title">Tópicos em destaque</h3>
        <div className="broto-skeleton" style={{ height: 88, borderRadius: 12 }} />
      </div>
    )
  }

  const rows = [...(topicos ?? [])]
    .filter((t) => !isAreaRollupTopicValue(t.value))
    .filter((t) => t.value !== '__broto_sem_classificacao__')
    .filter((t) => t.totalAnswered >= 1)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 6)

  if (rows.length === 0) {
    return (
      <div className="broto-qbank-side-card">
        <h3 className="broto-qbank-side-title">Tópicos em destaque</h3>
        <p className="broto-qbank-side-empty">
          Pratique mais um pouco para identificarmos o que precisa de atenção.
        </p>
      </div>
    )
  }

  return (
    <div className="broto-qbank-side-card">
      <h3 className="broto-qbank-side-title">Tópicos em destaque</h3>
      <ul className="broto-qbank-weak-list">
        {rows.map((t) => {
          const pr = priorityLabel(t.accuracyPct, t.totalAnswered)
          return (
            <li key={t.value} className="broto-qbank-weak-row">
              <span className={`broto-qbank-weak-pill broto-qbank-weak-pill--${pr.tone}`}>
                {pr.text}
              </span>
              <span className="broto-qbank-weak-name">{t.label}</span>
              <span className="broto-qbank-weak-pct">~{t.accuracyPct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
