import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { parseBrotoChatSessionGetBody } from '../_shared/edge-api-types.ts'

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

    const sessionId = parseBrotoChatSessionGetBody(await req.json().catch(() => null))
    if (!sessionId) {
      return json(400, { error: 'sessionId inválido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { error: delErr, count } = await admin
      .from('chat_logs')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('session_id', sessionId)

    if (delErr) {
      console.error('[broto-chat-session-delete] delete:', delErr)
      return json(500, { error: 'Erro ao excluir conversa' }, cors)
    }

    if (!count) {
      return json(404, { error: 'Conversa não encontrada' }, cors)
    }

    return json(200, { ok: true }, cors)
  } catch (err) {
    console.error('[broto-chat-session-delete]', err)
    return json(500, { error: String(err) }, cors)
  }
})
