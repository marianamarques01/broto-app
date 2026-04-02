import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Carregando...</p>
    </div>
  )

  if (!admin) return <Navigate to="/login" replace />

  return <>{children}</>
}
