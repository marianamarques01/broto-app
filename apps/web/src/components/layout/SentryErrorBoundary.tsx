import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBoundary, type FallbackRender } from '@sentry/react'
import { isSentryEnabled } from '@/lib/sentry'

const fallbackStyles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    textAlign: 'center' as const,
  },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  message: { color: '#666', margin: 0, maxWidth: 420 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' },
  button: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
  },
  link: { color: '#2e7d32', fontWeight: 500 },
}

const renderFallback: FallbackRender = ({ resetError }) => (
  <div style={fallbackStyles.root} role="alert">
    <h1 style={fallbackStyles.title}>Algo deu errado</h1>
    <p style={fallbackStyles.message}>
      Encontramos um erro inesperado. Você pode tentar de novo ou voltar ao início.
    </p>
    <div style={fallbackStyles.actions}>
      <button type="button" style={fallbackStyles.button} onClick={resetError}>
        Tentar novamente
      </button>
      <Link to="/" style={fallbackStyles.link}>
        Voltar ao início
      </Link>
    </div>
  </div>
)

type SentryErrorBoundaryProps = {
  children: ReactNode
}

export function SentryErrorBoundary({ children }: SentryErrorBoundaryProps) {
  if (!isSentryEnabled()) {
    return <>{children}</>
  }

  return <ErrorBoundary fallback={renderFallback}>{children}</ErrorBoundary>
}
