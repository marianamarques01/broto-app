import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireOrgStaffOrBrotoAdmin,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import type {
  OrgStudentsImportRequest,
  OrgStudentsImportResponse,
  OrgStudentsImportResultRow,
} from '@broto/shared/types/engagement.ts'

const MAX_ROWS = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function randomTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 24)
}

async function resolveUserId(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  email: string,
  nome: string,
): Promise<{ userId: string | null; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data: existing, error: lookupErr } = await admin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupErr) return { userId: null, error: 'Erro ao buscar usuário' }
  if (existing?.id) return { userId: existing.id as string }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: randomTempPassword(),
    email_confirm: true,
    user_metadata: { full_name: nome.trim() },
  })

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      const { data: retry } = await admin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle()
      if (retry?.id) return { userId: retry.id as string }
    }
    return { userId: null, error: createErr.message }
  }

  const userId = created.user?.id ?? null
  if (!userId) return { userId: null, error: 'Falha ao criar usuário' }

  if (nome.trim()) {
    await admin.from('users').update({ nome: nome.trim() }).eq('id', userId)
  }

  return { userId }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data

    const body = (await req.json()) as OrgStudentsImportRequest
    const { organizationId, rows } = body

    if (!organizationId || !isValidUuid(organizationId)) {
      return json(400, { error: 'organizationId inválido' }, cors)
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return json(400, { error: 'rows é obrigatório' }, cors)
    }
    if (rows.length > MAX_ROWS) {
      return json(400, { error: `Máximo de ${MAX_ROWS} linhas por importação` }, cors)
    }

    const supabaseAdmin = createServiceRoleClientUnsafe()
    const membership = await requireOrgStaffOrBrotoAdmin(
      supabaseAdmin,
      user.id,
      organizationId,
      'org_admin',
    )
    if (membership.error) {
      return json(membership.error.status, { error: membership.error.message }, cors)
    }

    const results: OrgStudentsImportResultRow[] = []
    let imported = 0
    let failed = 0

    for (let i = 0; i < rows.length; i++) {
      const line = i + 1
      const row = rows[i]!
      const email = row.email?.trim() ?? ''
      const nome = row.nome?.trim() ?? ''
      const turmaCodigo = row.turmaCodigo?.trim().toUpperCase() ?? ''

      if (!email || !EMAIL_RE.test(email)) {
        failed++
        results.push({ line, email, success: false, error: 'E-mail inválido' })
        continue
      }
      if (!nome) {
        failed++
        results.push({ line, email, success: false, error: 'Nome obrigatório' })
        continue
      }
      if (!turmaCodigo) {
        failed++
        results.push({ line, email, success: false, error: 'Código da turma obrigatório' })
        continue
      }

      const { data: cls, error: classErr } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('access_code', turmaCodigo)
        .eq('is_active', true)
        .maybeSingle()

      if (classErr || !cls) {
        failed++
        results.push({
          line,
          email,
          success: false,
          error: 'Turma não encontrada nesta organização',
        })
        continue
      }

      const resolved = await resolveUserId(supabaseAdmin, email, nome)
      if (!resolved.userId) {
        failed++
        results.push({
          line,
          email,
          success: false,
          error: resolved.error ?? 'Não foi possível criar usuário',
        })
        continue
      }

      const { error: rpcErr } = await supabaseAdmin.rpc('rpc_class_join', {
        p_user_id: resolved.userId,
        p_access_code: turmaCodigo,
      })

      if (rpcErr) {
        failed++
        results.push({ line, email, success: false, error: rpcErr.message })
        continue
      }

      imported++
      results.push({ line, email, success: true, userId: resolved.userId })
    }

    const payload: OrgStudentsImportResponse = {
      success: true,
      imported,
      failed,
      results,
    }

    return json(200, payload, cors)
  } catch (err) {
    console.error('[org-students-import]', err)
    return json(500, { error: String(err) }, cors)
  }
})
