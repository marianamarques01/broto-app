export interface ProgressKpiItem {
  id: string
  label: string
  value: string
  hint?: string
  tone?: string
}

interface ProgressKpiStripProps {
  items: ProgressKpiItem[]
  loading?: boolean
  /** Quando true, renderiza um `div` (use quando o strip estiver dentro de uma `<section>` pai). */
  asDiv?: boolean
}

export function ProgressKpiStrip({ items, loading, asDiv }: ProgressKpiStripProps) {
  const Tag = asDiv ? 'div' : 'section'
  return (
    <Tag
      id={asDiv ? undefined : 'progress-kpis'}
      className={`broto-progress-kpi-strip${loading ? ' broto-progress-kpi-strip--loading' : ''}`}
      aria-label="Resumo de desempenho"
    >
      {items.map((item) => (
        <div key={item.id} className="broto-progress-kpi-tile">
          <span className="broto-progress-kpi-tile__label">{item.label}</span>
          <span
            className="broto-progress-kpi-tile__value"
            style={{ color: item.tone ?? 'var(--text-primary)' }}
          >
            {loading ? '—' : item.value}
          </span>
          {item.hint ? (
            <span className="broto-progress-kpi-tile__hint">{loading ? '' : item.hint}</span>
          ) : null}
        </div>
      ))}
    </Tag>
  )
}
