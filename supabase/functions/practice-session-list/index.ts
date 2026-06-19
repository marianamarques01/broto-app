import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parsePracticeSessionListBody } from '../_shared/edge-api-types.ts'
import type { PracticeSessionRow } from '../../database.types.ts'

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

    const { limit } = parsePracticeSessionListBody(await req.json().catch(() => ({})))

    const admin = createServiceRoleClientUnsafe()

    const { data: rows, error } = await admin
      .from('practice_sessions')
      .select('id, created_at, completed_at, kind, question_ids, summary, config')
      .eq('user_id', user.id)
      .eq('kind', 'student_mock')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[practice-session-list] select:', error)
      return json(500, { error: 'Erro ao listar sessões' }, cors)
    }

    const sessions = (rows ?? []).map((row: PracticeSessionRow) => {
      const qids = row.question_ids
      const n = Array.isArray(qids) ? qids.length : 0
      return {
        sessionId: row.id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        summary: row.summary ?? null,
        config: row.config ?? null,
        questionCount: n,
      }
    })

    return json(200, { sessions }, cors)
  } catch (err) {
    console.error('[practice-session-list]', err)
    return json(500, { error: String(err) }, cors)
  }
})
