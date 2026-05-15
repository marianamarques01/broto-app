import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { areaKeyForPracticeAnswer } from '../_shared/enem-topic-area.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'

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

/** Quando a migração `pets.nome` ainda não foi aplicada no projeto Supabase. */
function isMissingPetsNomeError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase()
  if (!m.includes('nome') || !m.includes('pets')) return false
  if (m.includes('schema cache')) return true
  if (m.includes('does not exist') || m.includes('undefined column')) return true
  return false
}

function parseNomeBody(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const fromNome = typeof o.nome === 'string' ? o.nome : ''
  const fromBroto = typeof o.brotoNome === 'string' ? o.brotoNome : ''
  const s = (fromNome.trim() ? fromNome : fromBroto).trim().slice(0, 32)
  return s
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'GET' && req.method !== 'PATCH') {
      return json(405, { error: 'Method not allowed' }, cors)
    }

    if (req.method === 'PATCH') {
      const authResult = await requireUser(req)
      if (authResult.error) {
        return json(authResult.error.status, { error: authResult.error.message }, cors)
      }
      const { user } = authResult.data
      const rawBody = await req.json().catch(() => null)
      const nomeTrim = parseNomeBody(rawBody)
      if (nomeTrim === null) {
        return json(
          400,
          { error: 'JSON inválido: envie { "nome": "..." } ou { "brotoNome": "..." }' },
          cors,
        )
      }
      if (nomeTrim.length < 1) {
        return json(400, { error: 'Dê um nome ao seu Broto.' }, cors)
      }

      const admin = createServiceRoleClientUnsafe()
      const { data: petRow, error: petSelErr } = await admin
        .from('pets')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (petSelErr) {
        console.error('pet-me PATCH pet select', petSelErr)
        return json(500, { error: petSelErr.message }, cors)
      }

      if (petRow) {
        const { error: petUpdErr } = await admin
          .from('pets')
          .update({ nome: nomeTrim })
          .eq('user_id', user.id)
        if (petUpdErr) {
          if (isMissingPetsNomeError(petUpdErr)) {
            return json(
              500,
              { error: 'Coluna pets.nome ausente no banco. Aplique a migração pets_broto_nome.' },
              cors,
            )
          }
          console.error('pet-me PATCH pet update', petUpdErr)
          return json(500, { error: 'Não foi possível salvar o nome do Broto' }, cors)
        }
      } else {
        let petInsErr = (
          await admin.from('pets').insert({
            user_id: user.id,
            nome: nomeTrim,
          })
        ).error
        if (petInsErr && isMissingPetsNomeError(petInsErr)) {
          petInsErr = (await admin.from('pets').insert({ user_id: user.id })).error
        }
        if (petInsErr) {
          if (isMissingPetsNomeError(petInsErr)) {
            return json(
              500,
              { error: 'Coluna pets.nome ausente no banco. Aplique a migração pets_broto_nome.' },
              cors,
            )
          }
          console.error('pet-me PATCH pet insert', petInsErr)
          return json(500, { error: 'Não foi possível criar o registro do Broto' }, cors)
        }
      }

      return json(200, { ok: true, nome: nomeTrim }, cors)
    }

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

    const usersRow = await supabaseAdmin
      .from('users')
      .select('streak')
      .eq('id', user.id)
      .maybeSingle()
    if (usersRow.error) {
      console.error('pet-me:', usersRow.error)
      return json(500, { error: usersRow.error.message }, cors)
    }
    const urow = usersRow.data

    let pet = null as { xp?: number; nivel?: number; nome?: string } | null
    const withNome = await supabaseAdmin
      .from('pets')
      .select('xp, nivel, nome')
      .eq('user_id', user.id)
      .maybeSingle()
    if (withNome.error && isMissingPetsNomeError(withNome.error)) {
      const fallback = await supabaseAdmin
        .from('pets')
        .select('xp, nivel')
        .eq('user_id', user.id)
        .maybeSingle()
      if (fallback.error) {
        console.error('pet-me:', fallback.error)
        return json(500, { error: fallback.error.message }, cors)
      }
      pet = fallback.data
    } else if (withNome.error) {
      console.error('pet-me:', withNome.error)
      return json(500, { error: withNome.error.message }, cors)
    } else {
      pet = withNome.data
    }

    const xp = pet?.xp ?? 0
    const nivel = Math.max(1, pet?.nivel ?? 1)
    const brotoNomeRaw = pet?.nome
    const brotoNome =
      typeof brotoNomeRaw === 'string' && brotoNomeRaw.trim().length > 0
        ? brotoNomeRaw.trim()
        : 'Broto'
    const streak = urow?.streak ?? 0

    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)

    const { data: todayRows, error: todayErr } = await supabaseAdmin
      .from('user_question_answers')
      .select('question_id, acertou, tempo_resposta, answer_area_key')
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
      answer_area_key?: string | null
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
      const area = areaKeyForPracticeAnswer({
        topicoSlug: topicByQid.get(a.question_id) ?? undefined,
        clientAreaKey: a.answer_area_key,
      })
      const cur = studyTodayByArea[area] ?? { answered: 0, correct: 0 }
      cur.answered += 1
      if (a.acertou) cur.correct += 1
      studyTodayByArea[area] = cur
    }

    const humor = Math.min(100, 45 + Math.min(streak, 10) * 3)

    return json(
      200,
      {
        nome: brotoNome,
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
