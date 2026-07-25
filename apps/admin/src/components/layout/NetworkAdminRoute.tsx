import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

type Props = {
  children: React.ReactNode
}

export function NetworkAdminRoute({ children }: Props) {
  const { admin, loading, isNetworkAdmin } = useAdminAuth()

  return (
    <ProtectedRoute>
      {loading ? null : !admin || !isNetworkAdmin ? <Navigate to="/" replace /> : children}
    </ProtectedRoute>
  )
}
