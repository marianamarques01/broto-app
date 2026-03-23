# Prompt Fase 2 — Web do Aluno (apps/web/)

## Pré-requisitos

As **Fases 0 e 1** devem estar concluídas:
- Monorepo Turborepo com `packages/shared` e `packages/ui`
- Schema novo (organizations, classes, enrollments, materials)
- App mobile atualizado para o novo schema
- Admin dashboard funcional

---

## Contexto

O `apps/web/` é a versão **desktop do app do aluno** — mesma experiência do mobile, adaptada para telas grandes. Compartilha:
- `packages/shared` — todos os tipos
- `packages/ui` — componentes base (Button, Input, Card, Badge)
- O mesmo projeto Supabase e edge functions do mobile

**Princípio central:** o web não reimplementa lógica — consome as mesmas edge functions do mobile. O que muda é apenas a apresentação (layout de duas colunas, sidebar, teclado/mouse em vez de touch).

---

## Estrutura a criar

```
apps/web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── lib/
    │   ├── supabase.ts
    │   └── api-client.ts          ← mesmo padrão do mobile
    ├── hooks/                     ← reusar lógica do mobile onde possível
    │   ├── useAuth.ts
    │   ├── useClass.ts
    │   ├── usePet.ts
    │   ├── useProgress.ts
    │   ├── useQuestions.ts
    │   ├── useRoutine.ts
    │   └── useJobPolling.ts
    ├── contexts/
    │   ├── AuthContext.tsx
    │   └── ClassContext.tsx
    ├── pages/
    │   ├── Login.tsx
    │   ├── Signup.tsx
    │   ├── Onboarding.tsx
    │   ├── Home.tsx
    │   ├── Study.tsx              ← questões + filtros
    │   ├── Progress.tsx
    │   ├── Routine.tsx
    │   └── JoinClass.tsx          ← entrar em turma via código
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx       ← sidebar + main area
    │   │   ├── Sidebar.tsx
    │   │   ├── TopBar.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── pet/
    │   │   ├── PetCard.tsx
    │   │   └── XPBar.tsx
    │   ├── questions/
    │   │   ├── QuestionPlayer.tsx
    │   │   ├── AreaSelector.tsx
    │   │   └── FilterPanel.tsx
    │   ├── progress/
    │   │   ├── AreaBars.tsx
    │   │   └── TopicInsights.tsx
    │   ├── routine/
    │   │   ├── WeekStrip.tsx
    │   │   └── DayCard.tsx
    │   └── broto/
    │       └── BrotoChat.tsx      ← chat com o Broto (NotebookLM)
    └── router.tsx
```

---

## Parte 1 — Setup

### `package.json`
```json
{
  "name": "@broto/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@broto/shared": "*",
    "@broto/ui": "*",
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### `.env.example`
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## Parte 2 — packages/ui (popular agora)

O `packages/ui` foi criado vazio na Fase 0. Populá-lo agora com os componentes base usados por `apps/web` e `apps/admin`.

```
packages/ui/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    ├── Badge.tsx
    └── Spinner.tsx
