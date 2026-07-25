import { Navigate } from 'react-router-dom'
import { useBrotoOnboardingStaff } from '@/hooks/useBrotoOnboardingStaff'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

type Props = {
  children: React.ReactNode
}

export function BrotoStaffRoute({ children }: Props) {
  const { allowed, loading } = useBrotoOnboardingStaff()

  return (
    <ProtectedRoute>
      {loading ? null : !allowed ? <Navigate to="/" replace /> : children}
    </ProtectedRoute>
  )
}
