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
    const summary = raw?.summary

    if (!sessionId) {
      return json(400, { error: 'sessionId é obrigatório' }, cors)
    }
    if (
      summary !== null &&
      summary !== undefined &&
      (typeof summary !== 'object' || Array.isArray(summary))
    ) {
      return json(400, { error: 'summary deve ser um objeto JSON' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: existing, error: selErr } = await admin
      .from('practice_sessions')
      .select('id, user_id, completed_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (selErr) {
      console.error('[practice-session-complete] select:', selErr)
      return json(500, { error: 'Erro ao carregar sessão' }, cors)
    }
    if (!existing) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }
    if ((existing as { user_id?: string }).user_id !== user.id) {
      return json(403, { error: 'Sessão de outro usuário' }, cors)
    }

    const patch: Record<string, unknown> = {
      summary: summary ?? null,
      completed_at: new Date().toISOString(),
    }

    const { error: upErr } = await admin.from('practice_sessions').update(patch).eq('id', sessionId)

    if (upErr) {
      console.error('[practice-session-complete] update:', upErr)
      return json(500, { error: 'Erro ao concluir sessão' }, cors)
    }

    return json(200, { success: true }, cors)
  } catch (err) {
    console.error('[practice-session-complete]', err)
    return json(500, { error: String(err) }, cors)
  }
})
