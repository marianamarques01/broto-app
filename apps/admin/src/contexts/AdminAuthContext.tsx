import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminProfile } from '@broto/shared'

type AdminAuthContextType = {
  admin: AdminProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

const STAFF_MEMBERSHIP_ROLES = ['teacher', 'org_admin', 'owner'] as const

type AuthUserHint = {
  email?: string | null
  fullName?: string | null
}

async function fetchAdminProfile(userId: string, hint?: AuthUserHint): Promise<AdminProfile | null> {
  const [{ data: userRow, error: userErr }, { data: memberships, error: memErr }] = await Promise.all([
    supabase.from('users').select('email, nome, current_organization_id').eq('id', userId).maybeSingle(),
    supabase
      .from('organization_memberships')
      .select('organization_id, role, joined_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('role', [...STAFF_MEMBERSHIP_ROLES]),
  ])

  if (userErr) console.error('[admin-auth]', userErr.message)
  if (memErr) {
    console.error('[admin-auth]', memErr.message)
    return null
  }

  if (!memberships?.length) return null

  const storedOrgId = userRow?.current_organization_id ?? null
  const byStored = storedOrgId
    ? memberships.find((m) => m.organization_id === storedOrgId) ?? null
    : null

  const chosen =
    byStored ??
    [...memberships].sort(
      (a, b) =>
        new Date(b.joined_at ?? 0).getTime() - new Date(a.joined_at ?? 0).getTime(),
    )[0]

  const email = userRow?.email ?? hint?.email ?? ''
  const full_name = userRow?.nome?.trim() ? userRow.nome : hint?.fullName ?? ''

  return {
    id: userId,
    email,
    full_name,
    organization_id: chosen.organization_id,
    role: chosen.role as AdminProfile['role'],
    created_at: chosen.joined_at ?? new Date().toISOString(),
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Escutar auth — so salva o userId, sem fazer queries dentro do callback
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
        setAdmin(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Quando userId muda, busca o perfil fora do lock do auth
  useEffect(() => {
    if (!userId) return

    fetchAdminProfile(userId).then((profile) => {
      setAdmin(profile)
      setLoading(false)
    })
  }, [userId])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha invalidos' }

    const profile = await fetchAdminProfile(data.user.id, {
      email: data.user.email,
      fullName: (data.user.user_metadata?.full_name as string | undefined) ?? null,
    })

    if (!profile) {
      await supabase.auth.signOut()
      return { error: 'Conta sem permissao de administrador' }
    }

    setAdmin(profile)
    setLoading(false)
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
