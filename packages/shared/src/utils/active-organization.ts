/**
 * Resolve organization id efetivo para UI / ClassContext sem confiar só em current_organization_id truncado.
 * Ordem: preferência explícita (DB) → org da turma atual → primeira membership ativa.
 */
export function resolveActiveOrganizationId(
  membershipOrgIdsOrdered: string[],
  storedOrgId: string | null | undefined,
  currentClassOrgId: string | null | undefined,
): string | null {
  if (membershipOrgIdsOrdered.length === 0) return null
  const set = new Set(membershipOrgIdsOrdered)
  if (storedOrgId && set.has(storedOrgId)) return storedOrgId
  if (currentClassOrgId && set.has(currentClassOrgId)) return currentClassOrgId
  return membershipOrgIdsOrdered[0]
}