```

### `packages/ui/package.json`
```json
{
  "name": "@broto/ui",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### `packages/ui/src/Button.tsx`
```typescript
import { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:   'bg-green-700 text-white hover:bg-green-800 active:scale-[0.98]',
  secondary: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.98]',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98]',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2 h-10',
  lg: 'text-base px-6 py-3 h-12',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}
```

### `packages/ui/src/Card.tsx`
```typescript
import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export function Card({ padding = 'md', hoverable = false, className, children, ...props }: Props) {
  return (
    <div
      {...props}
      className={clsx(
        'bg-white rounded-xl border border-gray-200',
        paddings[padding],
        hoverable && 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all',
        className
      )}
    >
      {children}
    </div>
  )
}
```

### `packages/ui/src/Badge.tsx`
```typescript
type Variant = 'green' | 'amber' | 'red' | 'blue' | 'gray'
type Props = { label: string; variant?: Variant }

const styles: Record<Variant, { bg: string; color: string }> = {
  green: { bg: '#e8f5e9', color: '#2e7d32' },
  amber: { bg: '#fff8e1', color: '#e65100' },
  red:   { bg: '#ffebee', color: '#c62828' },
  blue:  { bg: '#e3f2fd', color: '#1565c0' },
  gray:  { bg: '#f5f5f5', color: '#555' },
}

export function Badge({ label, variant = 'gray' }: Props) {
  const s = styles[variant]
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      display: 'inline-block', letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  )
}
```

### `packages/ui/src/Spinner.tsx`
```typescript
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
```

### `packages/ui/src/index.ts`
```typescript
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { Spinner } from './Spinner'
```

---

## Parte 3 — Auth e contextos

### `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Student } from '@broto/shared'

type AuthContextType = {
  user: Student | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) { setUser(null); setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(data ?? null)
      setLoading(false)
    })
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha inválidos' }
    return { error: null }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) return { error: 'Erro ao criar conta' }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### `src/contexts/ClassContext.tsx`
Idêntico ao criado na Fase 0 para o mobile — copiar de `apps/mobile/src/contexts/ClassContext.tsx` e adaptar imports para usar `@/lib/supabase` do web.

---

## Parte 4 — Layout principal

### `src/components/layout/AppShell.tsx`
```typescript
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type Props = {
  children: React.ReactNode
  title: string
}

export function AppShell({ children, title }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f7f8f9', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={title} />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 36px',
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

### `src/components/layout/Sidebar.tsx`
```typescript
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/',         label: 'Início',    icon: '🌱' },
  { to: '/study',    label: 'Estudar',   icon: '📚' },
  { to: '/progress', label: 'Progresso', icon: '📊' },
  { to: '/routine',  label: 'Rotina',    icon: '📅' },
  { to: '/broto',    label: 'Broto',     icon: '💬' },
]

export function Sidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav style={{
      width: 220,
      background: '#fff',
      borderRight: '0.5px solid #e8e8e8',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '0.5px solid #f0f0f0', marginBottom: 12 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>🌿 Broto</span>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#2e7d32' : '#555',
              background: isActive ? '#f0f7f0' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '16px 20px', borderTop: '0.5px solid #f0f0f0' }}>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 2px' }}>
          {user?.full_name ?? 'Aluno'}
        </p>
        <button
          onClick={handleSignOut}
          style={{ fontSize: 12, color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
```

---

## Parte 5 — Roteamento

### `src/router.tsx`
```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Login }      from '@/pages/Login'
import { Signup }     from '@/pages/Signup'
import { Onboarding } from '@/pages/Onboarding'
import { JoinClass }  from '@/pages/JoinClass'
import { Home }       from '@/pages/Home'
import { Study }      from '@/pages/Study'
import { Progress }   from '@/pages/Progress'
import { Routine }    from '@/pages/Routine'
import { BrotoPage }  from '@/pages/BrotoPage'

export const router = createBrowserRouter([
  { path: '/login',      element: <Login /> },
  { path: '/signup',     element: <Signup /> },
  { path: '/onboarding', element: <ProtectedRoute requiresOnboarding={false}><Onboarding /></ProtectedRoute> },
  { path: '/join',       element: <ProtectedRoute><JoinClass /></ProtectedRoute> },
  { path: '/',           element: <ProtectedRoute><Home /></ProtectedRoute> },
  { path: '/study',      element: <ProtectedRoute><Study /></ProtectedRoute> },
  { path: '/progress',   element: <ProtectedRoute><Progress /></ProtectedRoute> },
  { path: '/routine',    element: <ProtectedRoute><Routine /></ProtectedRoute> },
  { path: '/broto',      element: <ProtectedRoute><BrotoPage /></ProtectedRoute> },
  { path: '*',           element: <Navigate to="/" replace /> },
])
```

### `src/components/layout/ProtectedRoute.tsx`
```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@broto/ui'

type Props = {
  children: React.ReactNode
  requiresOnboarding?: boolean   // default true
}

export function ProtectedRoute({ children, requiresOnboarding = true }: Props) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size={32} />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (requiresOnboarding && !user.onboarding_done) return <Navigate to="/onboarding" replace />

  if (requiresOnboarding && !user.current_class_id) return <Navigate to="/join" replace />

  return <>{children}</>
}
```

---

## Parte 6 — Páginas principais

### `src/pages/JoinClass.tsx`
```typescript
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Card } from '@broto/ui'
import { normalizeClassCode } from '@broto/shared'

