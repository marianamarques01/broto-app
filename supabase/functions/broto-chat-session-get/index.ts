import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { parseBrotoChatSessionGetBody } from '../_shared/edge-api-types.ts'
import { chatLogTurnsToMessages } from '../_shared/chat-logs-core.ts'

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

    const { data: rows, error } = await admin
      .from('chat_logs')
      .select('question, answer, turn_index')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true })

    if (error) {
      console.error('[broto-chat-session-get] select:', error)
      return json(500, { error: 'Erro ao carregar conversa' }, cors)
    }

    if (!rows || rows.length === 0) {
      return json(404, { error: 'Conversa não encontrada' }, cors)
    }

    const messages = chatLogTurnsToMessages(rows)
    const turnCount = rows.length

    return json(200, { sessionId, messages, turnCount }, cors)
  } catch (err) {
    console.error('[broto-chat-session-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
