import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  backTo?: string
}

export function Header({ title, subtitle, action, backTo }: Props) {
  return (
    <header className="broto-admin-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {backTo && (
          <Link
            to={backTo}
            style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 20 }}
          >
            &larr;
          </Link>
        )}
        <div>
          <h2 className="broto-admin-header__title">{title}</h2>
          {subtitle && <div style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
