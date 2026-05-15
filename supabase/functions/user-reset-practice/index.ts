import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'

/**
 * POST — Remove todo o histórico de prática da conta (user_question_answers + topic_performance).
 * XP do Broto / streak não são alterados.
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

    const admin = createServiceRoleClientUnsafe()

    const { error: delAns } = await admin
      .from('user_question_answers')
      .delete()
      .eq('user_id', user.id)
    if (delAns) {
      console.error('[user-reset-practice] user_question_answers:', delAns)
      return json(500, { error: 'Não foi possível limpar o histórico de respostas' }, cors)
    }

    const { error: delTp } = await admin.from('topic_performance').delete().eq('user_id', user.id)
    if (delTp) {
      console.error('[user-reset-practice] topic_performance:', delTp)
      return json(500, { error: 'Não foi possível zerar desempenho por tópico' }, cors)
    }

    return json(
      200,
      {
        ok: true,
      },
      cors,
    )
  } catch (err) {
    console.error('[user-reset-practice]', err)
    return json(500, { error: String(err) }, cors)
  }
})
