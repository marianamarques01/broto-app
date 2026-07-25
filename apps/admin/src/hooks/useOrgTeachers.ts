import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type OrgTeacher = {
  userId: string
  email: string
  nome: string
}

export function useOrgTeachers(organizationId: string | undefined) {
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)

    const { data: memberships, error: memErr } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .in('role', ['teacher', 'org_admin', 'owner'])

    if (memErr) {
      console.error('[useOrgTeachers]', memErr.message)
      setTeachers([])
      setLoading(false)
      return
    }

    const userIds = (memberships ?? []).map((m) => m.user_id as string)
    if (userIds.length === 0) {
      setTeachers([])
      setLoading(false)
      return
    }

    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, email, nome')
      .in('id', userIds)

    if (userErr) {
      console.error('[useOrgTeachers]', userErr.message)
      setTeachers([])
      setLoading(false)
      return
    }

    setTeachers(
      (users ?? []).map((u) => ({
        userId: u.id as string,
        email: (u.email as string | null) ?? '',
        nome: (u.nome as string | null)?.trim() || (u.email as string),
      })),
    )
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    if (!organizationId) return

    let cancelled = false

    async function load() {
      setLoading(true)

      const { data: memberships, error: memErr } = await supabase
        .from('organization_memberships')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .in('role', ['teacher', 'org_admin', 'owner'])

      if (cancelled) return

      if (memErr) {
        console.error('[useOrgTeachers]', memErr.message)
        setTeachers([])
        setLoading(false)
        return
      }

      const userIds = (memberships ?? []).map((m) => m.user_id as string)
      if (userIds.length === 0) {
        setTeachers([])
        setLoading(false)
        return
      }

      const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id, email, nome')
        .in('id', userIds)

      if (cancelled) return

      if (userErr) {
        console.error('[useOrgTeachers]', userErr.message)
        setTeachers([])
        setLoading(false)
        return
      }

      setTeachers(
        (users ?? []).map((u) => ({
          userId: u.id as string,
          email: (u.email as string | null) ?? '',
          nome: (u.nome as string | null)?.trim() || (u.email as string),
        })),
      )
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [organizationId])

  return { teachers, loading, reload }
}
