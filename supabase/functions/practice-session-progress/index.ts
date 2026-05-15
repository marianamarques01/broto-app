import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'PATCH' && req.method !== 'POST') {
      return json(405, { error: 'Method not allowed' }, cors)
    }

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const sessionId = typeof raw?.sessionId === 'string' ? raw.sessionId.trim() : ''
    const progressRaw = raw?.progress

    if (!sessionId) {
      return json(400, { error: 'sessionId é obrigatório' }, cors)
    }
    if (
      progressRaw === null ||
      progressRaw === undefined ||
      typeof progressRaw !== 'object' ||
      Array.isArray(progressRaw)
    ) {
      return json(400, { error: 'progress deve ser um objeto JSON' }, cors)
    }

    const p = progressRaw as Record<string, unknown>
    const currentIndexRaw = p.currentIndex
    const skippedRaw = p.skippedQuestionIds

    if (
      typeof currentIndexRaw !== 'number' ||
      !Number.isFinite(currentIndexRaw) ||
      currentIndexRaw < 0
    ) {
      return json(400, { error: 'progress.currentIndex inválido' }, cors)
    }
    const currentIndex = Math.floor(currentIndexRaw)

    let skippedQuestionIds: string[] = []
    if (skippedRaw !== undefined && skippedRaw !== null) {
      if (!isStringArray(skippedRaw)) {
        return json(400, { error: 'progress.skippedQuestionIds deve ser string[]' }, cors)
      }
      skippedQuestionIds = skippedRaw.map((s) => s.trim()).filter(Boolean)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: row, error: selErr } = await admin
      .from('practice_sessions')
      .select('id, user_id, completed_at, question_ids')
      .eq('id', sessionId)
      .maybeSingle()

    if (selErr) {
      console.error('[practice-session-progress] select:', selErr)
      return json(500, { error: 'Erro ao carregar sessão' }, cors)
    }
    if (!row) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }

    const r = row as { user_id?: string; completed_at?: string | null; question_ids?: unknown }
    if (r.user_id !== user.id) {
      return json(403, { error: 'Sessão de outro usuário' }, cors)
    }
    if (r.completed_at) {
      return json(400, { error: 'Sessão já concluída' }, cors)
    }

    const qids = Array.isArray(r.question_ids) ? r.question_ids.map(String) : []
    const allowed = new Set(qids)
    if (currentIndex >= qids.length) {
      return json(400, { error: 'progress.currentIndex fora do intervalo' }, cors)
    }
    for (const sid of skippedQuestionIds) {
      if (!allowed.has(sid)) {
        return json(400, { error: 'Questão pulada não pertence à sessão' }, cors)
      }
    }

    const progressPayload = { currentIndex, skippedQuestionIds }

    const { error: upErr } = await admin
      .from('practice_sessions')
      .update({ progress: progressPayload })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (upErr) {
      console.error('[practice-session-progress] update:', upErr)
      return json(500, { error: 'Erro ao salvar progresso' }, cors)
    }

    return json(200, { ok: true, progress: progressPayload }, cors)
  } catch (err) {
    console.error('[practice-session-progress]', err)
    return json(500, { error: String(err) }, cors)
  }
})
