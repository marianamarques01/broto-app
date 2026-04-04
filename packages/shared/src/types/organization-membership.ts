import type { Organization } from './organization'

/** Membership ativo do utilizador + organização resolvida (cliente aluno/professor). */
export type OrganizationMembershipItem = {
  id: string
  organizationId: string
  role: string
  status: string
  organization: Organization
}
