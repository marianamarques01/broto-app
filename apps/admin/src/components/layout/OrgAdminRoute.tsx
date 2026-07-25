import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

type Props = {
  children: React.ReactNode
}

export function OrgAdminRoute({ children }: Props) {
  const { admin, loading, isOrgAdmin } = useAdminAuth()

  return (
    <ProtectedRoute>
      {loading ? null : !admin || !isOrgAdmin ? <Navigate to="/" replace /> : children}
    </ProtectedRoute>
  )
}
