import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ClassDetail } from '@/pages/ClassDetail'
import { CreateClass } from '@/pages/CreateClass'
import { StudentDetail } from '@/pages/StudentDetail'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-void)', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>404</h1>
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pagina nao encontrada</p>
      <Link to="/" style={{ color: 'var(--green-400)', fontWeight: 500 }}>Voltar ao inicio</Link>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: '/classes/new',
    element: <ProtectedRoute><CreateClass /></ProtectedRoute>,
  },
  {
    path: '/classes/:classId',
    element: <ProtectedRoute><ClassDetail /></ProtectedRoute>,
  },
  {
    path: '/classes/:classId/students/:studentId',
    element: <ProtectedRoute><StudentDetail /></ProtectedRoute>,
  },
  { path: '*', element: <NotFound /> },
])
