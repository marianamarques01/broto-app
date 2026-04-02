type Variant = 'green' | 'amber' | 'red' | 'blue' | 'gray'
type Props = { label: string; variant?: Variant }

const styles: Record<Variant, { bg: string; color: string }> = {
  green: { bg: '#e8f5e9', color: '#2e7d32' },
  amber: { bg: '#fff8e1', color: '#e65100' },
  red: { bg: '#ffebee', color: '#c62828' },
  blue: { bg: '#e3f2fd', color: '#1565c0' },
  gray: { bg: '#f5f5f5', color: '#555' },
}

export function Badge({ label, variant = 'gray' }: Props) {
  const s = styles[variant]
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      display: 'inline-block', letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  )
}