export function JoinClass() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('class-join', {
      body: { access_code: normalizeClassCode(code) }
    })

    setLoading(false)
    if (fnError || data?.error) {
      setError(data?.error ?? 'Código inválido ou turma não encontrada')
      return
    }

    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f7f8f9',
    }}>
      <Card style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>🌿</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Entrar em uma turma</h1>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
            Peça o código para seu professor ou escola
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: BRT042"
            maxLength={6}
            style={{
              width: '100%', padding: '14px',
              textAlign: 'center', fontSize: 24, fontWeight: 600,
              letterSpacing: 8,
              border: '0.5px solid #ccc', borderRadius: 10,
              boxSizing: 'border-box',
            }}
          />

          {error && <p style={{ color: '#c62828', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

          <Button type="submit" loading={loading} fullWidth>
            Entrar
          </Button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', margin: 0 }}>
            Preparando para o ENEM?{' '}
            <button
              type="button"
              onClick={async () => {
                setLoading(true)
                await supabase.functions.invoke('class-join', { body: { access_code: 'ENEM26' } })
                setLoading(false)
                navigate('/')
              }}
              style={{ color: '#2e7d32', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Entrar na turma ENEM gratuita
            </button>
          </p>
        </form>
      </Card>
    </div>
  )
}
```

### `src/pages/Home.tsx`
```typescript
import { AppShell } from '@/components/layout/AppShell'
import { PetCard } from '@/components/pet/PetCard'
import { useAuth } from '@/contexts/AuthContext'
import { useClass } from '@/hooks/useClass'
import { usePet } from '@/hooks/usePet'
import { useProgress } from '@/hooks/useProgress'

export function Home() {
  const { user } = useAuth()
  const { currentClass } = useClass()
  const { pet } = usePet()
  const { progress } = useProgress()

  const TIPS = [
    'Estudar um pouco todo dia é mais eficiente do que muito de uma vez.',
    'Revise os tópicos errados antes de avançar para novos.',
    'Pausas curtas de 5 minutos a cada 25 minutos melhoram a retenção.',
    'Ensinar um conteúdo para alguém é a melhor forma de fixar.',
    'Simulados completos ajudam a treinar o foco e a gestão do tempo.',
  ]
  const todayTip = TIPS[new Date().getDay() % TIPS.length]

  return (
    <AppShell title="Início">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Coluna esquerda — Pet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PetCard pet={pet} />

          {/* Dica do dia */}
          <div style={{
            background: '#fff', border: '0.5px solid #e0e0e0',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 500 }}>
              💡 Dica do Broto
            </p>
            <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.6 }}>
              {todayTip}
            </p>
          </div>
        </div>

        {/* Coluna direita — Stats e missões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Sequência', value: `${progress?.streak ?? 0}d`, icon: '🔥' },
              { label: 'Hoje',      value: `${progress?.today_questions ?? 0} questões`, icon: '✅' },
              { label: 'Acerto',   value: `${Math.round((progress?.accuracy_rate ?? 0) * 100)}%`, icon: '🎯' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', border: '0.5px solid #e0e0e0',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{stat.icon}</span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px', color: '#1a1a1a' }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Turma atual */}
          {currentClass && (
            <div style={{
              background: '#f0f7f0', border: '0.5px solid #a5d6a7',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>🏫</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#2e7d32', margin: 0 }}>{currentClass.name}</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Turma ativa</p>
              </div>
            </div>
          )}

          {/* Missões do dia */}
          <div style={{ background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #f0f0f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Missões de hoje</h3>
            </div>
            {[
              { label: 'Responder 3 questões', xp: 30, done: (progress?.today_questions ?? 0) >= 3 },
              { label: 'Acertar 2 seguidas',   xp: 20, done: false },
              { label: 'Revisar 1 flashcard',  xp: 10, done: false },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < 2 ? '0.5px solid #f5f5f5' : 'none',
                opacity: m.done ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: m.done ? '#2e7d32' : '#eee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff', flexShrink: 0,
                  }}>
                    {m.done ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 14, color: '#333', textDecoration: m.done ? 'line-through' : 'none' }}>
                    {m.label}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 500 }}>+{m.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

### `src/pages/Study.tsx`
```typescript
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AreaSelector } from '@/components/questions/AreaSelector'
import { FilterPanel } from '@/components/questions/FilterPanel'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'

type StudyStep = 'area' | 'filters' | 'playing'

export function Study() {
  const [step, setStep] = useState<StudyStep>('area')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [filters, setFilters] = useState({ year: '', topic: '', lang: '' })

  return (
    <AppShell title="Estudar">
      {step === 'area' && (
        <AreaSelector
          onSelect={area => {
            setSelectedArea(area)
            setStep('filters')
          }}
        />
      )}

      {step === 'filters' && selectedArea && (
        <div style={{ maxWidth: 640 }}>
          <button
            onClick={() => setStep('area')}
            style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}
          >
            ← Voltar
          </button>
          <FilterPanel
            area={selectedArea}
            filters={filters}
            onChange={setFilters}
            onStart={() => setStep('playing')}
          />
        </div>
      )}

      {step === 'playing' && selectedArea && (
        <div style={{ maxWidth: 760 }}>
          <button
            onClick={() => setStep('filters')}
            style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}
          >
            ← Voltar
          </button>
          <QuestionPlayer
            area={selectedArea}
            filters={filters}
            onFinish={() => setStep('area')}
          />
        </div>
      )}
    </AppShell>
  )
}
```

### `src/pages/Progress.tsx`
```typescript
import { AppShell } from '@/components/layout/AppShell'
import { AreaBars } from '@/components/progress/AreaBars'
import { TopicInsights } from '@/components/progress/TopicInsights'
import { useProgress } from '@/hooks/useProgress'

export function Progress() {
  const { progress, loading } = useProgress()

  return (
    <AppShell title="Progresso">
      {loading ? (
        <p style={{ color: '#888' }}>Carregando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Total respondidas', value: progress?.total_questions ?? 0 },
                { label: 'Acertos',           value: progress?.correct_answers ?? 0 },
                { label: 'Taxa de acerto',    value: `${Math.round((progress?.accuracy_rate ?? 0) * 100)}%` },
              ].map(m => (
                <div key={m.label} style={{
                  background: '#fff', border: '0.5px solid #e0e0e0',
                  borderRadius: 12, padding: '16px 20px',
                }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>{m.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>{m.value}</p>
                </div>
              ))}
            </div>

            <AreaBars progress={progress} />
          </div>

          <TopicInsights progress={progress} />
        </div>
      )}
    </AppShell>
  )
}
```

### `src/pages/BrotoPage.tsx`
```typescript
import { AppShell } from '@/components/layout/AppShell'
import { BrotoChat } from '@/components/broto/BrotoChat'

export function BrotoPage() {
  return (
    <AppShell title="Conversar com o Broto">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            O Broto conhece todo o material da sua turma. Pergunte sobre qualquer conteúdo,
            peça explicações ou teste seus conhecimentos.
          </p>
        </div>
        <BrotoChat />
      </div>
    </AppShell>
  )
}
```

---

## Parte 7 — Componente BrotoChat

### `src/components/broto/BrotoChat.tsx`
```typescript
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@broto/ui'

type Message = {
  role: 'user' | 'broto'
  content: string
  timestamp: Date
}

export function BrotoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'broto',
      content: 'Oi! Sou o Broto 🌱 Pergunte sobre qualquer conteúdo dos seus materiais de estudo. Estou aqui para ajudar!',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const question = input.trim()
    if (!question || loading) return

    const userMsg: Message = { role: 'user', content: question, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('broto-ask', {
        body: { question }
      })

      const answer = (!error && data?.answer)
        ? data.answer
        : 'Não consegui acessar os materiais agora. Tente novamente em alguns instantes.'

      setMessages(prev => [...prev, {
        role: 'broto',
        content: answer,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'broto',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e0e0e0',
      borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      height: 560,
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 10, alignItems: 'flex-end',
          }}>
            {msg.role === 'broto' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#e8f5e9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>
                🌱
              </div>
            )}
            <div style={{
              maxWidth: '72%',
              background: msg.role === 'user' ? '#2e7d32' : '#f5f5f5',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '12px 16px',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#e8f5e9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
            }}>🌱</div>
            <div style={{
              background: '#f5f5f5', borderRadius: '16px 16px 16px 4px',
              padding: '12px 16px',
            }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#aaa',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </span>
              <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '0.5px solid #e8e8e8',
        padding: '16px 20px',
        display: 'flex', gap: 12, alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo ao Broto... (Enter para enviar)"
          rows={1}
          disabled={loading}
          style={{
            flex: 1, resize: 'none', border: '0.5px solid #ddd',
            borderRadius: 10, padding: '10px 14px', fontSize: 14,
            fontFamily: 'inherit', outline: 'none',
            lineHeight: 1.5,
          }}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="md">
          Enviar
        </Button>
      </div>
    </div>
  )
}
```

---

## Parte 8 — Rotina com notebooklm-py

### `src/pages/Routine.tsx`
```typescript
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useRoutine } from '@/hooks/useRoutine'
import { WeekStrip } from '@/components/routine/WeekStrip'
import { DayCard } from '@/components/routine/DayCard'
import { Button, Spinner } from '@broto/ui'
import { supabase } from '@/lib/supabase'
import { useJobPolling } from '@/hooks/useJobPolling'

export function Routine() {
  const { routine, loading: routineLoading } = useRoutine()
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)

  const { status: jobStatus, data: jobData } = useJobPolling<{ markdown: string }>(
    generatingJobId,
    `${import.meta.env.VITE_NOTEBOOKLM_SERVICE_URL}/routine/status`
  )

  async function generateRoutine() {
    const { data, error } = await supabase.functions.invoke('routine-generate', {
      body: {}
    })
    if (!error && data?.job_id) setGeneratingJobId(data.job_id)
  }

  const isGenerating = generatingJobId !== null && jobStatus === 'pending'

  return (
    <AppShell title="Rotina">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          <WeekStrip selectedDay={selectedDay} onSelect={setSelectedDay} />
          <div style={{ marginTop: 20 }}>
            {routineLoading ? <Spinner /> : <DayCard routine={routine} day={selectedDay} />}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: '#fff', border: '0.5px solid #e0e0e0',
            borderRadius: 12, padding: '20px',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
              Rotina personalizada com IA
            </h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '0 0 16px' }}>
              O Broto analisa seu desempenho e cria um plano de estudos personalizado com base nos seus pontos fracos.
            </p>

            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#2e7d32', fontSize: 13 }}>
                <Spinner size={16} />
                O Broto está pensando...
              </div>
            )}

            {jobStatus === 'completed' && (
              <div style={{
                background: '#f0f7f0', border: '0.5px solid #a5d6a7',
                borderRadius: 8, padding: '12px', marginBottom: 16,
                fontSize: 13, color: '#2e7d32',
              }}>
                ✓ Rotina gerada! Atualize a página para ver.
              </div>
            )}

            {jobStatus === 'failed' && (
              <div style={{
                background: '#ffebee', border: '0.5px solid #ef9a9a',
                borderRadius: 8, padding: '12px', marginBottom: 16,
                fontSize: 13, color: '#c62828',
              }}>
                Erro ao gerar rotina. Tente novamente.
              </div>
            )}

            <Button
              onClick={generateRoutine}
              disabled={isGenerating}
              fullWidth
            >
              {isGenerating ? 'Gerando...' : 'Gerar nova rotina com IA'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

---

## Parte 9 — Deploy

O `apps/web` é um SPA estático — pode ser deployado no **Vercel**, **Netlify** ou **Cloudflare Pages** gratuitamente.

### `vercel.json` (criar na raiz de `apps/web/`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Configuração no Vercel
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Parte 10 — Checklist de validação

### Auth e onboarding
- [ ] Signup cria conta e redireciona para `/onboarding`
- [ ] Onboarding concluído redireciona para `/join`
- [ ] Código `ENEM26` entra na turma diretamente
- [ ] Código inválido mostra mensagem de erro
- [ ] Usuário sem turma é sempre redirecionado para `/join`
- [ ] Logout redireciona para `/login`

### Navegação
- [ ] Sidebar destaca a rota ativa corretamente
- [ ] Todas as 5 rotas principais carregam sem erro
- [ ] Rotas protegidas redirecionam para login quando não autenticado

### Home
- [ ] Pet card renderiza com nível, XP e fase correta
- [ ] Stats strip mostra sequência, questões hoje e % acerto reais
- [ ] Nome da turma aparece no card de turma ativa

### Study
- [ ] Seleção de área navega para filtros
- [ ] Filtros aplicados e "Iniciar treino" carrega questões
- [ ] Questão renderiza com opções A–E
- [ ] Feedback correto/errado aparece após resposta
- [ ] XP atualiza após responder

### Broto (Chat)
- [ ] Mensagem enviada aparece no chat
- [ ] Animação de "digitando" aparece enquanto espera
- [ ] Resposta do NotebookLM aparece formatada
- [ ] Enter envia, Shift+Enter quebra linha

### Rotina com IA
- [ ] "Gerar nova rotina" dispara job e mostra loading
- [ ] Estado do job evolui de pending para completed
- [ ] Erro é tratado e mensagem aparece

### Packages/ui
- [ ] `Button`, `Card`, `Badge`, `Spinner` importam sem erro nos dois apps (web e admin)
- [ ] Admin atualizado para usar `@broto/ui` onde aplicável

---

## Observações finais

1. **Reusar hooks do mobile.** A lógica de `usePet`, `useProgress`, `useQuestions` e `useRoutine` é idêntica — copiar os arquivos de `apps/mobile/src/hooks/` e ajustar apenas os imports (`@/lib/supabase` em vez do cliente do Expo).

2. **QuestionPlayer no web** pode reusar a lógica do mobile, mas substituir `Pressable` por `<button>` e `Text` por `<p>` / `<span>`. O HTML do contexto das questões (campo `content` que pode ter LaTeX ou imagens) deve ser renderizado com `dangerouslySetInnerHTML` no web.

3. **Responsividade.** O layout de duas colunas (`gridTemplateColumns: '340px 1fr'`) deve colapsar para coluna única abaixo de 768px. Adicionar media query ou usar `repeat(auto-fit, minmax(300px, 1fr))`.

4. **`useJobPolling` no web** usa `fetch` direto para o serviço Railway (não passa pela edge function) — a URL base é `VITE_NOTEBOOKLM_SERVICE_URL`. O job de rotina é gerado via edge function (`routine-generate`), mas o polling de status vai direto ao Python para não sobrecarregar as edge functions com requests periódicos.

5. **O `packages/ui` usa Tailwind** nos componentes `Button` e `Card`. O app web precisa ter Tailwind configurado, ou substituir as classes por estilos inline. Para simplicidade no TCC, substituir `className` por `style={{}}` inline — consistente com o restante dos componentes desta fase. 