import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Class, Organization } from '@broto/shared'

type ClassContextType = {
  currentClass: Class | null
  organization: Organization | null
  loading: boolean
  error: string | null
}

export const ClassContext = createContext<ClassContextType | null>(null)

function formatClassLoadError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const m = (err as { message: string }).message.trim()
    if (m) return m
  }
  return 'Não foi possível carregar os dados da turma.'
}

export function ClassProvider({ children }: { children: ReactNode }) {
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      const { data: userData, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        if (alive) {
          setError(formatClassLoadError(authErr))
          setLoading(false)
        }
        return
      }

      const user = userData?.user
      if (!user) {
        if (alive) {
          setError(null)
          setLoading(false)
        }
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('current_class_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(formatClassLoadError(profileError))
          setLoading(false)
        }
        return
      }

      const classId = (profile as { current_class_id?: string } | null)?.current_class_id
      if (!classId) {
        if (alive) {
          setError(null)
          setCurrentClass(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*, organizations(*)')
        .eq('id', classId)
        .single()

      if (classError) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(formatClassLoadError(classError))
          setLoading(false)
        }
        return
      }

      if (alive) {
        setError(null)
        if (classData) {
          setCurrentClass(classData as unknown as Class)
          setOrganization(
            ((classData as Record<string, unknown>).organizations as Organization) ?? null,
          )
        } else {
          setCurrentClass(null)
          setOrganization(null)
        }
        setLoading(false)
      }
    }

    load().catch((err) => {
      if (alive) {
        setCurrentClass(null)
        setOrganization(null)
        setError(formatClassLoadError(err))
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <ClassContext.Provider value={{ currentClass, organization, loading, error }}>
      {error ? (
        <div
          className="broto-error-banner"
          style={{ margin: 0, borderRadius: 0, border: 'none' }}
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {children}
    </ClassContext.Provider>
  )
}
