import type { TypedSupabaseClient } from './database.ts'

type AuthzResult =
  | { data: true; error: null }
  | { data: null; error: { status: number; message: string } }

/**
 * Staff Broto autorizado para onboarding institucional.
 * - Se BROTO_ONBOARDING_STAFF_USER_IDS estiver definido, usa allowlist.
 * - Caso contrário: owner, org_admin ou broto_admin em qualquer org ativa (dev/staging).
 */
export async function requireBrotoOnboardingStaff(
  admin: TypedSupabaseClient,
  userId: string,
): Promise<AuthzResult> {
  const envIds = Deno.env.get('BROTO_ONBOARDING_STAFF_USER_IDS')?.trim()
  if (envIds) {
    const allowed = envIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (allowed.includes(userId)) {
      return { data: true, error: null }
    }
    return {
      data: null,
      error: { status: 403, message: 'Sem permissão para onboarding institucional' },
    }
  }

  const { data, error } = await admin
    .from('organization_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('role', ['owner', 'org_admin', 'broto_admin'])
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[broto-onboarding-staff] check:', error)
    return { data: null, error: { status: 500, message: 'Erro ao verificar permissões' } }
  }
  if (!data) {
    return {
      data: null,
      error: { status: 403, message: 'Sem permissão para onboarding institucional' },
    }
  }

  return { data: true, error: null }
}

/** Busca org pelo código de convite de professor em config JSONB. */
export async function findOrganizationByTeacherInviteCode(
  admin: TypedSupabaseClient,
  inviteCode: string,
): Promise<{ id: string; name: string } | null> {
  const normalized = inviteCode.trim().toUpperCase()
  if (!normalized) return null

  const { data, error } = await admin
    .from('organizations')
    .select('id, name, config')
    .filter('config->>teacher_invite_code', 'eq', normalized)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[broto-onboarding] find org by invite:', error)
    return null
  }
  if (!data?.id) return null

  return { id: data.id as string, name: data.name as string }
}
