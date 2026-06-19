// supabase/functions/_shared/authz.ts
// Shared authorization helpers for multi-tenant edge functions.
// PR-04: introduce helpers without altering existing endpoint behavior.
// Uses Deno-compatible ESM imports only — no Node.js modules.
//
// SECURITY PRINCIPLES:
// - Fail closed: unknown roles, missing data, or unexpected state → deny access
// - Never trust DB values blindly: validate role strings against known set
// - service_role client bypasses RLS — callers MUST validate authorization first

import {
  createTypedAnonClient,
  createTypedServiceRoleClient,
  type TypedSupabaseClient,
} from './database.ts'
import type { ClassesRow, OrganizationMembershipRow, UsersRow } from '../../database.types.ts'

// ---- Types ----

/** Supabase Auth user (subset of fields used in authz). */
interface AuthUser {
  id: string
  email?: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
}

/** Known membership roles ordered by privilege level (lowest to highest). */
const VALID_ROLES = ['student', 'teacher', 'org_admin', 'owner'] as const
type MembershipRole = (typeof VALID_ROLES)[number]

/** Active membership row from organization_memberships. */
interface Membership {
  id: string
  user_id: string
  organization_id: string
  role: MembershipRole
  status: 'active'
  joined_at: string | null
}

/** Resolved active context for a user. */
interface ActiveContext {
  userId: string
  organizationId: string | null
  classId: string | null
  membership: Membership | null
  /** Explicit validity flag — false when state is inconsistent (e.g., org set but no membership, class in wrong org). */
  isValid: boolean
}

/** Result shape for authz helpers — either success data or an error to return. */
type AuthzResult<T> =
  | { data: T; error: null }
  | { data: null; error: { status: number; message: string } }

// ---- Role hierarchy ----

const ROLE_RANK: Record<MembershipRole, number> = {
  student: 0,
  teacher: 1,
  org_admin: 2,
  owner: 3,
}

/** Returns true only if `value` is a known, valid MembershipRole. */
function isValidRole(value: unknown): value is MembershipRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as MembershipRole)
}

/** Fail-closed role comparison: unknown roles always fail. */
function meetsMinRole(actual: string, minimum: MembershipRole): boolean {
  if (!isValidRole(actual)) return false
  return ROLE_RANK[actual] >= ROLE_RANK[minimum]
}

// ---- Helpers ----

/**
 * WARNING: Creates a Supabase client with the service_role key.
 * This client BYPASSES all RLS policies — every query runs as superuser.
 *
 * NEVER use this client to return data without first validating the user's
 * authorization via requireUser + requireMembership/requireClassAccess.
 *
 * Named "Unsafe" intentionally to force callers to acknowledge the risk.
 */
export function createServiceRoleClientUnsafe(): TypedSupabaseClient {
  return createTypedServiceRoleClient()
}

/**
 * Validates the Authorization header and returns the authenticated user.
 * Uses the ANON key + user JWT to create a request-scoped client —
 * this client respects RLS and sees only what the user is allowed to see.
 *
 * This helper NEVER uses the service_role key.
 *
 * Failure modes (all return 401):
 * - Missing Authorization header
 * - Invalid/expired JWT
 * - User not found in auth.users
 */
export async function requireUser(
  req: Request,
): Promise<AuthzResult<{ user: AuthUser; supabaseAuthed: TypedSupabaseClient }>> {
  const authHeader = req.headers.get('Authorization')?.trim()

  // Reject missing / malformed header — never treat "Bearer <anon_key>" as a user JWT (see api-clients).
  if (!authHeader || !/^Bearer\s+\S+/i.test(authHeader)) {
    return { data: null, error: { status: 401, message: 'Authorization header required' } }
  }

  /**
   * Use the same pattern as Supabase Edge examples: pass the full `Authorization` value on the
   * client and call `getUser()` with no args. `getUser(jwt)` with a raw string is brittle in Deno
   * (false 401s → web api-client signs the user out on every action).
   */
  const supabaseAuthed = createTypedAnonClient(authHeader)

  const {
    data: { user },
    error: authError,
  } = await supabaseAuthed.auth.getUser()

  if (authError || !user) {
    return { data: null, error: { status: 401, message: 'Unauthorized' } }
  }

  return { data: { user: user as AuthUser, supabaseAuthed }, error: null }
}

/**
 * Verifies the user has an ACTIVE membership in the given organization.
 * Optionally requires a minimum role level.
 *
 * Security guarantees:
 * - Only considers memberships with status = 'active' (never inactive/removed/invited)
 * - Validates the role value from the DB against the known role set — unknown roles
 *   are treated as invalid and result in access denial (fail closed)
 * - Role hierarchy: student (0) < teacher (1) < org_admin (2) < owner (3)
 *
 * @param adminClient - Supabase client with service_role key (caller must have validated user first)
 * @param userId - Authenticated user ID (from requireUser)
 * @param organizationId - Organization to check membership in
 * @param minRole - Optional minimum role required
 */
