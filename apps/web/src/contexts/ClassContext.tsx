import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Class, Organization } from '@broto/shared'
import { mapOrganizationRow, resolveClassTenantRow, isRecord } from '@broto/shared'
import { useOrganization } from '@/contexts/OrganizationContext'

type ClassContextType = {
  currentClass: Class | null
  organization: Organization | null
  loading: boolean
  error: string | null
}

export const ClassContext = createContext<ClassContextType | null>(null)

function formatClassLoadError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    const m = (err as { message: string }).message.trim()
    if (m) return m
  }
  return 'Não foi possível carregar os dados da turma.'
}

export function ClassProvider({ children }: { children: ReactNode }) {
  const { effectiveActiveOrganizationId, loading: orgLoading } = useOrganization()
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orgLoading) return

    let alive = true

    async function load() {
      setLoading(true)
      const { data: userData, error: authErr } = await supabase.auth.getUser()
      const user = userData?.user

      // Sem sessão, getUser() retorna AuthSessionMissingError — estado normal quando deslogado.
      if (!user) {
        if (alive) {
          setError(null)
          setCurrentClass(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      if (authErr) {
        if (alive) {
          setError(formatClassLoadError(authErr))
          setCurrentClass(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('current_class_id, classes:current_class_id(*, organizations(*))')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(formatClassLoadError(profileError))
          setLoading(false)
        }
        return
      }

      // No public.users row yet (orphan auth user or first-login before trigger ran).
      // Treat as no-class state — onboarding or profile repair will create the row.
      if (!profile) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(null)
          setLoading(false)
        }
        return
      }

      const resolution = resolveClassTenantRow(
        effectiveActiveOrganizationId,
        isRecord(profile) ? profile.classes : null,
      )

      if (resolution.kind === 'no-active-org') {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(null)
          setLoading(false)
        }
        return
      }

      if (resolution.kind === 'use-current-class') {
        if (alive) {
          setError(null)
          setCurrentClass(resolution.classRow as unknown as Class)
          setOrganization(mapOrganizationRow(resolution.organizationRow))
        }
      } else {
        const { data: orgRow, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', resolution.organizationId)
          .maybeSingle()

        if (!alive) return

        if (orgError) {
          setCurrentClass(null)
          setOrganization(null)
          setError(formatClassLoadError(orgError))
          setLoading(false)
          return
        }

        setError(null)
        setCurrentClass(null)
        setOrganization(mapOrganizationRow(orgRow))
      }

      if (alive) setLoading(false)
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
  }, [orgLoading, effectiveActiveOrganizationId])

  const combinedLoading = orgLoading || loading

  return (
    <ClassContext.Provider value={{ currentClass, organization, loading: combinedLoading, error }}>
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
