import { createContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Class, Organization } from '@broto/shared'

type ClassContextType = {
  currentClass: Class | null
  organization: Organization | null
  loading: boolean
}

export const ClassContext = createContext<ClassContextType | null>(null)

export function ClassProvider({ children }: { children: ReactNode }) {
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        if (alive) setLoading(false)
        return
      }

      // Single query: get user's class + organization via join
      const { data: profile } = await supabase
        .from('users')
        .select('current_class_id, classes:current_class_id(*, organizations(*))')
        .eq('id', user.id)
        .single()

      const classRow = (profile as Record<string, unknown> | null)?.classes as Record<
        string,
        unknown
      > | null

      if (alive && classRow) {
        setCurrentClass(classRow as unknown as Class)
        setOrganization((classRow.organizations as Organization) ?? null)
      }

      if (alive) setLoading(false)
    }

    load().catch(() => {
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [])

  return (
    <ClassContext.Provider value={{ currentClass, organization, loading }}>
      {children}
    </ClassContext.Provider>
  )
}
