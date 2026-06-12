import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { api, ApiError } from '@/lib/api-client'
import type { UserProfile } from '@broto/shared'

type AuthContextType = {
  user: UserProfile | null
  loading: boolean
  refreshUser: () => Promise<void>
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

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, email, image, onboarding_done, data_enem, horas_disponiveis_por_dia')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('[fetchProfile] query error:', error)
        return
      }

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
        return
      }

      // No public.users row — orphan auth user (trigger failed silently on signup).
      // Auto-create a minimal profile so the user can proceed to onboarding
      // instead of being stuck in an infinite /login redirect loop.
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData.session?.user
      const email = authUser?.email ?? ''
      const nome =
        (authUser?.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0] ??
        'Usuário'

      const { error: insertError } = await supabase
        .from('users')
        .insert({ id, email, nome, onboarding_done: false })

      if (insertError) {
        console.error('[fetchProfile] could not auto-create profile:', insertError)
        return
      }

      // Best-effort pet creation — ignore failure (pet may already exist or be created later).
      await supabase
        .from('pets')
        .insert({
          user_id: id,
          fase: 'semente',
          nivel: 1,
          xp: 0,
          humor: 100,
          energia: 100,
          moedas: 0,
        })
        .then(({ error: petErr }) => {
          if (petErr) console.warn('[fetchProfile] pet auto-create:', petErr.message)
        })

      setUser({
        id,
        nome,
        email,
        image: null,
        onboardingDone: false,
        dataEnem: null,
        horasDisponiveisPorDia: 2,
      })
    } catch (err) {
      console.error('[fetchProfile] unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!userId) return
    await fetchProfile(userId)
  }, [userId, fetchProfile])

  // When userId changes, fetch profile outside auth lock
  useEffect(() => {
    if (userId === null) return
    const profileId = userId

    async function load() {
      await fetchProfile(profileId)
    }

    void load()
  }, [userId, fetchProfile])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha invalidos' }
    // Keep loading true until profile loads so ProtectedRoute does not redirect to /login
    // while user is still null (navigate('/') runs in the same tick as signIn resolves).
    if (data.user) {
      setLoading(true)
      setUserId(data.user.id)
    }
    return { error: null }
  }

  async function signUp(email: string, password: string, nome: string) {
    try {
      await api.postPublic<{ userId: string }>('/api/auth/signup', { email, password, nome })
    } catch (e) {
      if (e instanceof ApiError) return { error: e.message }
      return { error: 'Erro ao criar conta' }
    }
    const { data: signInData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (sessionError) {
      return {
        error: 'Conta criada, mas não foi possível entrar automaticamente. Tente fazer login.',
      }
    }
    if (signInData.user) {
      setLoading(true)
      setUserId(signInData.user.id)
    }
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
    <AuthContext.Provider value={{ user, loading, refreshUser, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
