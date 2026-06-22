/**
 * Progresso por área/tópico a partir de `user_question_answers` — mesma árvore de decisão
 * que `areaKeyForPracticeAnswer` (`topico-to-area.ts`) em `daily-mission-bonus`.
 * Garante que respostas persistidas mesmo sem atualização prévia em `topic_performance`
 * apareçam nos indicadores da web/mobile.
 */

import {
  AREA_ROLLUP_PREFIX,
  areaKeyForPracticeAnswer,
  isCountablePracticeArea,
  isEnemAreaKey,
  rollupTopicPerformanceSlug,
} from '@broto/shared/lib/topico-to-area.ts'
import type { TypedSupabaseClient } from './database.ts'
import { TOPICO_LABELS } from '@broto/shared/lib/topico-labels.ts'
import type {
  QuestionTopicMappingRow,
  TopicPerformanceRow,
  UserQuestionAnswerRow,
} from '../../database.types.ts'

/** Primeiro topico determinístico por questão (= menor slug), alinhado a `answer-question` com order. */
export async function fetchFirstTopicByQuestionBatch(
  admin: TypedSupabaseClient,
  questionIds: string[],
  chunkSize: number,
): Promise<Map<string, string>> {
  const firstByQ = new Map<string, string>()
  const ids = [...new Set(questionIds.map((id) => id.trim()))].filter(Boolean)
  if (ids.length === 0) return firstByQ

  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize)
    const { data, error } = await admin
      .from('question_topic_mapping')
      .select('question_id, topico_value')
      .in('question_id', slice)
    if (error) {
      console.error('[user-progress-aggregate] mapping batch:', error)
      continue
    }
    const rows = (data ?? []) as Pick<QuestionTopicMappingRow, 'question_id' | 'topico_value'>[]
    for (const r of rows) {
      const qid = typeof r.question_id === 'string' ? r.question_id.trim() : ''
      const tv = typeof r.topico_value === 'string' ? r.topico_value.trim() : ''
      if (!qid || !tv) continue
      const prev = firstByQ.get(qid)
      if (prev === undefined || tv < prev) firstByQ.set(qid, tv)
    }
  }
  return firstByQ
}

function topicGroupingKey(topicoSlug: string | undefined, rawAnswerAreaKey: unknown): string {
  const mappedTopico = topicoSlug?.trim()
  if (mappedTopico) return mappedTopico
  const aak =
    typeof rawAnswerAreaKey === 'string' && rawAnswerAreaKey.trim() ? rawAnswerAreaKey.trim() : ''
  const validatedAnswerAreaKey = aak && isEnemAreaKey(aak) ? aak : null
  return validatedAnswerAreaKey
    ? rollupTopicPerformanceSlug(validatedAnswerAreaKey)
    : '__broto_sem_classificacao__'
}

function topicLabel(topicKey: string): string {
  return TOPICO_LABELS[topicKey] ?? humanizeTopicoSlug(topicKey)
}

