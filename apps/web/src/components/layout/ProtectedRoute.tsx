import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BrotoLoadingSplash } from '@/components/splash/BrotoLoadingSplash'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <BrotoLoadingSplash />

  if (!user) return <Navigate to="/login" replace />

  if (!user.onboardingDone) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
