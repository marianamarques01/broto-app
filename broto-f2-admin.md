# Prompt Fase 1 — Admin Dashboard

## Pré-requisito

A **Fase 0** deve estar concluída antes desta fase:
- Monorepo Turborepo configurado
- Schema novo no Supabase (organizations, classes, enrollments, materials, admin_profiles)
- `packages/shared` com todos os tipos
- Seed do ENEM aplicado

---

## Contexto

O admin dashboard é o app web usado por **escolas, cursinhos e professores** para:
- Criar e gerenciar turmas
- Fazer upload de materiais que alimentam o NotebookLM de cada turma
- Acompanhar indicadores dos alunos por turma

É um app React separado (`apps/admin/`), mas compartilha o mesmo projeto Supabase e os tipos do `packages/shared`.

---

## Estrutura a criar

```
apps/admin/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── lib/
    │   ├── supabase.ts
    │   └── api-client.ts
    ├── hooks/
    │   ├── useAdminAuth.ts
    │   ├── useOrganization.ts
    │   ├── useClasses.ts
    │   ├── useMaterials.ts
    │   └── useClassIndicators.ts
    ├── contexts/
    │   └── AdminAuthContext.tsx
    ├── pages/
    │   ├── Login.tsx
    │   ├── Dashboard.tsx          ← visão geral das turmas
    │   ├── ClassDetail.tsx        ← turma específica: materiais + alunos
    │   ├── CreateClass.tsx
    │   └── StudentDetail.tsx      ← indicadores de um aluno
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── class/
    │   │   ├── ClassCard.tsx
    │   │   ├── ClassCodeBadge.tsx
    │   │   └── CreateClassModal.tsx
    │   ├── materials/
    │   │   ├── MaterialsList.tsx
    │   │   ├── MaterialUpload.tsx
    │   │   └── MaterialStatusBadge.tsx
    │   └── indicators/
    │       ├── ClassIndicatorsPanel.tsx
    │       ├── StudentRow.tsx
    │       └── TopicPerformanceChart.tsx
    └── router.tsx
```

---

## Parte 1 — Setup do app

### `package.json`
```json
{
  "name": "@broto/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@broto/shared": "*",
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### `.env.example`
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_NOTEBOOKLM_SERVICE_URL=https://seu-servico.railway.app
VITE_NOTEBOOKLM_INTERNAL_SECRET=mesmo_valor_do_python
```

### `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Parte 2 — Auth do admin

O admin usa o mesmo Supabase Auth, mas tem perfil em `admin_profiles` em vez de `profiles`. O login verifica se o usuário tem registro em `admin_profiles` — se não tiver, nega acesso.

### `src/contexts/AdminAuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminProfile } from '@broto/shared'

type AdminAuthContextType = {
  admin: AdminProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        setAdmin(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setAdmin(data ?? null)
      setLoading(false)
    })
  }, [])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha inválidos' }

    // Verifica se é admin
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return { error: 'Conta sem permissão de administrador' }
    }

    setAdmin(profile)
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
```

### `src/components/layout/ProtectedRoute.tsx`
```typescript
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
```

---

## Parte 3 — Roteamento

### `src/router.tsx`
```typescript
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ClassDetail } from '@/pages/ClassDetail'
import { CreateClass } from '@/pages/CreateClass'
import { StudentDetail } from '@/pages/StudentDetail'

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
])
```

---

## Parte 4 — Hooks

### `src/hooks/useClasses.ts`
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { Class } from '@broto/shared'
import { generateClassCode } from '@broto/shared'

export function useClasses() {
  const { admin } = useAdminAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async () => {
    if (!admin) return
    setLoading(true)

    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('organization_id', admin.organization_id)
      .order('created_at', { ascending: false })

    setClasses(data ?? [])
    setLoading(false)
  }, [admin])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  async function createClass(params: {
    name: string
    description?: string
  }): Promise<{ data: Class | null; error: string | null }> {
    if (!admin) return { data: null, error: 'Não autenticado' }

    const access_code = generateClassCode()

    const { data, error } = await supabase
      .from('classes')
      .insert({
        organization_id: admin.organization_id,
        name: params.name,
        description: params.description,
        access_code,
        created_by: admin.id,
      })
      .select()
      .single()

    if (error) return { data: null, error: 'Erro ao criar turma' }

    await fetchClasses()
    return { data, error: null }
  }

  async function toggleClassStatus(classId: string, isActive: boolean) {
    await supabase
      .from('classes')
      .update({ is_active: isActive })
      .eq('id', classId)

    await fetchClasses()
  }

  return { classes, loading, createClass, toggleClassStatus, refetch: fetchClasses }
}
```

