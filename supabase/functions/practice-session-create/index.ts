import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'

const KIND_DEFAULT = 'student_mock'

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
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const questionIdsRaw = raw?.questionIds
    const configRaw = raw?.config
    const kindRaw = raw?.kind

    if (!Array.isArray(questionIdsRaw) || questionIdsRaw.length === 0) {
      return json(400, { error: 'questionIds deve ser um array não vazio' }, cors)
    }
    const questionIds = questionIdsRaw
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
    if (questionIds.length === 0) {
      return json(400, { error: 'Nenhum questionId válido' }, cors)
    }

    const config =
      configRaw !== null && typeof configRaw === 'object' && !Array.isArray(configRaw)
        ? (configRaw as Record<string, unknown>)
        : {}

    const kind = typeof kindRaw === 'string' && kindRaw.trim() ? kindRaw.trim() : KIND_DEFAULT
    if (kind !== 'student_mock' && kind !== 'class_assignment') {
      return json(400, { error: 'kind inválido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: row, error: insErr } = await admin
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        kind,
        config,
        question_ids: questionIds,
      } as Record<string, unknown>)
      .select('id')
      .maybeSingle()

    if (insErr || !row) {
      console.error('[practice-session-create] insert:', insErr)
      return json(500, { error: 'Erro ao criar sessão' }, cors)
    }

    const id = (row as { id?: string }).id
    if (!id) {
      return json(500, { error: 'Sessão sem id' }, cors)
    }

    return json(200, { sessionId: id, questionIds }, cors)
  } catch (err) {
    console.error('[practice-session-create]', err)
    return json(500, { error: String(err) }, cors)
  }
})
