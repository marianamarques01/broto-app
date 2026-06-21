/**
 * Bônus de XP das missões diárias ao concluir metas — alinhado a
 * `apps/web/src/lib/build-daily-missions.ts`. Manter regras sincronizadas.
 */
import type { TypedSupabaseClient } from './database.ts'
import type { TopicPerformanceRow, UserQuestionAnswerRow } from '../../database.types.ts'
import {
  areaKeyForPracticeAnswer,
  isCountablePracticeArea,
  TOPICO_TO_AREA,
} from './enem-topic-area.ts'
import {
  DAILY_MISSION_VOLUME_QUEST_GOAL,
  DEFAULT_MISSION_AREAS,
  DAILY_MISSION_XP_REWARDS,
} from './daily-mission-constants.ts'

type ServiceClient = TypedSupabaseClient

const AREA_ORDER: { value: string }[] = [
  { value: 'linguagens' },
  { value: 'ciencias-humanas' },
  { value: 'ciencias-natureza' },
  { value: 'matematica' },
]

type TpRow = Pick<
  TopicPerformanceRow,
  'topico_value' | 'total_answered' | 'total_correct' | 'accuracy_pct' | 'area_key'
>

export type StudyTodayByArea = Record<string, { answered: number; correct: number }>

function startOfUtcDayIso(): string {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}

/** Contagens de hoje (UTC) por área; igual à lógica de `pet-me`. */
export async function fetchStudyTodayByArea(
  admin: ServiceClient,
  userId: string,
): Promise<StudyTodayByArea> {
  const { data: todayRows, error: todayErr } = await admin
    .from('user_question_answers')
    .select('question_id, acertou, answer_area_key')
    .eq('user_id', userId)
    .gte('created_at', startOfUtcDayIso())

  if (todayErr) {
    console.error('[daily-mission-bonus] today answers:', todayErr)
    return {}
  }

  const answers = (todayRows ?? []) as Pick<
    UserQuestionAnswerRow,
    'question_id' | 'acertou' | 'answer_area_key'
  >[]
  const qids = [...new Set(answers.map((a) => a.question_id))]
  const topicByQid = new Map<string, string | null>()
  if (qids.length > 0) {
    const { data: maps, error: mapErr } = await admin
      .from('question_topic_mapping')
      .select('question_id, topico_value')
      .in('question_id', qids)

    if (mapErr) {
      console.error('[daily-mission-bonus] mapping:', mapErr)
    } else {
      for (const row of maps ?? []) {
        if (row.question_id) topicByQid.set(row.question_id, row.topico_value ?? null)
      }
    }
  }

  const studyTodayByArea: StudyTodayByArea = {}
  for (const a of answers) {
    const area = areaKeyForPracticeAnswer({
      topicoSlug: topicByQid.get(a.question_id) ?? undefined,
      clientAreaKey: a.answer_area_key,
    })
    if (!isCountablePracticeArea(area)) continue
    const cur = studyTodayByArea[area] ?? { answered: 0, correct: 0 }
    cur.answered += 1
    if (a.acertou) cur.correct += 1
    studyTodayByArea[area] = cur
  }
  return studyTodayByArea
}

/** Áreas com acumulado histórico, ordenadas por pior acerto (como na Home). */
export function pickMissionAreasFromTopicPerformance(rows: TpRow[]): [string, string, string] {
  const areaMap = new Map<string, { value: string; totalAnswered: number; totalCorrect: number }>()

  for (const a of AREA_ORDER) {
    areaMap.set(a.value, { value: a.value, totalAnswered: 0, totalCorrect: 0 })
  }

  for (const r of rows) {
    const fromDb = r.area_key && String(r.area_key).trim()
    const fromTopico = TOPICO_TO_AREA[r.topico_value]
    const resolved =
      fromDb && areaMap.has(fromDb)
        ? fromDb
        : fromTopico && areaMap.has(fromTopico)
          ? fromTopico
          : null
    if (!resolved) continue

    const block = areaMap.get(resolved)!
    block.totalAnswered += Number(r.total_answered) || 0
    block.totalCorrect += Number(r.total_correct) || 0
  }

  const areaSummaries: { value: string; totalAnswered: number; accuracyPct: number }[] = []

  for (const a of AREA_ORDER) {
    const b = areaMap.get(a.value)!
    const acc = b.totalAnswered > 0 ? Math.round((b.totalCorrect / b.totalAnswered) * 1000) / 10 : 0
    areaSummaries.push({ value: b.value, totalAnswered: b.totalAnswered, accuracyPct: acc })
  }
  const sortedKeys = areaSummaries
    .filter((x) => x.totalAnswered >= 1)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .map((a) => a.value)

  return [
    sortedKeys[0] ?? DEFAULT_MISSION_AREAS[0],
    sortedKeys[1] ?? DEFAULT_MISSION_AREAS[1],
    sortedKeys[2] ?? DEFAULT_MISSION_AREAS[2],
  ]
}

