import type { TypedSupabaseClient } from './database.ts'

type AuthzResult =
  | { data: true; error: null }
  | { data: null; error: { status: number; message: string } }

/**
 * Staff Broto autorizado para calibração humana.
 * - Se BROTO_CALIBRATION_STAFF_USER_IDS estiver definido, usa allowlist.
 * - Caso contrário: owner ou org_admin em qualquer org ativa.
 */
export async function requireRedacaoCalibrationStaff(
  admin: TypedSupabaseClient,
  userId: string,
): Promise<AuthzResult> {
  const envIds = Deno.env.get('BROTO_CALIBRATION_STAFF_USER_IDS')?.trim()
  if (envIds) {
    const allowed = envIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (allowed.includes(userId)) {
      return { data: true, error: null }
    }
    return { data: null, error: { status: 403, message: 'Sem permissão para calibração' } }
  }

  const { data, error } = await admin
    .from('organization_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('role', ['owner', 'org_admin'])
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[redacao-calibracao] staff check:', error)
    return { data: null, error: { status: 500, message: 'Erro ao verificar permissões' } }
  }
  if (!data) {
    return { data: null, error: { status: 403, message: 'Sem permissão para calibração' } }
  }

  return { data: true, error: null }
}
