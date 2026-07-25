import { useMemo } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const envIds = import.meta.env.VITE_BROTO_ONBOARDING_STAFF_USER_IDS as string | undefined

/**
 * Verifica se o usuário logado pode operar o onboarding institucional (equipe Broto).
 * - Com allowlist no env: só IDs listados.
 * - Sem env: owner/org_admin/broto_admin (espelha fallback da edge function).
 */
export function useBrotoOnboardingStaff(): { allowed: boolean; loading: boolean } {
  const { admin, loading: authLoading, isOrgAdmin } = useAdminAuth()

  const allowed = useMemo(() => {
    if (authLoading || !admin) return false

    const trimmed = envIds?.trim()
    if (trimmed) {
      const ids = trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return ids.includes(admin.id)
    }

    return isOrgAdmin
  }, [admin, authLoading, isOrgAdmin])

  return { allowed, loading: authLoading }
}
