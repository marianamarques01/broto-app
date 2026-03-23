import { type ButtonHTMLAttributes, type CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: { background: '#2e7d32', color: '#fff', border: 'none' },
  secondary: { background: 'transparent', color: '#555', border: '1px solid #ccc' },
  ghost: { background: 'transparent', color: '#666', border: 'none' },
  danger: { background: '#c62828', color: '#fff', border: 'none' },
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { fontSize: 13, padding: '6px 12px', height: 32 },
  md: { fontSize: 14, padding: '8px 16px', height: 40 },
  lg: { fontSize: 16, padding: '12px 24px', height: 48 },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  children,
  disabled,
  ...props
}: Props) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 8,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s',
    width: fullWidth ? '100%' : undefined,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  return (
    <button {...props} disabled={disabled || loading} style={baseStyle}>
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {children}
        </span>
      ) : children}
    </button>
  )
}
