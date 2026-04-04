import type { Organization } from '../types/organization'
import type { OrganizationMembershipItem } from '../types/organization-membership'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

/** Mapeia uma linha `organizations` (PostgREST) para o tipo de domínio. */
export function mapOrganizationRow(row: unknown): Organization | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null
  const cfg = row.config
  return {
    id: row.id,
    name: typeof row.name === 'string' ? row.name : '',
    slug: typeof row.slug === 'string' ? row.slug : '',
    logo_url: (row.logo_url as string | null | undefined) ?? null,
    is_public: Boolean(row.is_public),
    owner_id: (row.owner_id as string | null | undefined) ?? null,
    config: (isRecord(cfg) ? cfg : {}) as Organization['config'],
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
  }
}

/** Parse do resultado de `organization_memberships` com join `organizations(*)`. */
export function parseOrganizationMembershipRows(rows: unknown): OrganizationMembershipItem[] {
  if (!Array.isArray(rows)) return []
  const out: OrganizationMembershipItem[] = []
  for (const raw of rows) {
    if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.organization_id !== 'string') {
      continue
    }
    const org = mapOrganizationRow(raw.organizations)
    if (!org) continue
    out.push({
      id: raw.id,
      organizationId: raw.organization_id,
      role: typeof raw.role === 'string' ? raw.role : 'student',
      status: typeof raw.status === 'string' ? raw.status : 'active',
      organization: org,
    })
  }
  return out
}

/** Extrai org guardada e org inferida da turma atual a partir do row `users` (com embed opcional). */
export function pickUserTenantIdsFromProfile(profile: unknown): {
  storedOrganizationId: string | null
  currentClassOrganizationId: string | null
} {
  if (!isRecord(profile)) {
    return { storedOrganizationId: null, currentClassOrganizationId: null }
  }
  const stored =
    typeof profile.current_organization_id === 'string' ? profile.current_organization_id : null
  const cls = profile.classes
  let currentClassOrganizationId: string | null = null
  if (isRecord(cls) && typeof cls.organization_id === 'string') {
    currentClassOrganizationId = cls.organization_id
  }
  return { storedOrganizationId: stored, currentClassOrganizationId }
}

export type ClassTenantResolution =
  | { kind: 'no-active-org' }
  | { kind: 'use-current-class'; classRow: UnknownRecord; organizationRow: UnknownRecord }
  | { kind: 'org-only'; organizationId: string }

/**
 * Decide se a turma embutida em `users.classes` pertence à organização ativa efetiva.
 * Caso contrário, o cliente deve carregar só a organização ativa e limpar turma desalinhada.
 */
export function resolveClassTenantRow(
  effectiveActiveOrganizationId: string | null,
  profileClasses: unknown,
): ClassTenantResolution {
  if (!effectiveActiveOrganizationId) {
    return { kind: 'no-active-org' }
  }
  const classRow = isRecord(profileClasses) ? profileClasses : null
  const orgFromClass =
    classRow && isRecord(classRow.organizations) ? classRow.organizations : null
  if (
    classRow &&
    orgFromClass &&
    orgFromClass.id !== undefined &&
    orgFromClass.id !== null &&
    String(orgFromClass.id) === effectiveActiveOrganizationId
  ) {
    return { kind: 'use-current-class', classRow, organizationRow: orgFromClass }
  }
  return { kind: 'org-only', organizationId: effectiveActiveOrganizationId }
}
