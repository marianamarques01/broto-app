import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parsePracticeSessionCreateBody } from '../_shared/edge-api-types.ts'
import type { PracticeSessionInsert } from '../../database.types.ts'

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

    const parsed = parsePracticeSessionCreateBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'questionIds deve ser um array não vazio' }, cors)
    }
    const { questionIds, config: configRaw, kind: kindRaw } = parsed
    const config = configRaw ?? {}
    const kind = kindRaw ?? KIND_DEFAULT
    if (kind !== 'student_mock' && kind !== 'class_assignment') {
      return json(400, { error: 'kind inválido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const insertRow: PracticeSessionInsert = {
      user_id: user.id,
      kind,
      config,
      question_ids: questionIds,
    }

    const { data: row, error: insErr } = await admin
      .from('practice_sessions')
      .insert(insertRow)
      .select('id')
      .maybeSingle()

    if (insErr || !row) {
      console.error('[practice-session-create] insert:', insErr)
      return json(500, { error: 'Erro ao criar sessão' }, cors)
    }

    const id = row.id
    if (!id) {
      return json(500, { error: 'Sessão sem id' }, cors)
    }

    return json(200, { sessionId: id, questionIds }, cors)
  } catch (err) {
    console.error('[practice-session-create]', err)
    return json(500, { error: String(err) }, cors)
  }
})
