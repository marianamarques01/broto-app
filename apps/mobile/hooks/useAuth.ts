import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface UseAuthReturn {
  status: AuthStatus
  session: Session | null
}

export function useAuth(): UseAuthReturn {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setStatus(session ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  return { status, session }
}
