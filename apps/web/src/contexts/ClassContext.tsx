import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
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
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) { if (alive) setLoading(false); return }

      const { data: profile } = await supabase
        .from('users')
        .select('current_class_id')
        .eq('id', user.id)
        .single()

      const classId = (profile as { current_class_id?: string } | null)?.current_class_id
      if (!classId) { if (alive) setLoading(false); return }

      const { data: classData } = await supabase
        .from('classes')
        .select('*, organizations(*)')
        .eq('id', classId)
        .single()

      if (alive && classData) {
        setCurrentClass(classData as unknown as Class)
        setOrganization((classData as Record<string, unknown>).organizations as Organization ?? null)
      }

      if (alive) setLoading(false)
    }

    load().catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <ClassContext.Provider value={{ currentClass, organization, loading }}>
      {children}
    </ClassContext.Provider>
  )
}
