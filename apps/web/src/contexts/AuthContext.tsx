import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@broto/shared'

type AuthContextType = {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Listen for auth changes - only save userId, no queries inside callback (avoids deadlock)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
        setUser(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // When userId changes, fetch profile outside auth lock
  useEffect(() => {
    if (!userId) return

    async function fetchProfile() {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, nome, email, image, onboarding_done, data_enem, horas_disponiveis_por_dia')
          .eq('id', userId!)
          .single()

        if (data) {
          setUser({
            id: data.id,
            nome: data.nome,
            email: data.email,
            image: data.image ?? null,
            onboardingDone: data.onboarding_done ?? false,
            dataEnem: data.data_enem ?? null,
            horasDisponiveisPorDia: data.horas_disponiveis_por_dia ?? 2,
          })
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha invalidos' }
    return { error: null }
  }

  async function signUp(email: string, password: string, nome: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) return { error: 'Erro ao criar conta' }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    // Clear user-scoped localStorage to prevent cross-account leakage (I3, E4)
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('broto:')) localStorage.removeItem(key)
    })
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
