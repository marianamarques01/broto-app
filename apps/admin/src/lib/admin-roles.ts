import type { AdminProfile } from '@broto/shared'

/** Org rede demo — broto_admin usa para painel /rede quando membership está na escola. */
export const BROTO_DEMO_NETWORK_ORG_ID = 'b0e00000-0000-4000-8000-000000000100'

export const STAFF_MEMBERSHIP_ROLES = [
  'teacher',
  'org_admin',
  'owner',
  'network_admin',
  'broto_admin',
] as const

export function isBrotoAdminRole(role: AdminProfile['role'] | undefined): boolean {
  return role === 'broto_admin'
}

export function isOrgAdminRole(role: AdminProfile['role'] | undefined): boolean {
  return role === 'owner' || role === 'org_admin' || isBrotoAdminRole(role)
}

export function isNetworkAdminRole(role: AdminProfile['role'] | undefined): boolean {
  return role === 'network_admin' || isBrotoAdminRole(role)
}

export function canAccessTeacherScreens(role: AdminProfile['role'] | undefined): boolean {
  return role === 'teacher' || isBrotoAdminRole(role) || role === 'owner' || role === 'org_admin'
}

export function canCreateClass(role: AdminProfile['role'] | undefined): boolean {
  return isOrgAdminRole(role)
}

export function resolveNetworkOrgId(admin: AdminProfile | null | undefined): string | undefined {
  if (!admin) return undefined
  if (admin.role === 'network_admin') return admin.organization_id
  if (isBrotoAdminRole(admin.role)) return BROTO_DEMO_NETWORK_ORG_ID
  return undefined
}
