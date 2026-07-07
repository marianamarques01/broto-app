import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  requireClassAccess,
  requireMembership,
  requireUser,
} from '../_shared/authz.ts'
import { mapRepertorioRow } from '../_shared/redacao-repertorio-map.ts'
import {
  isValidUuid,
  validateCreateInput,
  validateUpdateInput,
} from '../_shared/redacao-repertorio-validation.ts'
import type { RedacaoRepertoriosInsert, RedacaoRepertoriosRow } from '../../database.types.ts'

async function resolveOrganizationForCreate(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  userId: string,
  classId: string | null | undefined,
): Promise<{ ok: true; organizationId: string } | { ok: false; status: number; message: string }> {
  if (classId) {
    const access = await requireClassAccess(admin, userId, classId, 'teacher')
    if (access.error) {
      return { ok: false, status: access.error.status, message: access.error.message }
    }
    return { ok: true, organizationId: access.data.classData.organization_id }
  }

  const { data: userRow } = await admin
    .from('users')
    .select('current_organization_id')
    .eq('id', userId)
    .maybeSingle()

  const orgId = userRow?.current_organization_id
  if (!orgId || typeof orgId !== 'string') {
    return { ok: false, status: 400, message: 'organization_id não resolvida — informe class_id' }
  }

  const membership = await requireMembership(admin, userId, orgId, 'teacher')
  if (membership.error) {
    return { ok: false, status: membership.error.status, message: membership.error.message }
  }

  return { ok: true, organizationId: orgId }
}

async function requireRepertorioStaffAccess(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  userId: string,
  repertorioId: string,
): Promise<
  { ok: true; row: RedacaoRepertoriosRow } | { ok: false; status: number; message: string }
> {
  const { data, error } = await admin
    .from('redacao_repertorios')
    .select('*')
    .eq('id', repertorioId)
    .maybeSingle()

  if (error) {
    console.error('[redacao-repertorio-manage] fetch:', error)
    return { ok: false, status: 500, message: 'Erro ao buscar repertório' }
  }
  if (!data) {
    return { ok: false, status: 404, message: 'Repertório não encontrado' }
  }

  const row = data as RedacaoRepertoriosRow
  const membership = await requireMembership(admin, userId, row.organization_id, 'teacher')
  if (membership.error) {
    return { ok: false, status: membership.error.status, message: membership.error.message }
  }

  return { ok: true, row }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      return json(405, { error: 'Method not allowed' }, cors)
    }

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data
    const admin = createServiceRoleClientUnsafe()

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const parsed = validateCreateInput(body)
      if (!parsed.ok) return json(400, { error: parsed.error }, cors)

      const orgResult = await resolveOrganizationForCreate(admin, user.id, parsed.data.class_id)
      if (!orgResult.ok) {
        return json(orgResult.status, { error: orgResult.message }, cors)
      }

      if (parsed.data.class_id) {
        const classAccess = await requireClassAccess(
          admin,
          user.id,
          parsed.data.class_id,
          'teacher',
        )
        if (classAccess.error) {
          return json(classAccess.error.status, { error: classAccess.error.message }, cors)
        }
        if (classAccess.data.classData.organization_id !== orgResult.organizationId) {
          return json(403, { error: 'Turma não pertence à organização' }, cors)
        }
      }

      const insertRow: RedacaoRepertoriosInsert = {
        organization_id: orgResult.organizationId,
        class_id: parsed.data.class_id ?? null,
        tipo: parsed.data.tipo,
        titulo: parsed.data.titulo,
        conteudo: parsed.data.conteudo,
        eixo_tematico: parsed.data.eixo_tematico ?? null,
        competencia_alvo: parsed.data.competencia_alvo ?? null,
        tags: parsed.data.tags ?? [],
        created_by: user.id,
        ativo: true,
      }

      const { data, error } = await admin
        .from('redacao_repertorios')
        .insert(insertRow)
        .select('*')
        .single()

      if (error || !data) {
        console.error('[redacao-repertorio-manage] insert:', error)
        return json(500, { error: 'Erro ao criar repertório' }, cors)
      }

      return json(
        200,
        { ok: true, repertorio: mapRepertorioRow(data as RedacaoRepertoriosRow) },
        cors,
      )
    }

    if (req.method === 'PATCH') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const parsed = validateUpdateInput(body)
      if (!parsed.ok) return json(400, { error: parsed.error }, cors)

      const access = await requireRepertorioStaffAccess(admin, user.id, parsed.data.id)
      if (!access.ok) return json(access.status, { error: access.message }, cors)

      if (parsed.data.class_id) {
        const classAccess = await requireClassAccess(
          admin,
          user.id,
          parsed.data.class_id,
          'teacher',
        )
        if (classAccess.error) {
          return json(classAccess.error.status, { error: classAccess.error.message }, cors)
        }
        if (classAccess.data.classData.organization_id !== access.row.organization_id) {
          return json(403, { error: 'Turma não pertence à organização do repertório' }, cors)
        }
      }

      const patch: Record<string, unknown> = {}
      if (parsed.data.tipo !== undefined) patch.tipo = parsed.data.tipo
      if (parsed.data.titulo !== undefined) patch.titulo = parsed.data.titulo
      if (parsed.data.conteudo !== undefined) patch.conteudo = parsed.data.conteudo
      if (parsed.data.class_id !== undefined) patch.class_id = parsed.data.class_id
      if (parsed.data.eixo_tematico !== undefined) patch.eixo_tematico = parsed.data.eixo_tematico
      if (parsed.data.competencia_alvo !== undefined) {
        patch.competencia_alvo = parsed.data.competencia_alvo
      }
      if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags
      if (parsed.data.ativo !== undefined) patch.ativo = parsed.data.ativo

      const { data, error } = await admin
        .from('redacao_repertorios')
        .update(patch)
        .eq('id', parsed.data.id)
        .select('*')
        .single()

      if (error || !data) {
        console.error('[redacao-repertorio-manage] update:', error)
        return json(500, { error: 'Erro ao atualizar repertório' }, cors)
      }

      return json(
        200,
        { ok: true, repertorio: mapRepertorioRow(data as RedacaoRepertoriosRow) },
        cors,
      )
    }

    // DELETE — desativa (soft delete)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const id = body.id
    if (!isValidUuid(id)) return json(400, { error: 'id deve ser UUID válido' }, cors)

    const access = await requireRepertorioStaffAccess(admin, user.id, id)
    if (!access.ok) return json(access.status, { error: access.message }, cors)

    const { data, error } = await admin
      .from('redacao_repertorios')
      .update({ ativo: false })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[redacao-repertorio-manage] deactivate:', error)
      return json(500, { error: 'Erro ao desativar repertório' }, cors)
    }

    return json(
      200,
      { ok: true, repertorio: mapRepertorioRow(data as RedacaoRepertoriosRow) },
      cors,
    )
  } catch (err) {
    console.error('[redacao-repertorio-manage]', err)
    return json(500, { error: String(err) }, cors)
  }
})
