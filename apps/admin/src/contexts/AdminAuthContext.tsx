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

async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data ?? null
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Escutar auth — so salva o userId, sem fazer queries dentro do callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

    fetchAdminProfile(userId).then(profile => {
      setAdmin(profile)
      setLoading(false)
    })
  }, [userId])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha invalidos' }

    const profile = await fetchAdminProfile(data.user.id)

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