function areaSnapshot(by: StudyTodayByArea, key: string): { answered: number; correct: number } {
  return by[key] ?? { answered: 0, correct: 0 }
}

function missionCompletionFlags(
  by: StudyTodayByArea,
  ma: [string, string, string],
): [boolean, boolean, boolean] {
  const a0 = areaSnapshot(by, ma[0])
  const a1 = areaSnapshot(by, ma[1])
  const a2 = areaSnapshot(by, ma[2])
  const acc2 = a2.answered === 0 ? null : Math.round((a2.correct / a2.answered) * 100)

  /** Volume missões – alinhado a `DAILY_MISSION_VOLUME_QUEST_GOAL` em `build-daily-missions.ts`. */
  const m0 = a0.answered >= DAILY_MISSION_VOLUME_QUEST_GOAL
  const m1 =
    a1.answered >= DAILY_MISSION_VOLUME_QUEST_GOAL && a0.answered >= DAILY_MISSION_VOLUME_QUEST_GOAL
  const m2 = a2.answered >= DAILY_MISSION_VOLUME_QUEST_GOAL && (acc2 ?? 0) >= 70
  return [m0, m1, m2]
}

export function computeMissionBonusXp(args: {
  before: StudyTodayByArea
  after: StudyTodayByArea
  missionAreas: [string, string, string]
}): { bonusXp: number; completedIndexes: number[] } {
  const bef = missionCompletionFlags(args.before, args.missionAreas)
  const aft = missionCompletionFlags(args.after, args.missionAreas)
  let bonusXp = 0
  const completedIndexes: number[] = []
  if (!bef[0] && aft[0]) {
    bonusXp += DAILY_MISSION_XP_REWARDS[0]
    completedIndexes.push(0)
  }
  if (!bef[1] && aft[1]) {
    bonusXp += DAILY_MISSION_XP_REWARDS[1]
    completedIndexes.push(1)
  }
  if (!bef[2] && aft[2]) {
    bonusXp += DAILY_MISSION_XP_REWARDS[2]
    completedIndexes.push(2)
  }
  return { bonusXp, completedIndexes }
}

/** Requer coluna `topic_performance.area_key` (migration 20260619120000). Fallback TOPICO_TO_AREA em pickMissionAreasFromTopicPerformance. */
export async function missionAreasForUser(
  admin: ServiceClient,
  userId: string,
): Promise<[string, string, string]> {
  const { data: rows, error } = await admin
    .from('topic_performance')
    .select('topico_value, total_answered, total_correct, accuracy_pct, area_key')
    .eq('user_id', userId)

  if (error) {
    console.error('[daily-mission-bonus] topic_performance:', error)
    return [DEFAULT_MISSION_AREAS[0], DEFAULT_MISSION_AREAS[1], DEFAULT_MISSION_AREAS[2]]
  }
  return pickMissionAreasFromTopicPerformance((rows ?? []) as TpRow[])
}

/** Aplica +1 resposta na área da questão — mesma regra que `fetchStudyTodayByArea` / `pet-me`. */
export function applyAnswerToStudyToday(
  map: StudyTodayByArea,
  attribution: {
    topicoSlug?: string | null
    clientAreaKey?: string | null
  },
  isCorrect: boolean,
): StudyTodayByArea {
  const area = areaKeyForPracticeAnswer({
    topicoSlug: attribution.topicoSlug,
    clientAreaKey: attribution.clientAreaKey,
  })
  if (!isCountablePracticeArea(area)) return map
  const next: StudyTodayByArea = { ...map }
  const cur = next[area] ?? { answered: 0, correct: 0 }
  next[area] = {
    answered: cur.answered + 1,
    correct: cur.correct + (isCorrect ? 1 : 0),
  }
  return next
}