export async function requireMembership(
  adminClient: TypedSupabaseClient,
  userId: string,
  organizationId: string,
  minRole?: MembershipRole,
): Promise<AuthzResult<{ membership: Membership }>> {
  const { data, error } = await adminClient
    .from('organization_memberships')
    .select('id, user_id, organization_id, role, status, joined_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('[authz] requireMembership query error:', error)
    return { data: null, error: { status: 500, message: 'Erro ao verificar membership' } }
  }

  if (!data) {
    return {
      data: null,
      error: { status: 403, message: 'Usuário não é membro desta organização' },
    }
  }

  const row = data as OrganizationMembershipRow

  // Fail closed: if the DB contains a role value we don't recognize, deny access
  if (!isValidRole(row.role)) {
    console.error('[authz] unknown role value in DB:', row.role, 'for user:', userId)
    return {
      data: null,
      error: { status: 403, message: 'Role inválida — acesso negado' },
    }
  }

  const membership: Membership = {
    id: row.id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    role: row.role as MembershipRole,
    status: 'active',
    joined_at: row.joined_at ?? null,
  }

  if (minRole && !meetsMinRole(membership.role, minRole)) {
    return {
      data: null,
      error: {
        status: 403,
        message: `Permissão insuficiente: requer ${minRole}, possui ${membership.role}`,
      },
    }
  }

  return { data: { membership }, error: null }
}

/**
 * Verifies the user has access to a specific class via organization membership.
 *
 * Chain: classId → class.organization_id → requireMembership(userId, org, minRole)
 *
 * Guarantees:
 * - Class exists in the DB
 * - Class has an organization_id (FK constraint, but we check anyway)
 * - User has active membership in that SAME organization
 * - If minRole is set, user's role meets the minimum
 *
 * Note: This performs 2 queries (class lookup + membership check).
 * A single JOIN query could optimize this, but the current approach
 * is clearer and reuses requireMembership's validation logic.
 *
 * @param adminClient - Supabase client with service_role key
 * @param userId - Authenticated user ID (from requireUser)
 * @param classId - Class to check access for
 * @param minRole - Optional minimum role in the class's organization
 */
export async function requireClassAccess(
  adminClient: TypedSupabaseClient,
  userId: string,
  classId: string,
  minRole?: MembershipRole,
): Promise<
  AuthzResult<{
    classData: { id: string; organization_id: string; name: string; is_active: boolean }
    membership: Membership
  }>
> {
  const { data: classRow, error: classError } = await adminClient
    .from('classes')
    .select('id, organization_id, name, is_active')
    .eq('id', classId)
    .maybeSingle()

  if (classError) {
    console.error('[authz] requireClassAccess class query error:', classError)
    return { data: null, error: { status: 500, message: 'Erro ao buscar turma' } }
  }

  if (!classRow) {
    return { data: null, error: { status: 404, message: 'Turma não encontrada' } }
  }

  const classData = classRow as ClassesRow

  // Fail closed: class without organization_id should not grant access
  if (!classData.organization_id) {
    console.error('[authz] class has no organization_id:', classId)
    return { data: null, error: { status: 500, message: 'Turma sem organização associada' } }
  }

  // Membership check in the SAME organization as the class
  const membershipResult = await requireMembership(
    adminClient,
    userId,
    classData.organization_id,
    minRole,
  )

  if (membershipResult.error) {
    return membershipResult as AuthzResult<never>
  }

  return {
    data: { classData, membership: membershipResult.data!.membership },
    error: null,
  }
}

/**
 * Resolves the user's active context: current organization, current class,
 * and validates consistency (class belongs to the active organization).
 *
 * The `isValid` flag makes state quality explicit:
 * - true: org + membership confirmed, class (if set) belongs to the org
 * - false: inconsistent state detected — caller should NOT trust classId/membership
 *
 * Inconsistent states (isValid = false):
 * - current_organization_id set but no active membership
 * - current_class_id points to a class in a different organization
 *
 * Valid edge case (isValid = true, organizationId = null):
 * - User has no active organization (new user, ENEM26-only)
 *
 * @param adminClient - Supabase client with service_role key
 * @param userId - Authenticated user ID (from requireUser)
 */
export async function resolveActiveContext(
  adminClient: TypedSupabaseClient,
  userId: string,
): Promise<AuthzResult<ActiveContext>> {
  const { data: userRow, error: userError } = await adminClient
    .from('users')
    .select('current_organization_id, current_class_id')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('[authz] resolveActiveContext user query error:', userError)
    return { data: null, error: { status: 500, message: 'Erro ao buscar contexto do usuário' } }
  }

  if (!userRow) {
    return { data: null, error: { status: 404, message: 'Usuário não encontrado' } }
  }

  const row = userRow as Pick<UsersRow, 'current_organization_id' | 'current_class_id'>
  const organizationId = row.current_organization_id ?? null
  const classId = row.current_class_id ?? null

  // No active organization — valid state (e.g., new user, ENEM26 only)
  if (!organizationId) {
    return {
      data: { userId, organizationId: null, classId, membership: null, isValid: true },
      error: null,
    }
  }

  // Verify membership in active organization
  const membershipResult = await requireMembership(adminClient, userId, organizationId)
  if (membershipResult.error) {
    // current_organization_id set but no active membership — INCONSISTENT
    return {
      data: { userId, organizationId, classId, membership: null, isValid: false },
      error: null,
    }
  }

  const membership = membershipResult.data!.membership

  // If there's a class, validate it belongs to the active organization
  if (classId) {
    const { data: classRow } = await adminClient
      .from('classes')
      .select('organization_id')
      .eq('id', classId)
      .maybeSingle()

    if (!classRow) {
      // Class referenced but not found in DB — INCONSISTENT
      return {
        data: { userId, organizationId, classId: null, membership, isValid: false },
        error: null,
      }
    }

    if ((classRow as Pick<ClassesRow, 'organization_id'>).organization_id !== organizationId) {
      // Class belongs to different org — INCONSISTENT
      return {
        data: { userId, organizationId, classId: null, membership, isValid: false },
        error: null,
      }
    }
  }

  return {
    data: { userId, organizationId, classId, membership, isValid: true },
    error: null,
  }
}

export type { AuthUser, Membership, MembershipRole, ActiveContext, AuthzResult }