### `src/hooks/useMaterials.ts`
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { Material } from '@broto/shared'

export function useMaterials(classId: string) {
  const { admin } = useAdminAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    setMaterials(data ?? [])
    setLoading(false)
  }, [classId])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  async function uploadPDF(file: File, title: string): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Não autenticado' }

    // 1. Upload para Supabase Storage
    const fileName = `${classId}/${Date.now()}_${file.name}`
    const { error: storageError } = await supabase.storage
      .from('materials')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (storageError) return { error: 'Erro ao fazer upload do arquivo' }

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(fileName)

    // 2. Salvar registro no banco
    const { data: material, error: dbError } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        organization_id: admin.organization_id,
        title,
        type: 'pdf',
        source_url: publicUrl,
        index_status: 'pending',
        uploaded_by: admin.id,
      })
      .select()
      .single()

    if (dbError) return { error: 'Erro ao registrar material' }

    // 3. Acionar indexação no NotebookLM via Edge Function
    await supabase.functions.invoke('material-index', {
      body: {
        material_id: material.id,
        class_id: classId,
        source_url: publicUrl,
        type: 'pdf',
      }
    })

    await fetchMaterials()
    return { error: null }
  }

  async function addURL(url: string, title: string, type: 'url' | 'youtube'): Promise<{ error: string | null }> {
    if (!admin) return { error: 'Não autenticado' }

    const { data: material, error: dbError } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        organization_id: admin.organization_id,
        title,
        type,
        source_url: url,
        index_status: 'pending',
        uploaded_by: admin.id,
      })
      .select()
      .single()

    if (dbError) return { error: 'Erro ao registrar material' }

    await supabase.functions.invoke('material-index', {
      body: {
        material_id: material.id,
        class_id: classId,
        source_url: url,
        type,
      }
    })

    await fetchMaterials()
    return { error: null }
  }

  async function deleteMaterial(materialId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)

    if (error) return { error: 'Erro ao remover material' }
    await fetchMaterials()
    return { error: null }
  }

  return { materials, loading, uploadPDF, addURL, deleteMaterial, refetch: fetchMaterials }
}
```

### `src/hooks/useClassIndicators.ts`
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClassIndicators } from '@broto/shared'

export function useClassIndicators(classId: string) {
  const [indicators, setIndicators] = useState<ClassIndicators | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)

      // Buscar alunos matriculados
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          profiles (
            id,
            full_name,
            avatar_url,
            xp,
            level,
            streak
          ),
          topic_performance (
            topic_id,
            topic_label,
            area,
            total_answers,
            correct_answers
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active')

      if (!enrollments) { setLoading(false); return }

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Buscar atividade recente
      const { data: recentActivity } = await supabase
        .from('answer_logs')
        .select('student_id')
        .eq('class_id', classId)
        .gte('created_at', sevenDaysAgo)

      const activeStudentIds = new Set(recentActivity?.map(a => a.student_id) ?? [])

      // Montar indicadores
      const students = enrollments.map(e => {
        const perf = e.topic_performance ?? []
        const totalAnswers = perf.reduce((s: number, t: any) => s + t.total_answers, 0)
        const correctAnswers = perf.reduce((s: number, t: any) => s + t.correct_answers, 0)
        const accuracyRate = totalAnswers > 0 ? correctAnswers / totalAnswers : 0
        const weakTopics = perf
          .filter((t: any) => t.total_answers >= 3)
          .sort((a: any, b: any) => (a.correct_answers / a.total_answers) - (b.correct_answers / b.total_answers))
          .slice(0, 3)
          .map((t: any) => t.topic_id)

        return {
          student_id: e.student_id,
          class_id: classId,
          total_questions: totalAnswers,
          correct_answers: correctAnswers,
          accuracy_rate: accuracyRate,
          current_streak: (e.profiles as any)?.streak ?? 0,
          xp: (e.profiles as any)?.xp ?? 0,
          level: (e.profiles as any)?.level ?? 1,
          topic_performance: perf,
          weak_topics: weakTopics,
          last_activity_at: '',
        }
      })

      const totalStudents = students.length
      const activeStudents = enrollments.filter(e => activeStudentIds.has(e.student_id)).length
      const avgAccuracy = totalStudents > 0
        ? students.reduce((s, st) => s + st.accuracy_rate, 0) / totalStudents
        : 0
      const avgStreak = totalStudents > 0
        ? students.reduce((s, st) => s + st.current_streak, 0) / totalStudents
        : 0

      setIndicators({
        class_id: classId,
        total_students: totalStudents,
        active_students: activeStudents,
        avg_accuracy_rate: avgAccuracy,
        avg_streak: avgStreak,
        weak_topics: [],
        students,
      })

      setLoading(false)
    }

    fetch()
  }, [classId])

  return { indicators, loading }
}
```

