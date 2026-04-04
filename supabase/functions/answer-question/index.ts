import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'

/** +10 XP por resposta, +5 se acertou (alinhado ao spec em docs/broto-f4-area-de-estudo.md). */
const XP_PER_ANSWER = 10
const XP_BONUS_CORRECT = 5

function nivelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

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
    const questionId = typeof raw?.questionId === 'string' ? raw.questionId.trim() : ''
    const isCorrect = raw?.isCorrect === true
    const timeSpentSecRaw = raw?.timeSpentSec
    const timeSpentSec =
      typeof timeSpentSecRaw === 'number' && Number.isFinite(timeSpentSecRaw)
        ? Math.max(0, Math.floor(timeSpentSecRaw))
        : null

    if (!questionId) {
      return json(400, { error: 'questionId é obrigatório' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    const { error: insErr } = await admin.from('user_question_answers').insert({
      user_id: user.id,
      question_id: questionId,
      acertou: isCorrect,
      tempo_resposta: timeSpentSec,
    } as Record<string, unknown>)

    if (insErr) {
      console.error('[answer-question] insert user_question_answers:', insErr)
      return json(500, { error: 'Erro ao registrar resposta' }, cors)
    }

    const { data: mapRows, error: mapErr } = await admin
      .from('question_topic_mapping')
      .select('topico_value')
      .eq('question_id', questionId)
      .limit(1)

    if (mapErr) {
      console.error('[answer-question] question_topic_mapping:', mapErr)
    }

    const topico =
      Array.isArray(mapRows) && mapRows.length > 0
        ? (mapRows[0] as { topico_value?: string }).topico_value
        : undefined

    if (topico) {
      const { data: existing } = await admin
        .from('topic_performance')
        .select('total_answered, total_correct')
        .eq('user_id', user.id)
        .eq('topico_value', topico)
        .maybeSingle()

      const ta = (Number((existing as { total_answered?: number } | null)?.total_answered) || 0) + 1
      const tc =
        (Number((existing as { total_correct?: number } | null)?.total_correct) || 0) +
        (isCorrect ? 1 : 0)
      const acc = ta > 0 ? Math.round((tc / ta) * 10000) / 100 : 0

      const { error: tpErr } = await admin.from('topic_performance').upsert(
        {
          user_id: user.id,
          topico_value: topico,
          total_answered: ta,
          total_correct: tc,
          accuracy_pct: acc,
          last_practiced: new Date().toISOString(),
        } as Record<string, unknown>,
        { onConflict: 'user_id,topico_value' },
      )

      if (tpErr) {
        console.error('[answer-question] topic_performance upsert:', tpErr)
      }
    }

    const { data: pet, error: petSelErr } = await admin
      .from('pets')
      .select('xp, nivel')
      .eq('user_id', user.id)
      .maybeSingle()

    if (petSelErr) {
      console.error('[answer-question] pet select:', petSelErr)
      return json(500, { error: 'Erro ao atualizar progresso do pet' }, cors)
    }

    const prevXp = Number((pet as { xp?: number } | null)?.xp) || 0
    const xpGained = XP_PER_ANSWER + (isCorrect ? XP_BONUS_CORRECT : 0)
    const newXp = prevXp + xpGained
    const newNivel = nivelFromXp(newXp)

    const { error: petUpErr } = await admin
      .from('pets')
      .update({ xp: newXp, nivel: newNivel } as Record<string, unknown>)
      .eq('user_id', user.id)

    if (petUpErr) {
      console.error('[answer-question] pet update:', petUpErr)
      return json(500, { error: 'Erro ao atualizar pet' }, cors)
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const y = new Date()
    y.setUTCDate(y.getUTCDate() - 1)
    const yesterdayStr = y.toISOString().slice(0, 10)

    const { data: urow, error: userSelErr } = await admin
      .from('users')
      .select('streak, last_study_date')
      .eq('id', user.id)
      .maybeSingle()

    if (userSelErr) {
      console.error('[answer-question] user select:', userSelErr)
    } else {
      const lastRaw = (urow as { last_study_date?: string | null; streak?: number } | null)
        ?.last_study_date
      const last = lastRaw != null ? String(lastRaw).slice(0, 10) : null
      let newStreak = Number((urow as { streak?: number } | null)?.streak) || 0

      if (last !== todayStr) {
        if (last === yesterdayStr) {
          newStreak = newStreak + 1
        } else {
          newStreak = 1
        }
        const { error: streakErr } = await admin
          .from('users')
          .update({
            streak: newStreak,
            last_study_date: todayStr,
          } as Record<string, unknown>)
          .eq('id', user.id)
        if (streakErr) {
          console.error('[answer-question] streak update:', streakErr)
        }
      }
    }

    return json(200, { success: true, xpGained, newLevel: newNivel }, cors)
  } catch (err) {
    console.error('[answer-question]', err)
    return json(500, { error: String(err) }, cors)
  }
})
