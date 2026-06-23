import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { parseAnswerQuestionBody } from '../_shared/edge-api-types.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import type {
  PetsRow,
  UserQuestionAnswerInsert,
  UsersRow,
  PracticeSessionRow,
} from '../../database.types.ts'
import { applyTopicPerformanceUpdate } from '../_shared/answer-question-p-know.ts'
import {
  applyAnswerToStudyToday,
  computeMissionBonusXp,
  fetchStudyTodayByArea,
  missionAreasForUser,
} from '../_shared/daily-mission-bonus.ts'
import { todayUtcISO } from '../_shared/calendar-day.ts'
import { planStreakUpdate } from '../_shared/streak-freeze.ts'
import { classifyMistake } from '@broto/shared/ai/student-model/mistake-classifier.ts'

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

    const parsed = parseAnswerQuestionBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'questionId é obrigatório' }, cors)
    }
    const {
      questionId,
      isCorrect,
      timeSpentSec: timeSpentSecParsed,
      sessionId,
      areaKey: rawAreaKey,
    } = parsed
    const timeSpentSec = timeSpentSecParsed ?? null
    const validatedAnswerAreaKey = rawAreaKey ?? null

    const admin = createServiceRoleClientUnsafe()

    let sessionIdToStore: string | null = null
    if (sessionId) {
      const { data: sess, error: sessErr } = await admin
        .from('practice_sessions')
        .select('id, user_id, question_ids')
        .eq('id', sessionId)
        .maybeSingle()

      if (sessErr) {
        console.error('[answer-question] practice_sessions:', sessErr)
        return json(500, { error: 'Erro ao validar sessão' }, cors)
      }
      if (!sess) {
        return json(400, { error: 'Sessão inválida' }, cors)
      }
      const row = sess as Pick<PracticeSessionRow, 'user_id' | 'question_ids'>
      if (row.user_id !== user.id) {
        return json(403, { error: 'Sessão de outro usuário' }, cors)
      }
      const ids = Array.isArray(row.question_ids) ? row.question_ids : []
      const allowed = ids.some((x) => x === questionId)
      if (!allowed) {
        return json(400, { error: 'Questão não pertence à sessão' }, cors)
      }
      sessionIdToStore = sessionId
    }

    const studyTodayBefore = await fetchStudyTodayByArea(admin, user.id)

    const mistakeType = classifyMistake(isCorrect, timeSpentSec)

    const insertRow: UserQuestionAnswerInsert = {
      user_id: user.id,
      question_id: questionId,
      acertou: isCorrect,
      tempo_resposta: timeSpentSec,
      session_id: sessionIdToStore,
      answer_area_key: validatedAnswerAreaKey,
      mistake_type: mistakeType,
    }

    const { error: insErr } = await admin.from('user_question_answers').insert(insertRow)

    if (insErr) {
      console.error('[answer-question] insert user_question_answers:', insErr)
      return json(500, { error: 'Erro ao registrar resposta' }, cors)
    }

    const { data: mapRows, error: mapErr } = await admin
      .from('question_topic_mapping')
      .select('topico_value')
      .eq('question_id', questionId)
      .order('topico_value', { ascending: true })
      .limit(1)

    if (mapErr) {
      console.error('[answer-question] question_topic_mapping:', mapErr)
    }

    const mappedTopico =
      Array.isArray(mapRows) && mapRows.length > 0
        ? String(mapRows[0].topico_value ?? '').trim() || undefined
        : undefined

    const tpResult = await applyTopicPerformanceUpdate(admin, {
      userId: user.id,
      questionId,
      isCorrect,
      mappedTopico,
      clientAreaKey: validatedAnswerAreaKey,
    })

    if (tpResult.status === 'error') {
      return json(500, { error: tpResult.message }, cors)
    }

    const missionAreas = await missionAreasForUser(admin, user.id)
    const studyTodayAfter = applyAnswerToStudyToday(
      studyTodayBefore,
      {
        topicoSlug: mappedTopico,
        clientAreaKey: validatedAnswerAreaKey,
      },
      isCorrect,
    )
    const { bonusXp: missionBonusXp, completedIndexes: missionCompletedIndexes } =
      computeMissionBonusXp({
        before: studyTodayBefore,
        after: studyTodayAfter,
        missionAreas,
      })

    const { data: pet, error: petSelErr } = await admin
      .from('pets')
      .select('xp, nivel')
      .eq('user_id', user.id)
      .maybeSingle()

    if (petSelErr) {
      console.error('[answer-question] pet select:', petSelErr)
      return json(500, { error: 'Erro ao atualizar progresso do pet' }, cors)
    }

    const petRow = pet as Pick<PetsRow, 'xp' | 'nivel'> | null
    const prevXp = Number(petRow?.xp) || 0
    const xpGained = XP_PER_ANSWER + (isCorrect ? XP_BONUS_CORRECT : 0)
    const newXp = prevXp + xpGained + missionBonusXp
    const newNivel = nivelFromXp(newXp)

    const { error: petUpErr } = await admin
      .from('pets')
      .update({ xp: newXp, nivel: newNivel })
      .eq('user_id', user.id)

    if (petUpErr) {
      console.error('[answer-question] pet update:', petUpErr)
      return json(500, { error: 'Erro ao atualizar pet' }, cors)
    }

    const todayStr = todayUtcISO()

    const { data: urow, error: userSelErr } = await admin
      .from('users')
      .select('streak, last_study_date, streak_freezes, total_freezes_earned')
      .eq('id', user.id)
      .maybeSingle()

    if (userSelErr) {
      console.error('[answer-question] user select:', userSelErr)
      return json(500, { error: 'Erro ao atualizar sequência' }, cors)
    }

    const u = urow as Pick<
      UsersRow,
      'last_study_date' | 'streak' | 'streak_freezes' | 'total_freezes_earned'
    > | null

    const streakPlan = planStreakUpdate(
      {
        streak: Number(u?.streak) || 0,
        lastStudyDate: u?.last_study_date ?? null,
        streakFreezes: Number(u?.streak_freezes) || 0,
        totalFreezesEarned: Number(u?.total_freezes_earned) || 0,
      },
      todayStr,
    )

    if (streakPlan.shouldUpdate) {
      const { error: streakErr } = await admin
        .from('users')
        .update({
          streak: streakPlan.newStreak,
          last_study_date: todayStr,
          streak_freezes: streakPlan.newStreakFreezes,
          total_freezes_earned: streakPlan.newTotalFreezesEarned,
        })
        .eq('id', user.id)
      if (streakErr) {
        console.error('[answer-question] streak update:', streakErr)
        return json(500, { error: 'Erro ao atualizar sequência' }, cors)
      }

      if (streakPlan.consumeFreeze && streakPlan.freezeNumber != null) {
        const { error: freezeEvtErr } = await admin.from('streak_freeze_events').insert({
          user_id: user.id,
          streak_at_time: Number(u?.streak) || 0,
          freeze_number: streakPlan.freezeNumber,
        })
        if (freezeEvtErr) {
          console.error('[answer-question] streak_freeze_events insert:', freezeEvtErr)
        }
      }
    }

    return json(
      200,
      {
        success: true,
        xpGained,
        missionBonusXp,
        missionCompletedIndexes,
        newLevel: newNivel,
      },
      cors,
    )
  } catch (err) {
    console.error('[answer-question]', err)
    return json(500, { error: String(err) }, cors)
  }
})
