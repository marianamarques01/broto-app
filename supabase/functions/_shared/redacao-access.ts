import type { TypedSupabaseClient } from './database.ts'

export async function assertRedacaoAccess(
  admin: TypedSupabaseClient,
  redacaoId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { data: redacao, error } = await admin
    .from('redacoes')
    .select('id, user_id, organization_id, class_id')
    .eq('id', redacaoId)
    .maybeSingle()

  if (error) {
    console.error('[redacao-access] load:', error)
    return { ok: false, status: 500, message: 'Erro ao verificar redação' }
  }
  if (!redacao) {
    return { ok: false, status: 404, message: 'Redação não encontrada' }
  }

  if (redacao.user_id === userId) {
    return { ok: true }
  }

  const { data: staffMembership, error: staffError } = await admin
    .from('organization_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', redacao.organization_id)
    .eq('status', 'active')
    .in('role', ['teacher', 'org_admin', 'owner'])
    .maybeSingle()

  if (staffError) {
    console.error('[redacao-access] staff check:', staffError)
    return { ok: false, status: 500, message: 'Erro ao verificar permissões' }
  }

  if (staffMembership) {
    return { ok: true }
  }

  return { ok: false, status: 403, message: 'Sem permissão para acessar esta redação' }
}
