import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Onboarding } from '@/pages/Onboarding'
import { Home } from '@/pages/Home'
import { Study } from '@/pages/Study'
import { StudyArea } from '@/pages/StudyArea'
import { Progress } from '@/pages/Progress'
import { Routine } from '@/pages/Routine'
import { JoinClass } from '@/pages/JoinClass'
import { BrotoPage } from '@/pages/BrotoPage'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>404</h1>
      <p style={{ color: '#666', margin: 0 }}>Pagina nao encontrada</p>
      <Link to="/" style={{ color: '#2e7d32', fontWeight: 500 }}>
        Voltar ao inicio
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/study/questions', element: <Study /> },
      { path: '/study', element: <StudyArea /> },
      { path: '/study-area', element: <Navigate to="/study" replace /> },
      { path: '/progress', element: <Progress /> },
      { path: '/routine', element: <Routine /> },
      { path: '/join-class', element: <JoinClass /> },
      { path: '/broto', element: <BrotoPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
