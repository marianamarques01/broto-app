import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parseSessionIdBody } from '../_shared/edge-api-types.ts'
import type { PracticeSessionRow } from '../../database.types.ts'

/**
 * Encerra uma sessão em andamento sem concluir: remove a linha de `practice_sessions`.
 * Respostas já gravadas em `user_question_answers` ficam com session_id NULL (ON DELETE SET NULL).
 */
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

    const sessionId = parseSessionIdBody(await req.json().catch(() => null))

    if (!sessionId) {
      return json(400, { error: 'sessionId é obrigatório' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: row, error: selErr } = await admin
      .from('practice_sessions')
      .select('id, user_id, completed_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (selErr) {
      console.error('[practice-session-abandon] select:', selErr)
      return json(500, { error: 'Erro ao carregar sessão' }, cors)
    }
    if (!row) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }

    const r = row as Pick<PracticeSessionRow, 'user_id' | 'completed_at'>
    if (r.user_id !== user.id) {
      return json(403, { error: 'Sessão de outro usuário' }, cors)
    }
    if (r.completed_at) {
      return json(400, { error: 'Sessão já concluída' }, cors)
    }

    const { error: delErr } = await admin
      .from('practice_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (delErr) {
      console.error('[practice-session-abandon] delete:', delErr)
      return json(500, { error: 'Erro ao descartar sessão' }, cors)
    }

    return json(200, { ok: true }, cors)
  } catch (err) {
    console.error('[practice-session-abandon]', err)
    return json(500, { error: String(err) }, cors)
  }
})
