import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, Link } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RouteFallback } from '@/components/layout/RouteFallback'

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

const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const InstitutionsLanding = lazy(() =>
  import('@/pages/InstitutionsLanding').then((m) => ({ default: m.InstitutionsLanding })),
)
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/Signup').then((m) => ({ default: m.Signup })))
const Onboarding = lazy(() => import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding })))
const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((m) => ({ default: m.AppShell })),
)
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const QuestionBankCatalog = lazy(() =>
  import('@/pages/QuestionBankCatalog').then((m) => ({ default: m.QuestionBankCatalog })),
)
const QuestionBankQuestion = lazy(() =>
  import('@/pages/QuestionBankQuestion').then((m) => ({ default: m.QuestionBankQuestion })),
)
const StudyArea = lazy(() => import('@/pages/StudyArea').then((m) => ({ default: m.StudyArea })))
const Routine = lazy(() => import('@/pages/Routine').then((m) => ({ default: m.Routine })))
const JoinClass = lazy(() => import('@/pages/JoinClass').then((m) => ({ default: m.JoinClass })))
const BrotoPage = lazy(() => import('@/pages/BrotoPage').then((m) => ({ default: m.BrotoPage })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const MockExamConfig = lazy(() =>
  import('@/pages/MockExamConfig').then((m) => ({ default: m.MockExamConfig })),
)
const MockExamHistory = lazy(() =>
  import('@/pages/MockExamHistory').then((m) => ({ default: m.MockExamHistory })),
)
const MockExamPlay = lazy(() =>
  import('@/pages/MockExamPlay').then((m) => ({ default: m.MockExamPlay })),
)
const MockExamResult = lazy(() =>
  import('@/pages/MockExamResult').then((m) => ({ default: m.MockExamResult })),
)

export const router = createBrowserRouter([
  { path: '/inicio', element: SuspenseWrapped(<Landing />) },
  { path: '/instituicoes', element: SuspenseWrapped(<InstitutionsLanding />) },
  { path: '/landing-page', element: SuspenseWrapped(<LandingPage />) },
  { path: '/login', element: SuspenseWrapped(<Login />) },
  { path: '/signup', element: SuspenseWrapped(<Signup />) },
  { path: '/onboarding', element: SuspenseWrapped(<Onboarding />) },
  {
    element: SuspenseWrapped(
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>,
    ),
    children: [
      { path: '/', element: SuspenseWrapped(<Home />) },
      { path: '/study/questions', element: <Navigate to="/study/linguagens" replace /> },
      { path: '/study/mock-exam', element: SuspenseWrapped(<MockExamConfig />) },
      { path: '/study/mock-exam/history', element: SuspenseWrapped(<MockExamHistory />) },
      { path: '/study/mock-exam/play/:sessionId', element: SuspenseWrapped(<MockExamPlay />) },
      { path: '/study/mock-exam/result', element: SuspenseWrapped(<MockExamResult />) },
      {
        path: '/study/:areaKey/banco/:questionId',
        element: SuspenseWrapped(<QuestionBankQuestion />),
      },
      {
        path: '/study/:areaKey/banco',
        element: SuspenseWrapped(<QuestionBankCatalog />),
      },
      { path: '/study/:areaKey', element: SuspenseWrapped(<StudyArea />) },
      { path: '/study', element: SuspenseWrapped(<StudyArea />) },
      { path: '/study-area', element: <Navigate to="/study" replace /> },
      { path: '/progress', element: <Navigate to="/" replace /> },
      { path: '/routine', element: SuspenseWrapped(<Routine />) },
      { path: '/join-class', element: SuspenseWrapped(<JoinClass />) },
      { path: '/broto', element: SuspenseWrapped(<BrotoPage />) },
      { path: '/settings', element: SuspenseWrapped(<Settings />) },
      { path: '/profile', element: SuspenseWrapped(<Profile />) },
    ],
  },
  { path: '*', element: <NotFound /> },
])

function SuspenseWrapped(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>
}
