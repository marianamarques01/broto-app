import { assertEquals } from 'https://deno.land/std@0.168.0/assert/mod.ts'
import type { TypedSupabaseClient } from './database.ts'
import {
  legacyUnauthorizedMessage,
  requireClassAccess,
  requireMembership,
  requireUser,
} from './authz.ts'

type RowResult = { data: unknown; error: { message: string } | null }

function mockQueryResult(result: RowResult) {
  const chain = {
    eq: (_column: string, _value: unknown) => chain,
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
  }
  return {
    select: (_columns?: string) => chain,
  }
}

function createMockAdminClient(handlers: Record<string, RowResult>): TypedSupabaseClient {
  return {
    from: (table: string) => mockQueryResult(handlers[table] ?? { data: null, error: null }),
  } as unknown as TypedSupabaseClient
}

const activeMembership = {
  id: 'mem-1',
  user_id: 'user-1',
  organization_id: 'org-1',
  role: 'teacher',
  status: 'active',
  joined_at: '2026-01-01T00:00:00Z',
}

const activeClass = {
  id: 'class-1',
  organization_id: 'org-1',
  name: 'Turma A',
  is_active: true,
}

Deno.test('requireUser: header ausente → 401', async () => {
  const req = new Request('https://example.com', { method: 'POST' })
  const result = await requireUser(req)
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 401)
  assertEquals(result.error?.message, 'Authorization header required')
})

Deno.test('requireUser: Bearer malformado → 401', async () => {
  const cases = ['Bearer', 'Bearer ', 'Basic abc', 'Token xyz']
  for (const authorization of cases) {
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: { Authorization: authorization },
    })
    const result = await requireUser(req)
    assertEquals(result.data, null, authorization)
    assertEquals(result.error?.status, 401, authorization)
    assertEquals(result.error?.message, 'Authorization header required', authorization)
  }
})

Deno.test('legacyUnauthorizedMessage: preserva Unauthorized legado', () => {
  assertEquals(legacyUnauthorizedMessage('Authorization header required'), 'Unauthorized')
  assertEquals(legacyUnauthorizedMessage('Unauthorized'), 'Unauthorized')
  assertEquals(legacyUnauthorizedMessage('Usuário não encontrado'), 'Usuário não encontrado')
})

Deno.test('requireMembership: sem membership ativa → 403', async () => {
  const admin = createMockAdminClient({
    organization_memberships: { data: null, error: null },
  })
  const result = await requireMembership(admin, 'user-1', 'org-1')
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 403)
  assertEquals(result.error?.message, 'Usuário não é membro desta organização')
})

Deno.test('requireMembership: role desconhecida → fail closed 403', async () => {
  const admin = createMockAdminClient({
    organization_memberships: {
      data: { ...activeMembership, role: 'superadmin' },
      error: null,
    },
  })
  const result = await requireMembership(admin, 'user-1', 'org-1')
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 403)
  assertEquals(result.error?.message, 'Role inválida — acesso negado')
})

Deno.test('requireMembership: role insuficiente → 403', async () => {
  const admin = createMockAdminClient({
    organization_memberships: {
      data: { ...activeMembership, role: 'student' },
      error: null,
    },
  })
  const result = await requireMembership(admin, 'user-1', 'org-1', 'teacher')
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 403)
  assertEquals(result.error?.message, 'Permissão insuficiente: requer teacher, possui student')
})

Deno.test('requireMembership: membership válida → ok', async () => {
  const admin = createMockAdminClient({
    organization_memberships: { data: activeMembership, error: null },
  })
  const result = await requireMembership(admin, 'user-1', 'org-1', 'teacher')
  assertEquals(result.error, null)
  assertEquals(result.data?.membership.role, 'teacher')
})

Deno.test('requireClassAccess: turma inexistente → 404', async () => {
  const admin = createMockAdminClient({
    classes: { data: null, error: null },
  })
  const result = await requireClassAccess(admin, 'user-1', 'class-1')
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 404)
  assertEquals(result.error?.message, 'Turma não encontrada')
})

Deno.test('requireClassAccess: usuário fora da org → 403', async () => {
  const admin = createMockAdminClient({
    classes: { data: activeClass, error: null },
    organization_memberships: { data: null, error: null },
  })
  const result = await requireClassAccess(admin, 'user-1', 'class-1', 'teacher')
  assertEquals(result.data, null)
  assertEquals(result.error?.status, 403)
  assertEquals(result.error?.message, 'Usuário não é membro desta organização')
})

Deno.test('requireClassAccess: acesso válido → ok', async () => {
  const admin = createMockAdminClient({
    classes: { data: activeClass, error: null },
    organization_memberships: { data: activeMembership, error: null },
  })
  const result = await requireClassAccess(admin, 'user-1', 'class-1', 'teacher')
  assertEquals(result.error, null)
  assertEquals(result.data?.classData.id, 'class-1')
  assertEquals(result.data?.membership.organization_id, 'org-1')
})
