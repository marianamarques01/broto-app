import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { areaKeyFromTopico } from '../_shared/enem-topic-area.ts'

type Fase = 'semente' | 'muda' | 'planta' | 'flor' | 'especial'

function faseFromNivel(n: number): Fase {
  if (n <= 1) return 'semente'
  if (n === 2) return 'muda'
  if (n <= 4) return 'planta'
  if (n <= 7) return 'flor'
  return 'especial'
}

function xpToNextLevel(xp: number, nivel: number): number {
  const cap = Math.max(1, nivel * 100)
  const rem = cap - xp
  return rem > 0 ? rem : 100
}

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

    const [{ data: pet, error: petErr }, { data: urow, error: userErr }] = await Promise.all([
      supabaseAdmin.from('pets').select('xp, nivel').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('users').select('streak').eq('id', user.id).maybeSingle(),
    ])

    if (petErr || userErr) {
      console.error('pet-me:', petErr ?? userErr)
      return json(500, { error: (petErr ?? userErr)!.message }, cors)
    }

    const xp = pet?.xp ?? 0
    const nivel = Math.max(1, pet?.nivel ?? 1)
    const streak = urow?.streak ?? 0

    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)

    const { data: todayRows, error: todayErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('question_id, acertou, tempo_resposta')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())

    if (todayErr) {
      console.error('pet-me today answers:', todayErr)
      return json(500, { error: todayErr.message }, cors)
    }

    const answers = (todayRows ?? []) as {
      question_id: string
      acertou: boolean
      tempo_resposta: number | null
    }[]
    const questoesHoje = answers.length
    const acertosHoje = answers.filter((r) => r.acertou === true).length
    const tempoEstudoSegHoje = answers.reduce((s, r) => {
      const t = r.tempo_resposta
      return s + (typeof t === 'number' && Number.isFinite(t) ? Math.max(0, t) : 0)
    }, 0)

    const qids = [...new Set(answers.map((a) => a.question_id))]
    const topicByQid = new Map<string, string | null>()
    if (qids.length > 0) {
      const { data: maps, error: mapErr } = await supabaseAdmin
        .from('question_topic_mapping')
        .select('question_id, topico_value')
        .in('question_id', qids)

      if (mapErr) {
        console.error('pet-me mapping:', mapErr)
      } else {
        for (const row of maps ?? []) {
          const rec = row as { question_id?: string; topico_value?: string }
          if (rec.question_id) topicByQid.set(rec.question_id, rec.topico_value ?? null)
        }
      }
    }

    const studyTodayByArea: Record<string, { answered: number; correct: number }> = {}
    for (const a of answers) {
      const topico = topicByQid.get(a.question_id) ?? null
      const area = areaKeyFromTopico(topico)
      const cur = studyTodayByArea[area] ?? { answered: 0, correct: 0 }
      cur.answered += 1
      if (a.acertou) cur.correct += 1
      studyTodayByArea[area] = cur
    }

    const humor = Math.min(100, 45 + Math.min(streak, 10) * 3)

    return json(
      200,
      {
        nivel,
        xp,
        xpNextLevel: xpToNextLevel(xp, nivel),
        fase: faseFromNivel(nivel),
        humor,
        streak,
        questoesHoje,
        acertosHoje,
        tempoEstudoSegHoje,
        studyTodayByArea,
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
