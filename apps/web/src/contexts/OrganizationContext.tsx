import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Organization, OrganizationMembershipItem } from '@broto/shared'
import {
  parseOrganizationMembershipRows,
  pickUserTenantIdsFromProfile,
  resolveActiveOrganizationId,
} from '@broto/shared'
import { invalidateTenantScopedCaches } from '@/lib/invalidate-tenant-caches'

type OrganizationContextType = {
  memberships: OrganizationMembershipItem[]
  storedOrganizationId: string | null
  currentClassOrganizationId: string | null
  effectiveActiveOrganizationId: string | null
  activeOrganization: Organization | null
  loading: boolean
  setActiveOrganization: (organizationId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | null>(null)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [memberships, setMemberships] = useState<OrganizationMembershipItem[]>([])
  const [storedOrganizationId, setStoredOrganizationId] = useState<string | null>(null)
  const [currentClassOrganizationId, setCurrentClassOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        setMemberships([])
        setStoredOrganizationId(null)
        setCurrentClassOrganizationId(null)
        return
      }

      const [memRes, profileRes] = await Promise.all([
        supabase
          .from('organization_memberships')
          .select('id, organization_id, role, status, organizations(*)')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('users')
          .select(
            'current_organization_id, current_class_id, classes:current_class_id(organization_id)',
          )
          .eq('id', user.id)
          .maybeSingle(),
      ])

      setMemberships(parseOrganizationMembershipRows(memRes.data ?? []))

      const { storedOrganizationId, currentClassOrganizationId } = pickUserTenantIdsFromProfile(
        profileRes.data,
      )
      setStoredOrganizationId(storedOrganizationId)
      setCurrentClassOrganizationId(currentClassOrganizationId)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function bootstrap() {
      await load()
    }

    void bootstrap()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void bootstrap()
    })
    return () => subscription.unsubscribe()
  }, [load])

  const membershipOrgIdsOrdered = useMemo(
    () => memberships.map((m) => m.organizationId),
    [memberships],
  )

  const effectiveActiveOrganizationId = useMemo(
    () =>
      resolveActiveOrganizationId(
        membershipOrgIdsOrdered,
        storedOrganizationId,
        currentClassOrganizationId,
      ),
    [membershipOrgIdsOrdered, storedOrganizationId, currentClassOrganizationId],
  )

  const activeOrganization = useMemo(() => {
    if (!effectiveActiveOrganizationId) return null
    return (
      memberships.find((m) => m.organizationId === effectiveActiveOrganizationId)?.organization ??
      null
    )
  }, [memberships, effectiveActiveOrganizationId])

  const setActiveOrganization = useCallback(
    async (organizationId: string) => {
      const allowed = memberships.some((m) => m.organizationId === organizationId)
      if (!allowed) return

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const patch: Record<string, string | null> = {
        current_organization_id: organizationId,
      }

      const { data: profile } = await supabase
        .from('users')
        .select('current_class_id')
        .eq('id', user.id)
        .maybeSingle()

      const classId = (profile as { current_class_id?: string | null } | null)?.current_class_id
      if (classId) {
        const { data: cls } = await supabase
          .from('classes')
          .select('organization_id')
          .eq('id', classId)
          .maybeSingle()
        const clsOrg = (cls as { organization_id?: string } | null)?.organization_id
        if (clsOrg && clsOrg !== organizationId) {
          patch.current_class_id = null
        }
      }

      await supabase.from('users').update(patch).eq('id', user.id)
      await load()
      invalidateTenantScopedCaches()
    },
    [memberships, load],
  )

  const value = useMemo(
    () => ({
      memberships,
      storedOrganizationId,
      currentClassOrganizationId,
      effectiveActiveOrganizationId,
      activeOrganization,
      loading,
      setActiveOrganization,
      refreshOrganizations: load,
    }),
    [
      memberships,
      storedOrganizationId,
      currentClassOrganizationId,
      effectiveActiveOrganizationId,
      activeOrganization,
      loading,
      setActiveOrganization,
      load,
    ],
  )

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}

export function useOrganization(): OrganizationContextType {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider')
  return ctx
}
