import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedServiceRoleClient, type TypedSupabaseClient } from '../_shared/database.ts'
import type { UsersRow } from '../../database.types.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  parseBrotoChatBody,
  parseNotebookLmChatResponse,
  SEMANTIC_SEARCH_DEFAULT_LIMIT,
  SEMANTIC_SEARCH_DEFAULT_THRESHOLD,
} from '../_shared/edge-api-types.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireClassAccess,
  requireUser,
} from '../_shared/authz.ts'
import { createChatCompletion } from '../_shared/openai-chat.ts'
import {
  buildRagChatMessages,
  formatRagContext,
  RAG_NO_CONTEXT_REPLY,
  shouldUseRagChat,
} from '../_shared/rag-context.ts'
import { searchMaterialChunks } from '../_shared/semantic-search-core.ts'

const SERVICE_URL = Deno.env.get('NOTEBOOKLM_SERVICE_URL')!
const SERVICE_SECRET =
  Deno.env.get('SERVICE_SECRET') ?? Deno.env.get('NOTEBOOKLM_INTERNAL_SECRET') ?? ''

const MAX_MESSAGE_LENGTH = 4000
const MAX_MESSAGES = 50
const NOTEBOOKLM_TIMEOUT_MS = 55_000

type EdgeRuntimeGlobal = {
  waitUntil?: (promise: Promise<unknown>) => void
}

type ChatLogRow = {
  user_id: string
  class_id: string | null
  session_id: string
  turn_index: number
  question: string
  answer: string
  source: 'notebooklm' | 'rag'
  response_time_ms: number
  model_used?: string | null
}

function persistChatLogFireAndForget(
  supabaseAdmin: ReturnType<typeof createTypedServiceRoleClient>,
  row: ChatLogRow,
): void {
  const promise = supabaseAdmin
    .from('chat_logs')
    .insert(row)
    .then(({ error }) => {
      if (error) throw error
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[chat-logs] falha ao persistir (não crítico)', msg)
    })

  const edgeRuntime = (globalThis as { EdgeRuntime?: EdgeRuntimeGlobal }).EdgeRuntime
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(promise)
  }
}

async function resolveClassId(
  supabaseAdmin: ReturnType<typeof createTypedServiceRoleClient>,
  userId: string,
  bodyClassId?: string,
): Promise<{ classId: string } | { error: { status: number; message: string } }> {
  if (bodyClassId) {
    return { classId: bodyClassId }
  }

  const { data: userRow, error: userRowError } = await supabaseAdmin
    .from('users')
    .select('current_class_id')
    .eq('id', userId)
    .single()

  if (userRowError) {
    return { error: { status: 500, message: 'Erro ao buscar turma do usuario' } }
  }

  const classId = (userRow as Pick<UsersRow, 'current_class_id'> | null)?.current_class_id ?? null
  if (!classId) {
    return { error: { status: 400, message: 'Usuario sem turma ativa' } }
  }

  return { classId }
}

async function verifyStudentEnrollment(
  supabaseAdmin: ReturnType<typeof createTypedServiceRoleClient>,
  userId: string,
  classId: string,
): Promise<{ ok: true } | { error: { status: number; message: string } }> {
  const { data: enrollment, error: enrollError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (enrollError || !enrollment) {
    return { error: { status: 403, message: 'Usuário não matriculado nesta turma' } }
  }

  return { ok: true }
}

async function chatViaNotebookLm(
  classId: string,
  userId: string,
  question: string,
  notebookId?: string | null,
): Promise<{ message: string } | { error: { status: number; message: string; details?: string } }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), NOTEBOOKLM_TIMEOUT_MS)
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
        question,
        user_id: userId,
        ...(notebookId ? { notebook_id: notebookId } : {}),
      }),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { error: { status: 504, message: 'Timeout no serviço do Broto' } }
    }
    throw err
  } finally {
    clearTimeout(timer)
  }

  if (!chatRes.ok) {
    const errBody = await chatRes.text().catch(() => '')
    return {
      error: {
        status: 502,
        message: 'Erro no servico do Broto',
        details: errBody || undefined,
      },
    }
  }

  const chatJson = parseNotebookLmChatResponse(await chatRes.json().catch(() => null))
  const message = chatJson?.answer.trim() ?? ''
  if (!message) {
    return { error: { status: 502, message: 'Resposta vazia do servico' } }
  }

  return { message }
}

