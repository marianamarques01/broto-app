import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'

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
    const sessionId = typeof raw?.sessionId === 'string' ? raw.sessionId.trim() : ''

    if (!sessionId) {
      return json(400, { error: 'sessionId é obrigatório' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: row, error } = await admin
      .from('practice_sessions')
      .select('id, user_id, created_at, completed_at, kind, config, question_ids, summary')
      .eq('id', sessionId)
      .maybeSingle()

    if (error) {
      console.error('[practice-session-get] select:', error)
      return json(500, { error: 'Erro ao carregar sessão' }, cors)
    }
    if (!row) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }
    if ((row as { user_id?: string }).user_id !== user.id) {
      return json(403, { error: 'Sessão de outro usuário' }, cors)
    }

    const r = row as {
      id: string
      created_at: string
      completed_at: string | null
      kind: string
      config: unknown
      question_ids: unknown
      summary: unknown
    }

    return json(
      200,
      {
        sessionId: r.id,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        kind: r.kind,
        config: r.config,
        questionIds: Array.isArray(r.question_ids) ? r.question_ids : [],
        summary: r.summary,
      },
      cors,
    )
  } catch (err) {
    console.error('[practice-session-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
