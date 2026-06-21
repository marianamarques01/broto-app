import type { TypedSupabaseClient } from './database.ts'
import type { TopicPerformanceInsert, TopicPerformanceRow } from '../../database.types.ts'
import { BKT_DEFAULT_P_KNOW, updatePKnow } from './bkt.ts'
import { areaKeyForPracticeAnswer, isCountablePracticeArea } from './enem-topic-area.ts'
import { resolveEffectiveTopico, type QuestionTopicoHints } from './answer-question-topico.ts'

export type TopicPerformanceUpdateResult =
  | { status: 'updated'; effectiveTopico: string }
  | { status: 'skipped' }
  | { status: 'error'; message: string }

export async function recordPKnowSkipped(
  admin: TypedSupabaseClient,
  params: {
    questionId: string
    userId: string
    areaKey: string | null
    questionTopico?: string | null
  },
): Promise<void> {
  console.warn('[answer-question] p_know não atualizado — tópico indefinido', {
    questionId: params.questionId,
    userId: params.userId,
    receivedAreaKey: params.areaKey,
    questionTopico: params.questionTopico ?? null,
  })

  const { error } = await admin.from('data_quality_events').insert({
    event_type: 'p_know_skipped',
    question_id: params.questionId,
    user_id: params.userId,
    metadata: { reason: 'topico_undefined', areaKey: params.areaKey },
  })

  if (error) {
    console.error('[answer-question] data_quality_events insert:', error)
  }
}

export async function applyTopicPerformanceUpdate(
  admin: TypedSupabaseClient,
  params: {
    userId: string
    questionId: string
    isCorrect: boolean
    mappedTopico?: string
    clientAreaKey: string | null
    question?: QuestionTopicoHints | null
  },
): Promise<TopicPerformanceUpdateResult> {
  const effectiveTopico = resolveEffectiveTopico({
    mappedTopico: params.mappedTopico,
    clientAreaKey: params.clientAreaKey,
    question: params.question,
  })

  if (!effectiveTopico) {
    await recordPKnowSkipped(admin, {
      questionId: params.questionId,
      userId: params.userId,
      areaKey: params.clientAreaKey,
      questionTopico: params.question?.topico_value ?? params.question?.topico_slug ?? null,
    })
    return { status: 'skipped' }
  }

  const { data: existing } = await admin
    .from('topic_performance')
    .select('total_answered, total_correct, p_know')
    .eq('user_id', params.userId)
    .eq('topico_value', effectiveTopico)
    .maybeSingle()

  const existingRow = existing as Pick<
    TopicPerformanceRow,
    'total_answered' | 'total_correct' | 'p_know'
  > | null
  const ta = (Number(existingRow?.total_answered) || 0) + 1
  const tc = (Number(existingRow?.total_correct) || 0) + (params.isCorrect ? 1 : 0)
  const acc = ta > 0 ? Math.round((tc / ta) * 10000) / 100 : 0
  const pKnowPrior =
    existingRow?.p_know != null && Number.isFinite(Number(existingRow.p_know))
      ? Number(existingRow.p_know)
      : BKT_DEFAULT_P_KNOW
  const pKnowNext = updatePKnow(pKnowPrior, params.isCorrect)

  const resolvedArea = areaKeyForPracticeAnswer({
    topicoSlug: params.mappedTopico,
    clientAreaKey: params.clientAreaKey,
  })
  const areaKeyToStore = isCountablePracticeArea(resolvedArea) ? resolvedArea : null

  const tpUpsert: TopicPerformanceInsert = {
    user_id: params.userId,
    topico_value: effectiveTopico,
    total_answered: ta,
    total_correct: tc,
    accuracy_pct: acc,
    p_know: pKnowNext,
    last_practiced: new Date().toISOString(),
    area_key: areaKeyToStore,
  }

  const { error: tpErr } = await admin.from('topic_performance').upsert(tpUpsert, {
    onConflict: 'user_id,topico_value',
  })

  if (tpErr) {
    console.error('[answer-question] topic_performance upsert:', tpErr)
    return { status: 'error', message: 'Erro ao atualizar desempenho por tópico' }
  }

  return { status: 'updated', effectiveTopico }
}
