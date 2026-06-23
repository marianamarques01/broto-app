import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedServiceRoleClient } from '../_shared/database.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import type { QuestionTopicMappingRow, UserQuestionAnswerRow } from '../../database.types.ts'
import { legacyUnauthorizedMessage, requireUser } from '../_shared/authz.ts'

const MAX_ROWS = 120

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' }, cors)

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

    const { data: ansRows, error: ansErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('question_id, created_at, mistake_type')
      .eq('user_id', user.id)
      .eq('acertou', false)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS)

    if (ansErr) {
      console.error('user-recent-mistakes:', ansErr)
      return json(500, { error: ansErr.message }, cors)
    }

    const rows = (ansRows ?? []) as Pick<
      UserQuestionAnswerRow,
      'question_id' | 'created_at' | 'mistake_type'
    >[]
    const qids = [...new Set(rows.map((r) => String(r.question_id ?? '')).filter(Boolean))]

    const topicoByQid = new Map<string, string | null>()
    if (qids.length > 0) {
      const { data: mapRows, error: mapErr } = await supabaseAdmin
        .from('question_topic_mapping')
        .select('question_id, topico_value')
        .in('question_id', qids)

      if (mapErr) {
        console.error('user-recent-mistakes mapping:', mapErr)
      } else {
        for (const m of mapRows ?? []) {
          const mr = m as Pick<QuestionTopicMappingRow, 'question_id' | 'topico_value'>
          const qid = String(mr.question_id ?? '')
          if (qid && !topicoByQid.has(qid)) {
            topicoByQid.set(qid, mr.topico_value != null ? String(mr.topico_value) : null)
          }
        }
      }
    }

    const mistakes: {
      questionId: string
      createdAt: string
      topicoValue: string | null
      mistakeType: 'stuck' | 'guessed' | 'normal' | null
    }[] = []
    const seen = new Set<string>()

    for (const r of rows) {
      const questionId = String(r.question_id ?? '')
      const createdAt = String(r.created_at ?? '')
      if (!questionId || !createdAt) continue
      if (seen.has(questionId)) continue

      const topicoValue = topicoByQid.get(questionId) ?? null
      const rawMistakeType = r.mistake_type
      const mistakeType =
        rawMistakeType === 'stuck' || rawMistakeType === 'guessed' || rawMistakeType === 'normal'
          ? rawMistakeType
          : null

      seen.add(questionId)
      mistakes.push({ questionId, createdAt, topicoValue, mistakeType })
    }

    return json(200, { mistakes }, cors)
  } catch (err) {
    console.error('user-recent-mistakes:', err)
    return json(500, { error: String(err) }, cors)
  }
})
