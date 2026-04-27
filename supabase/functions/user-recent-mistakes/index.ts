import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(401, { error: 'Unauthorized' }, cors)

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

    const { data: ansRows, error: ansErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('question_id, created_at')
      .eq('user_id', user.id)
      .eq('acertou', false)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS)

    if (ansErr) {
      console.error('user-recent-mistakes:', ansErr)
      return json(500, { error: ansErr.message }, cors)
    }

    const rows = (ansRows ?? []) as { question_id?: string; created_at?: string }[]
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
          const mr = m as { question_id?: string; topico_value?: string | null }
          const qid = String(mr.question_id ?? '')
          if (qid && !topicoByQid.has(qid)) {
            topicoByQid.set(qid, mr.topico_value != null ? String(mr.topico_value) : null)
          }
        }
      }
    }

    const mistakes: { questionId: string; createdAt: string; topicoValue: string | null }[] = []
    const seen = new Set<string>()

    for (const r of rows) {
      const questionId = String(r.question_id ?? '')
      const createdAt = String(r.created_at ?? '')
      if (!questionId || !createdAt) continue
      if (seen.has(questionId)) continue

      const topicoValue = topicoByQid.get(questionId) ?? null

      seen.add(questionId)
      mistakes.push({ questionId, createdAt, topicoValue })
    }

    return json(200, { mistakes }, cors)
  } catch (err) {
    console.error('user-recent-mistakes:', err)
    return json(500, { error: String(err) }, cors)
  }
})
