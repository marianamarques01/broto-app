import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { parseBrotoChatSessionsListBody } from '../_shared/edge-api-types.ts'
import { groupChatLogSessions } from '../_shared/chat-logs-core.ts'

const DEFAULT_LIMIT = 30
const MAX_SCAN_ROWS = 500

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

    const parsed = parseBrotoChatSessionsListBody(await req.json().catch(() => ({})))
    const { classId, limit } = parsed

    const admin = createServiceRoleClientUnsafe()

    let query = admin
      .from('chat_logs')
      .select('session_id, question, created_at, turn_index, class_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MAX_SCAN_ROWS)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('[broto-chat-sessions] select:', error)
      return json(500, { error: 'Erro ao listar conversas' }, cors)
    }

    const sessions = groupChatLogSessions(rows ?? [], limit ?? DEFAULT_LIMIT)

    return json(200, { sessions }, cors)
  } catch (err) {
    console.error('[broto-chat-sessions]', err)
    return json(500, { error: String(err) }, cors)
  }
})
