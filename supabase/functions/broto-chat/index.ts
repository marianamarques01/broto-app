import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  parseBrotoChatBody,
  parseNotebookLmChatResponse,
} from '../_shared/edge-api-types.ts'

const SERVICE_URL = Deno.env.get('NOTEBOOKLM_SERVICE_URL')!
const SERVICE_SECRET =
  Deno.env.get('SERVICE_SECRET') ?? Deno.env.get('NOTEBOOKLM_INTERNAL_SECRET') ?? ''

const MAX_MESSAGE_LENGTH = 4000
const MAX_MESSAGES = 50

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authHeader = req.headers.get('Authorization') ?? ''

    const supabaseAuthed = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser()
    if (authError || !user) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const messages = parseBrotoChatBody(await req.json().catch(() => null))
    if (!messages) {
      return json(400, { error: 'messages é obrigatório' }, cors)
    }

    if (messages.length > MAX_MESSAGES) {
      return json(400, { error: `Máximo de ${MAX_MESSAGES} mensagens por requisição` }, cors)
    }

    for (const m of messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
        return json(400, { error: 'messages inválido' }, cors)
      }
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        return json(
          400,
          { error: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` },
          cors,
        )
      }
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) {
      return json(400, { error: 'Nenhuma mensagem do usuário encontrada' }, cors)
    }

    // Get user's current class
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from('users')
      .select('current_class_id')
      .eq('id', user.id)
      .single()

    if (userRowError) return json(500, { error: 'Erro ao buscar turma do usuario' }, cors)

    const classId =
      (userRow as { current_class_id?: string | null } | null)?.current_class_id ?? null
    if (!classId) return json(400, { error: 'Usuario sem turma ativa' }, cors)

    // Verify enrollment — user must be enrolled in the class
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (enrollError || !enrollment) {
      return json(403, { error: 'Usuário não matriculado nesta turma' }, cors)
    }

    // Proxy to Python service
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 55_000)
    let chatRes: Response
    try {
      chatRes = await fetch(`${SERVICE_URL}/notebook/chat`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
          ...(SERVICE_SECRET ? { Authorization: `Bearer ${SERVICE_SECRET}` } : {}),
        },
        body: JSON.stringify({
          class_id: classId,
          question: lastUserMsg.content,
          user_id: user.id,
        }),
      })
    } finally {
      clearTimeout(timer)
    }

    if (!chatRes.ok) {
      const errBody = await chatRes.text().catch(() => '')
      return json(502, { error: 'Erro no servico do Broto', details: errBody || undefined }, cors)
    }

    const chatJson = parseNotebookLmChatResponse(await chatRes.json().catch(() => null))
    const message = chatJson?.answer.trim() ?? ''

    if (!message) return json(502, { error: 'Resposta vazia do servico' }, cors)

    return json(200, { message }, cors)
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
