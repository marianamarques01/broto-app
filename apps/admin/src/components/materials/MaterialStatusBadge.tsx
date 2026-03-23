type Props = {
  status: 'pending' | 'indexing' | 'indexed' | 'failed'
}

const config: Record<Props['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'var(--gold-500)', bg: 'var(--gold-glow)' },
  indexing: { label: 'Indexando...', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  indexed: { label: 'Indexado', color: 'var(--green-400)', bg: 'var(--green-glow)' },
  failed: { label: 'Erro', color: 'var(--red-400)', bg: 'var(--red-glow)' },
}

export function MaterialStatusBadge({ status }: Props) {
  const { label, color, bg } = config[status]

  return (
    <span style={{
      fontSize: 11,
      padding: '2px 6px',
      borderRadius: 4,
      background: bg,
      color,
      fontWeight: 500,
    }}>
      {label}
    </span>
  )
}
