import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { parseSessionIdBody } from '../_shared/edge-api-types.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import type { PracticeSessionRow, UserQuestionAnswerRow } from '../../database.types.ts'

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

    const sessionId = parseSessionIdBody(await req.json().catch(() => null))

    if (!sessionId) {
      return json(400, { error: 'sessionId é obrigatório' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { data: row, error } = await admin
      .from('practice_sessions')
      .select(
        'id, user_id, created_at, completed_at, kind, config, question_ids, summary, progress',
      )
      .eq('id', sessionId)
      .maybeSingle()

    if (error) {
      console.error('[practice-session-get] select:', error)
      return json(500, { error: 'Erro ao carregar sessão' }, cors)
    }
    if (!row) {
      return json(404, { error: 'Sessão não encontrada' }, cors)
    }
    const sessionRow = row as PracticeSessionRow
    if (sessionRow.user_id !== user.id) {
      return json(403, { error: 'Sessão de outro usuário' }, cors)
    }

    const questionIds = Array.isArray(sessionRow.question_ids)
      ? sessionRow.question_ids.map(String)
      : []

    let sessionAnswers: { questionId: string; isCorrect: boolean }[] = []
    if (!sessionRow.completed_at && questionIds.length > 0) {
      const { data: ansRows, error: ansErr } = await admin
        .from('user_question_answers')
        .select('question_id, acertou, created_at')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (ansErr) {
        console.error('[practice-session-get] answers:', ansErr)
      } else if (Array.isArray(ansRows)) {
        const latest = new Map<string, boolean>()
        for (const a of ansRows) {
          const ar = a as Pick<UserQuestionAnswerRow, 'question_id' | 'acertou'>
          const qid = typeof ar.question_id === 'string' ? ar.question_id.trim() : ''
          if (!qid) continue
          latest.set(qid, ar.acertou === true)
        }
        sessionAnswers = [...latest.entries()].map(([questionId, isCorrect]) => ({
          questionId,
          isCorrect,
        }))
      }
    }

    return json(
      200,
      {
        sessionId: sessionRow.id,
        createdAt: sessionRow.created_at,
        completedAt: sessionRow.completed_at,
        kind: sessionRow.kind,
        config: sessionRow.config,
        questionIds,
        summary: sessionRow.summary,
        progress: sessionRow.progress ?? null,
        sessionAnswers,
      },
      cors,
    )
  } catch (err) {
    console.error('[practice-session-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
