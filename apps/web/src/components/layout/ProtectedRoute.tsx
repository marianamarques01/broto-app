import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-void)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>{'\u{1F331}'}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    )

  if (!user) return <Navigate to="/login" replace />

  if (!user.onboardingDone) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
