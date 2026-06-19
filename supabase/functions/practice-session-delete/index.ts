import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parsePracticeSessionDeleteBody } from '../_shared/edge-api-types.ts'

/**
 * Remove sessões `student_mock` do usuário.
 * - `sessionId`: exclui uma sessão (linha some; respostas ficam com session_id NULL).
 * - `deleteAll: true`: exclui todas as sessões em andamento e concluídas desse tipo.
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

    const parsed = parsePracticeSessionDeleteBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'sessionId ou deleteAll é obrigatório' }, cors)
    }
    const { sessionId, deleteAll } = parsed

    if (deleteAll && sessionId.length > 0) {
      return json(400, { error: 'Envie sessionId ou deleteAll, não ambos' }, cors)
    }
    if (!deleteAll && !sessionId) {
      return json(400, { error: 'sessionId ou deleteAll é obrigatório' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    if (deleteAll) {
      const { error: delErr, count } = await admin
        .from('practice_sessions')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
        .eq('kind', 'student_mock')

      if (delErr) {
        console.error('[practice-session-delete] deleteAll:', delErr)
        return json(500, { error: 'Erro ao limpar histórico' }, cors)
      }

      return json(200, { ok: true, deletedCount: count ?? 0 }, cors)
    }

    const { error: delErr, count } = await admin
      .from('practice_sessions')
      .delete({ count: 'exact' })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('kind', 'student_mock')

    if (delErr) {
      console.error('[practice-session-delete] delete one:', delErr)
      return json(500, { error: 'Erro ao excluir sessão' }, cors)
    }

    if (!count) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }

    return json(200, { ok: true }, cors)
  } catch (err) {
    console.error('[practice-session-delete]', err)
    return json(500, { error: String(err) }, cors)
  }
})
