import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'

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

    let questoesHoje = 0
    let acertosHoje = 0

    const { count, error: cntErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())

    if (!cntErr && count != null) questoesHoje = count

    const { data: withCorrect, error: acErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('is_correct')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())

    if (!acErr && withCorrect) {
      acertosHoje = withCorrect.filter((r) => r.is_correct === true).length
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
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