async function chatViaRag(params: {
  adminClient: TypedSupabaseClient
  classId: string
  question: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  openAiKey: string
}): Promise<
  { message: string; model: string; source: 'rag' } | { error: { status: number; message: string } }
> {
  const chunks = await searchMaterialChunks(params.adminClient, {
    query: params.question,
    class_id: params.classId,
    openAiKey: params.openAiKey,
    limit: SEMANTIC_SEARCH_DEFAULT_LIMIT,
    similarity_threshold: SEMANTIC_SEARCH_DEFAULT_THRESHOLD,
  })

  const contextBlock = formatRagContext(chunks)
  if (!contextBlock) {
    return { message: RAG_NO_CONTEXT_REPLY, model: 'none', source: 'rag' }
  }

  const completion = await createChatCompletion(
    buildRagChatMessages({
      contextBlock,
      conversationHistory: params.conversationHistory,
      question: params.question,
    }),
    params.openAiKey,
  )

  return { message: completion.content, model: completion.model, source: 'rag' }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const startTime = Date.now()

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data

    const supabaseAdmin = createTypedServiceRoleClient()
    const adminClient = createServiceRoleClientUnsafe()

    const parsedBody = parseBrotoChatBody(await req.json().catch(() => null))
    if (!parsedBody) {
      return json(400, { error: 'messages é obrigatório' }, cors)
    }
    const { messages, sessionId, turnIndex, classId: bodyClassId } = parsedBody

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

    const classResolved = await resolveClassId(supabaseAdmin, user.id, bodyClassId)
    if ('error' in classResolved) {
      return json(classResolved.error.status, { error: classResolved.error.message }, cors)
    }
    const classId = classResolved.classId

    const enrollmentResult = await verifyStudentEnrollment(supabaseAdmin, user.id, classId)
    if ('error' in enrollmentResult) {
      return json(enrollmentResult.error.status, { error: enrollmentResult.error.message }, cors)
    }

    const { data: cls, error: clsError } = await adminClient
      .from('classes')
      .select('rag_enabled, notebook_id')
      .eq('id', classId)
      .single()

    if (clsError || !cls) {
      return json(404, { error: 'Turma não encontrada' }, cors)
    }

    let message: string
    let source: ChatLogRow['source']
    let modelUsed: string | null = null

    if (shouldUseRagChat(cls.rag_enabled)) {
      const classAccessResult = await requireClassAccess(adminClient, user.id, classId, 'student')
      if (classAccessResult.error) {
        return json(
          classAccessResult.error.status,
          { error: classAccessResult.error.message },
          cors,
        )
      }

      const openAiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openAiKey) {
        return json(500, { error: 'OPENAI_API_KEY não configurada' }, cors)
      }

      try {
        const ragResult = await chatViaRag({
          adminClient,
          classId,
          question: lastUserMsg.content,
          conversationHistory: messages.slice(0, -1),
          openAiKey,
        })

        if ('error' in ragResult) {
          return json(ragResult.error.status, { error: ragResult.error.message }, cors)
        }

        message = ragResult.message
        source = 'rag'
        modelUsed = ragResult.model === 'none' ? null : ragResult.model
      } catch (err) {
        console.error('[broto-chat] RAG error:', err)
        return json(500, { error: 'Erro ao gerar resposta com RAG' }, cors)
      }
    } else {
      const notebookResult = await chatViaNotebookLm(
        classId,
        user.id,
        lastUserMsg.content,
        cls.notebook_id,
      )
      if ('error' in notebookResult) {
        return json(
          notebookResult.error.status,
          {
            error: notebookResult.error.message,
            details: notebookResult.error.details,
          },
          cors,
        )
      }
      message = notebookResult.message
      source = 'notebooklm'
    }

    const responseTimeMs = Date.now() - startTime

    if (sessionId) {
      persistChatLogFireAndForget(supabaseAdmin, {
        user_id: user.id,
        class_id: classId,
        session_id: sessionId,
        turn_index: turnIndex,
        question: lastUserMsg.content,
        answer: message,
        source,
        response_time_ms: responseTimeMs,
        model_used: modelUsed,
      })
    }

    return json(200, { message }, cors)
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