---

## Parte 5 — Páginas

### `src/pages/Login.tsx`
```typescript
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function Login() {
  const { signIn } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
    }}>
      <div style={{
        background: '#fff',
        border: '0.5px solid #e0e0e0',
        borderRadius: 16,
        padding: '40px 48px',
        width: 400,
        maxWidth: '90vw',
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Broto Admin</h1>
          <p style={{ color: '#666', marginTop: 8, fontSize: 14 }}>
            Acesso exclusivo para administradores
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '0.5px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#d32f2f', fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### `src/pages/Dashboard.tsx`
```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useClasses } from '@/hooks/useClasses'
import { CreateClassModal } from '@/components/class/CreateClassModal'
import { ClassCard } from '@/components/class/ClassCard'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function Dashboard() {
  const { admin } = useAdminAuth()
  const { classes, loading, createClass } = useClasses()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Turmas" action={
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Nova turma
          </button>
        } />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {loading ? (
            <p style={{ color: '#666' }}>Carregando turmas...</p>
          ) : classes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 0',
              color: '#888',
            }}>
              <p style={{ fontSize: 16, marginBottom: 12 }}>Nenhuma turma criada ainda.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'transparent',
                  border: '0.5px solid #ccc',
                  borderRadius: 8,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Criar primeira turma
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {classes.map(cls => (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <ClassCard cls={cls} />
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createClass}
        />
      )}
    </div>
  )
}
```

### `src/pages/ClassDetail.tsx`
```typescript
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMaterials } from '@/hooks/useMaterials'
import { useClassIndicators } from '@/hooks/useClassIndicators'
import { MaterialsList } from '@/components/materials/MaterialsList'
import { MaterialUpload } from '@/components/materials/MaterialUpload'
import { ClassIndicatorsPanel } from '@/components/indicators/ClassIndicatorsPanel'
import { ClassCodeBadge } from '@/components/class/ClassCodeBadge'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Class } from '@broto/shared'

type Tab = 'materials' | 'indicators'

export function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const [cls, setCls] = useState<Class | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const { materials, loading: materialsLoading, uploadPDF, addURL, deleteMaterial } = useMaterials(classId!)
  const { indicators, loading: indicatorsLoading } = useClassIndicators(classId!)

  useEffect(() => {
    supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
      .then(({ data }) => setCls(data))
  }, [classId])

  const tabStyle = (tab: Tab) => ({
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    borderBottom: activeTab === tab ? '2px solid #2e7d32' : '2px solid transparent',
    color: activeTab === tab ? '#2e7d32' : '#666',
    fontWeight: activeTab === tab ? 500 : 400,
    cursor: 'pointer',
    fontSize: 14,
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={cls?.name ?? 'Turma'}
          subtitle={cls && <ClassCodeBadge code={cls.access_code} />}
          backTo="/"
        />

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '0.5px solid #e0e0e0', paddingLeft: 32 }}>
          <button style={tabStyle('materials')} onClick={() => setActiveTab('materials')}>
            Materiais
          </button>
          <button style={tabStyle('indicators')} onClick={() => setActiveTab('indicators')}>
            Indicadores
          </button>
        </div>

        <main style={{ padding: '24px 32px', flex: 1 }}>
          {activeTab === 'materials' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
              <MaterialsList
                materials={materials}
                loading={materialsLoading}
                onDelete={deleteMaterial}
              />
              <MaterialUpload
                classId={classId!}
                onUploadPDF={uploadPDF}
                onAddURL={addURL}
              />
            </div>
          )}

          {activeTab === 'indicators' && (
            <ClassIndicatorsPanel
              indicators={indicators}
              loading={indicatorsLoading}
              classId={classId!}
            />
          )}
        </main>
      </div>
    </div>
  )
}
```

---

## Parte 6 — Componentes principais

### `src/components/class/CreateClassModal.tsx`
```typescript
import { useState, FormEvent } from 'react'
import type { Class } from '@broto/shared'