function humanizeTopicoSlug(slug: string): string {
  if (slug === '__broto_sem_classificacao__') return TOPICO_LABELS.__broto_sem_classificacao__
  return slug
    .replace(new RegExp(`^${AREA_ROLLUP_PREFIX.replace(/:/g, '\\:')}`), '')
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export type MutableAgg = {
  areaMap: Map<
    string,
    {
      value: string
      label: string
      totalAnswered: number
      totalCorrect: number
      topicos: Map<
        string,
        {
          value: string
          label: string
          totalAnswered: number
          totalCorrect: number
          accuracyPct: number
          pKnow?: number
        }
      >
    }
  >
}

export function createEmptyAgg(areaOrder: readonly { value: string; label: string }[]): MutableAgg {
  const areaMap = new Map<
    string,
    {
      value: string
      label: string
      totalAnswered: number
      totalCorrect: number
      topicos: Map<
        string,
        {
          value: string
          label: string
          totalAnswered: number
          totalCorrect: number
          accuracyPct: number
          pKnow?: number
        }
      >
    }
  >()

  for (const a of areaOrder) {
    areaMap.set(a.value, {
      value: a.value,
      label: a.label,
      totalAnswered: 0,
      totalCorrect: 0,
      topicos: new Map(),
    })
  }

  return { areaMap }
}

/** Uma tentativa registada (= incremento igual ao upsert incremental em topic_performance por tópico). */
export function applyAnswerIncrement(
  state: MutableAgg,
  ans: { question_id: string; acertou: boolean; answer_area_key?: string | null },
  topicByQuestionId: ReadonlyMap<string, string>,
  _areaOrder: readonly { value: string; label: string }[],
) {
  const { areaMap } = state
  const qid = ans.question_id?.trim?.() ?? String(ans.question_id ?? '').trim()
  if (!qid) return
  const topicoSlug = topicByQuestionId.get(qid)
  const area = areaKeyForPracticeAnswer({
    topicoSlug: topicoSlug ?? undefined,
    clientAreaKey: ans.answer_area_key,
  })
  if (!isCountablePracticeArea(area)) return
  const block = areaMap.get(area)!
  const tk = topicGroupingKey(topicoSlug, ans.answer_area_key)
  block.totalAnswered += 1
  if (ans.acertou === true) block.totalCorrect += 1

  const tp = block.topicos.get(tk)
  const nextTa = (tp?.totalAnswered ?? 0) + 1
  const nextTc = (tp?.totalCorrect ?? 0) + (ans.acertou === true ? 1 : 0)
  const nextAcc = nextTa > 0 ? Math.round((nextTc / nextTa) * 1000) / 10 : 0
  block.topicos.set(tk, {
    value: tk,
    label: topicLabel(tk),
    totalAnswered: nextTa,
    totalCorrect: nextTc,
    accuracyPct: nextAcc,
  })
}

/** Agrega todas as tentativas (cada POST = +1); iguala à política acumulada em `topic_performance`. */
export function aggregateAnswersIntoProgress(payload: {
  answers: readonly { question_id: string; acertou: boolean; answer_area_key?: string | null }[]
  topicByQuestionId: ReadonlyMap<string, string>
  areaOrder: readonly { value: string; label: string }[]
}): {
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  areas: unknown[]
} {
  const state = createEmptyAgg(payload.areaOrder)
  for (const ans of payload.answers) {
    applyAnswerIncrement(state, ans, payload.topicByQuestionId, payload.areaOrder)
  }
  return finalizeAgg(state, payload.areaOrder)
}

function finalizeAgg(
  state: MutableAgg,
  areaOrder: readonly { value: string; label: string }[],
): {
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  areas: unknown[]
} {
  const { areaMap } = state
  let totalAnswered = 0
  let totalCorrect = 0
  const areas: unknown[] = []

  for (const a of areaOrder) {
    const block = areaMap.get(a.value)!
    totalAnswered += block.totalAnswered
    totalCorrect += block.totalCorrect
    const topicos = [...block.topicos.values()]
      .filter((t) => t.value !== '__broto_sem_classificacao__')
      .sort((x, y) => y.totalAnswered - x.totalAnswered)
    const acc =
      block.totalAnswered > 0
        ? Math.round((block.totalCorrect / block.totalAnswered) * 1000) / 10
        : 0
    areas.push({
      value: block.value,
      label: block.label,
      totalAnswered: block.totalAnswered,
      totalCorrect: block.totalCorrect,
      accuracyPct: acc,
      topicos,
    })
  }

  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 1000) / 10 : 0

  return {
    totalAnswered,
    totalCorrect,
    accuracyPct,
    areas,
  }
}

async function fetchPKnowByTopic(
  admin: TypedSupabaseClient,
  userId: string,
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  const { data, error } = await admin
    .from('topic_performance')
    .select('topico_value, p_know')
    .eq('user_id', userId)

  if (error) {
    console.error('[user-progress-aggregate] topic_performance p_know:', error)
    return out
  }

  for (const row of (data ?? []) as Pick<TopicPerformanceRow, 'topico_value' | 'p_know'>[]) {
    const key = typeof row.topico_value === 'string' ? row.topico_value.trim() : ''
    const pk = Number(row.p_know)
    if (key && Number.isFinite(pk)) out.set(key, pk)
  }
  return out
}

function mergePKnowIntoAreas(areas: unknown[], pKnowByTopic: ReadonlyMap<string, number>): void {
  for (const area of areas) {
    if (!area || typeof area !== 'object' || !('topicos' in area)) continue
    const topicos = (area as { topicos: Array<{ value: string; pKnow?: number }> }).topicos
    if (!Array.isArray(topicos)) continue
    for (const t of topicos) {
      const pk = pKnowByTopic.get(t.value)
      if (pk != null) t.pKnow = pk
    }
  }
}

const ANSWERS_PAGE = 2800

export async function computeUserProgressPayload(
  admin: TypedSupabaseClient,
  userId: string,
  areaOrder: readonly { value: string; label: string }[],
): Promise<{
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  areas: unknown[]
}> {
  const state = createEmptyAgg(areaOrder)
  const topicByQuestionId = new Map<string, string>()
  let from = 0

  while (true) {
    const { data, error } = await admin
      .from('user_question_answers')
      .select('question_id, acertou, answer_area_key')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .range(from, from + ANSWERS_PAGE - 1)

    if (error) {
      console.error('[user-progress-aggregate] answers page:', error)
      throw error
    }
    const page = (data ?? []) as Pick<
      UserQuestionAnswerRow,
      'question_id' | 'acertou' | 'answer_area_key'
    >[]
    if (page.length === 0) break

    const missingIds = new Set<string>()
    for (const row of page) {
      const qid = typeof row.question_id === 'string' ? row.question_id.trim() : ''
      if (qid && !topicByQuestionId.has(qid)) missingIds.add(qid)
    }
    if (missingIds.size > 0) {
      const batch = await fetchFirstTopicByQuestionBatch(admin, [...missingIds], 400)
      for (const [k, v] of batch) topicByQuestionId.set(k, v)
    }

    for (const row of page) {
      applyAnswerIncrement(state, row, topicByQuestionId, areaOrder)
    }

    from += ANSWERS_PAGE
  }

  const payload = finalizeAgg(state, areaOrder)
  const pKnowByTopic = await fetchPKnowByTopic(admin, userId)
  mergePKnowIntoAreas(payload.areas, pKnowByTopic)
  return payload
}
