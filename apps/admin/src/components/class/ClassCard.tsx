import type { Class } from '@broto/shared'

type Props = {
  cls: Class
}

export function ClassCard({ cls }: Props) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      padding: '20px 24px',
      transition: 'box-shadow 0.15s',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          {cls.name}
        </h3>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 4,
          background: cls.is_active ? 'var(--green-glow)' : 'var(--bg-elevated)',
          color: cls.is_active ? 'var(--green-400)' : 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {cls.is_active ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      {cls.description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
          {cls.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 13,
          fontFamily: 'monospace',
          background: 'var(--bg-deep)',
          padding: '4px 10px',
          borderRadius: 6,
          color: 'var(--text-secondary)',
          letterSpacing: 2,
        }}>
          {cls.access_code}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(cls.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  )
}