type Props = {
  onClose: () => void
  onCreate: (params: { name: string; description?: string }) => Promise<{ data: Class | null; error: string | null }>
}

export function CreateClassModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Class | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const { data, error } = await onCreate({ name: name.trim(), description: description.trim() || undefined })
    setLoading(false)

    if (error) { setError(error); return }
    setCreated(data)
  }

  const overlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  }

  const modalStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 40px',
    width: 440,
    maxWidth: '90vw',
  }

  if (created) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Turma criada!</h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>
            Compartilhe o código abaixo com seus alunos para que possam entrar na turma.
          </p>
          <div style={{
            background: '#f0f7f0',
            border: '0.5px solid #a5d6a7',
            borderRadius: 12,
            padding: '20px',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Código de acesso</p>
            <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6, color: '#2e7d32', margin: 0 }}>
              {created.access_code}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Ir para a turma
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Nova turma</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Nome da turma *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Turma ENEM Manhã 2026"
              required
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Focada em Ciências da Natureza e Matemática"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ color: '#d32f2f', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: 'transparent', border: '0.5px solid #ccc', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                flex: 1,
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.7 : 1,
              }}
            >
              {loading ? 'Criando...' : 'Criar turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### `src/components/materials/MaterialUpload.tsx`
```typescript
import { useState, useRef } from 'react'

type Props = {
  classId: string
  onUploadPDF: (file: File, title: string) => Promise<{ error: string | null }>
  onAddURL: (url: string, title: string, type: 'url' | 'youtube') => Promise<{ error: string | null }>
}

type UploadTab = 'pdf' | 'url' | 'youtube'

export function MaterialUpload({ onUploadPDF, onAddURL }: Props) {
  const [tab, setTab] = useState<UploadTab>('pdf')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function isYouTube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Informe um título'); return }
    setLoading(true)
    setError(null)

    let result: { error: string | null }

    if (tab === 'pdf') {
      if (!file) { setError('Selecione um arquivo'); setLoading(false); return }
      result = await onUploadPDF(file, title.trim())
    } else {
      if (!url.trim()) { setError('Informe uma URL'); setLoading(false); return }
      const type = isYouTube(url) ? 'youtube' : 'url'
      result = await onAddURL(url.trim(), title.trim(), type)
    }

    setLoading(false)
    if (result.error) { setError(result.error); return }

    setSuccess(true)
    setTitle('')
    setUrl('')
    setFile(null)
    setTimeout(() => setSuccess(false), 3000)
  }

  const tabBtn = (t: UploadTab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: '8px',
        border: '0.5px solid',
        borderColor: tab === t ? '#2e7d32' : '#ddd',
        background: tab === t ? '#f0f7f0' : '#fff',
        color: tab === t ? '#2e7d32' : '#666',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: tab === t ? 500 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '20px 24px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Adicionar material</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabBtn('pdf', 'PDF')}
        {tabBtn('url', 'URL')}
        {tabBtn('youtube', 'YouTube')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Apostila de Matemática"
            style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        {tab === 'pdf' ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Arquivo PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1px dashed #ccc',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? '#f0f7f0' : '#fafafa',
              }}
            >
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {file ? file.name : 'Clique para selecionar um PDF'}
              </p>
              {file && <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {tab === 'youtube' ? 'Link do YouTube' : 'URL da página'}
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={tab === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
              style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        )}

        {error && <p style={{ color: '#d32f2f', fontSize: 12, margin: 0 }}>{error}</p>}
        {success && <p style={{ color: '#2e7d32', fontSize: 12, margin: 0 }}>Material adicionado e enviado para indexação!</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Enviando...' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}
```

### `src/components/indicators/ClassIndicatorsPanel.tsx`
```typescript
import { Link } from 'react-router-dom'
import type { ClassIndicators } from '@broto/shared'

type Props = {
  indicators: ClassIndicators | null
  loading: boolean
  classId: string
}

export function ClassIndicatorsPanel({ indicators, loading, classId }: Props) {
  if (loading) return <p style={{ color: '#666' }}>Carregando indicadores...</p>
  if (!indicators) return <p style={{ color: '#666' }}>Sem dados ainda.</p>

  const metricCard = (label: string, value: string | number) => (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e0e0e0',
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>{value}</p>
    </div>
  )

  return (
    <div>
      {/* Métricas gerais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {metricCard('Alunos', indicators.total_students)}
        {metricCard('Ativos (7 dias)', indicators.active_students)}
        {metricCard('Acerto médio', `${Math.round(indicators.avg_accuracy_rate * 100)}%`)}
        {metricCard('Streak médio', `${Math.round(indicators.avg_streak)}d`)}
      </div>

      {/* Tabela de alunos */}
      <div style={{ background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e0e0e0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Alunos</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Aluno', 'Questões', 'Acerto', 'Streak', 'XP', ''].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 500, fontSize: 12, color: '#666', borderBottom: '0.5px solid #e0e0e0' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px 20px', textAlign: 'center', color: '#888', fontSize: 13 }}>
                  Nenhum aluno matriculado ainda
                </td>
              </tr>
            ) : indicators.students.map(student => (
              <tr key={student.student_id} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                <td style={{ padding: '12px 20px', color: '#1a1a1a' }}>{student.student_id.slice(0, 8)}...</td>
                <td style={{ padding: '12px 20px', color: '#444' }}>{student.total_questions}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    color: student.accuracy_rate >= 0.7 ? '#2e7d32' : student.accuracy_rate >= 0.4 ? '#e65100' : '#c62828',
                    fontWeight: 500,
                  }}>
                    {Math.round(student.accuracy_rate * 100)}%
                  </span>
                </td>
                <td style={{ padding: '12px 20px', color: '#444' }}>{student.current_streak}d</td>
                <td style={{ padding: '12px 20px', color: '#444' }}>{student.xp}</td>
                <td style={{ padding: '12px 20px' }}>
                  <Link
                    to={`/classes/${classId}/students/${student.student_id}`}
                    style={{ color: '#2e7d32', fontSize: 13, textDecoration: 'none' }}
                  >
                    Ver detalhes →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Parte 7 — Edge Function: indexar material no NotebookLM

Criar `supabase/functions/material-index/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SERVICE_URL = Deno.env.get("NOTEBOOKLM_SERVICE_URL")!
const INTERNAL_SECRET = Deno.env.get("NOTEBOOKLM_INTERNAL_SECRET")!

serve(async (req) => {
  // Usar service role key — chamada interna do admin hook, não do aluno
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const { material_id, class_id, source_url, type } = await req.json()

    // Marcar como indexando
    await supabase
      .from('materials')
      .update({ index_status: 'indexing' })
      .eq('id', material_id)

    // Buscar notebook_id da turma
    const { data: cls } = await supabase
      .from('classes')
      .select('notebook_id, notebook_status')
      .eq('id', class_id)
      .single()

    if (!cls?.notebook_id) {
      // Turma ainda não tem notebook — criar via serviço Python
      const createRes = await fetch(`${SERVICE_URL}/notebook/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': INTERNAL_SECRET,
        },
        body: JSON.stringify({ class_id }),
      })

      if (!createRes.ok) {
        await supabase.from('materials').update({ index_status: 'failed' }).eq('id', material_id)
        return new Response(JSON.stringify({ error: 'Erro ao criar notebook' }), { status: 500 })
      }

      const { notebook_id } = await createRes.json()
      await supabase.from('classes').update({ notebook_id, notebook_status: 'indexing' }).eq('id', class_id)
    }

    // Enviar material para indexação no notebooklm-py
    const indexRes = await fetch(`${SERVICE_URL}/notebook/add-source`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        class_id,
        source_url,
        source_type: type,
        material_id,
      }),
    })

    if (!indexRes.ok) {
      await supabase.from('materials').update({ index_status: 'failed' }).eq('id', material_id)
      return new Response(JSON.stringify({ error: 'Erro ao indexar' }), { status: 500 })
    }

    await supabase.from('materials').update({ index_status: 'indexed' }).eq('id', material_id)
    await supabase.from('classes').update({ notebook_status: 'ready' }).eq('id', class_id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
```

---

## Parte 8 — Routers Python adicionais (adaptar services/notebooklm)

Adicionar em `services/notebooklm/routers/notebook.py`:

```python
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.notebooklm_client import get_client
import os, json

router = APIRouter(prefix="/notebook", tags=["notebook"])

# Persiste class_id → notebook_id em arquivo JSON local
# Em produção: usar banco ou Redis
NOTEBOOK_MAP_PATH = os.getenv("NOTEBOOK_MAP_PATH", "/tmp/notebook_map.json")

def load_map() -> dict:
    if not os.path.exists(NOTEBOOK_MAP_PATH):
        return {}
    with open(NOTEBOOK_MAP_PATH) as f:
        return json.load(f)

def save_map(m: dict):
    with open(NOTEBOOK_MAP_PATH, "w") as f:
        json.dump(m, f)

class CreateNotebookRequest(BaseModel):
    class_id: str

class AddSourceRequest(BaseModel):
    class_id: str
    source_url: str
    source_type: str   # pdf | url | youtube
    material_id: str

@router.post("/create")
async def create_notebook(req: CreateNotebookRequest):
    notebook_map = load_map()

    if req.class_id in notebook_map:
        return {"notebook_id": notebook_map[req.class_id]}

    async with await get_client() as client:
        nb = await client.notebooks.create(f"Broto — Turma {req.class_id[:8]}")
        notebook_map[req.class_id] = nb.id
        save_map(notebook_map)
        return {"notebook_id": nb.id}

@router.post("/add-source")
async def add_source(req: AddSourceRequest):
    notebook_map = load_map()
    notebook_id = notebook_map.get(req.class_id)

    if not notebook_id:
        raise HTTPException(status_code=404, detail="Notebook não encontrado para esta turma")

    async with await get_client() as client:
        if req.source_type == "pdf":
            await client.sources.add_url(notebook_id, req.source_url, wait=True)
        elif req.source_type in ("url", "youtube"):
            await client.sources.add_url(notebook_id, req.source_url, wait=True)

    return {"success": True, "material_id": req.material_id}
```

Registrar o router em `main.py`:
```python
from routers import routine, chat, content, notebook   # adicionar notebook

app.include_router(notebook.router)
```

---

## Parte 9 — Checklist de validação

### Auth admin
- [ ] Login com credencial de aluno é recusado ("Conta sem permissão de administrador")
- [ ] Login com admin retorna e redireciona para o dashboard
- [ ] Logout funciona e redireciona para `/login`

### Turmas
- [ ] Criar turma gera código de 6 caracteres único
- [ ] Turma aparece no dashboard após criação
- [ ] Código mostrado no modal pós-criação é o mesmo salvo no banco

### Materiais
- [ ] Upload de PDF salva no Supabase Storage bucket `materials`
- [ ] Registro em `materials` criado com `index_status: pending`
- [ ] Edge function `material-index` acionada após upload
- [ ] Status evolui de `pending` → `indexing` → `indexed`
- [ ] Adicionar URL e YouTube também aciona indexação
- [ ] Remover material deleta o registro (não o arquivo do Storage ainda — ok para TCC)

### NotebookLM
- [ ] Primeira indexação de material cria o notebook da turma
- [ ] `classes.notebook_id` preenchido após criação do notebook
- [ ] `classes.notebook_status` vira `ready` após primeira indexação bem-sucedida

### Indicadores
- [ ] Dashboard de turma mostra total de alunos, ativos, acerto médio, streak médio
- [ ] Tabela de alunos lista todos os matriculados
- [ ] Link "Ver detalhes" navega para o perfil do aluno

---

## Observações finais

1. **Bucket `materials` no Supabase Storage** deve ser criado manualmente no painel antes do primeiro upload. Configurar como público (os PDFs são acessados pelo notebooklm-py via URL).

2. **`SUPABASE_SERVICE_ROLE_KEY`** é necessária na edge function `material-index` pois ela atualiza registros sem estar no contexto de um usuário autenticado. Adicionar nos secrets do Supabase.

3. **O `NOTEBOOK_MAP_PATH`** no serviço Python persiste em `/tmp` no Railway — isso é efêmero e resetado a cada deploy. Para o TCC é aceitável. Em produção, mover para uma tabela Supabase ou variável de ambiente atualizada via API.

4. **A página `StudentDetail`** deve mostrar o mesmo perfil do aluno que o app mobile exibe — reaproveitar as queries de `topic_performance` e `pet`. Implementar como extensão desta fase.

5. **Design do admin**: manter clean e funcional. Não precisa ter o visual do app do aluno. Verde `#2e7d32` como cor primária, superfícies brancas, tipografia simples. Funcionalidade > estética aqui.