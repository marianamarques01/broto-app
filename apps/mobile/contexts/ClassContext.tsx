import { createContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Class, Organization } from '@broto/shared'
import { mapOrganizationRow, resolveClassTenantRow } from '@broto/shared'
import { useOrganization } from '@/contexts/OrganizationContext'

type ClassContextType = {
  currentClass: Class | null
  organization: Organization | null
  loading: boolean
}

export const ClassContext = createContext<ClassContextType | null>(null)

export function ClassProvider({ children }: { children: ReactNode }) {
  const { effectiveActiveOrganizationId, loading: orgLoading } = useOrganization()
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orgLoading) return

    let alive = true

    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('current_class_id, classes:current_class_id(*, organizations(*))')
        .eq('id', user.id)
        .single()

      const profileRecord = profile as Record<string, unknown> | null
      const resolution = resolveClassTenantRow(
        effectiveActiveOrganizationId,
        profileRecord?.classes,
      )

      if (resolution.kind === 'no-active-org') {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      if (resolution.kind === 'use-current-class') {
        if (alive) {
          setCurrentClass(resolution.classRow as unknown as Class)
          setOrganization(mapOrganizationRow(resolution.organizationRow))
        }
      } else {
        const { data: orgRow } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', resolution.organizationId)
          .maybeSingle()

        if (alive) {
          setCurrentClass(null)
          setOrganization(mapOrganizationRow(orgRow))
        }
      }

      if (alive) setLoading(false)
    }

    load().catch(() => {
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [orgLoading, effectiveActiveOrganizationId])

  const combinedLoading = orgLoading || loading

  return (
    <ClassContext.Provider
      value={{ currentClass, organization, loading: combinedLoading }}
    >
      {children}
    </ClassContext.Provider>
  )
}
