/**
 * Bônus de XP das missões diárias ao concluir metas — alinhado a
 * `apps/web/src/lib/build-daily-missions.ts`. Manter regras sincronizadas.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  areaKeyForPracticeAnswer,
  isCountablePracticeArea,
  areaKeyFromTopico,
  AREA_ROLLUP_PREFIX,
} from './enem-topic-area.ts'

type ServiceClient = ReturnType<typeof createClient>

/** Mesma ordem padrão que `build-daily-missions.ts` (fallbacks). */
const DEFAULT_MISSION_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'] as const

const XP_MISSION_0 = 30
const XP_MISSION_1 = 20
const XP_MISSION_2 = 50

/** topico_value → área + label — espelha `user-progress/index.ts`. */
const TOPICO: Record<string, { area: string; label: string }> = {
  'interpretacao-textual': { area: 'linguagens', label: 'Interpretação Textual' },
  'interpretacao-texto': { area: 'linguagens', label: 'Interpretação Textual' },
  literatura: { area: 'linguagens', label: 'Literatura Brasileira' },
  gramatica: { area: 'linguagens', label: 'Gramática e Norma Culta' },
  'generos-textuais': { area: 'linguagens', label: 'Gêneros Textuais' },
  'variacoes-linguisticas': { area: 'linguagens', label: 'Variações Linguísticas' },
  'historia-brasil': { area: 'ciencias-humanas', label: 'História do Brasil' },
  'geografia-politica': { area: 'ciencias-humanas', label: 'Geografia Política' },
  filosofia: { area: 'ciencias-humanas', label: 'Filosofia' },
  sociologia: { area: 'ciencias-humanas', label: 'Sociologia' },
  'geografia-fisica': { area: 'ciencias-humanas', label: 'Geografia Física' },
  genetica: { area: 'ciencias-natureza', label: 'Genética' },
  ecologia: { area: 'ciencias-natureza', label: 'Ecologia' },
  'quimica-organica': { area: 'ciencias-natureza', label: 'Química Orgânica' },
  termodinamica: { area: 'ciencias-natureza', label: 'Termodinâmica' },
  citologia: { area: 'ciencias-natureza', label: 'Citologia' },
  funcoes: { area: 'matematica', label: 'Funções' },
  'geometria-plana': { area: 'matematica', label: 'Geometria Plana' },
  probabilidade: { area: 'matematica', label: 'Probabilidade e Estatística' },
  porcentagem: { area: 'matematica', label: 'Porcentagem e Razão' },
  combinatoria: { area: 'matematica', label: 'Análise Combinatória' },
  [`${AREA_ROLLUP_PREFIX}linguagens`]: {
    area: 'linguagens',
    label: 'Prática registrada nesta área',
  },
  [`${AREA_ROLLUP_PREFIX}ciencias-humanas`]: {
    area: 'ciencias-humanas',
    label: 'Prática registrada nesta área',
  },
  [`${AREA_ROLLUP_PREFIX}ciencias-natureza`]: {
    area: 'ciencias-natureza',
    label: 'Prática registrada nesta área',
  },
  [`${AREA_ROLLUP_PREFIX}matematica`]: {
    area: 'matematica',
    label: 'Prática registrada nesta área',
  },
}

const AREA_ORDER: { value: string }[] = [
  { value: 'linguagens' },
  { value: 'ciencias-humanas' },
  { value: 'ciencias-natureza' },
  { value: 'matematica' },
]

type TpRow = {
  topico_value: string
  total_answered: number
  total_correct: number
  accuracy_pct: number
  area_key?: string | null
}

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

  const answers = (todayRows ?? []) as {
    question_id: string
    acertou: boolean
    answer_area_key?: string | null
  }[]
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
        const rec = row as { question_id?: string; topico_value?: string }
        if (rec.question_id) topicByQid.set(rec.question_id, rec.topico_value ?? null)
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
function pickMissionAreasFromTopicPerformance(rows: TpRow[]): [string, string, string] {
  const areaMap = new Map<string, { value: string; totalAnswered: number; totalCorrect: number }>()

  for (const a of AREA_ORDER) {
    areaMap.set(a.value, { value: a.value, totalAnswered: 0, totalCorrect: 0 })
  }

  for (const r of rows) {
    const meta = TOPICO[r.topico_value]
    const fromDb = r.area_key && String(r.area_key).trim()
    const resolved =
      fromDb && areaMap.has(fromDb)
        ? fromDb
        : meta?.area && areaMap.has(meta.area)
          ? meta.area
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
  const m0 = a0.answered >= 5
  const m1 = a1.answered >= 5 && a0.answered >= 5
  const m2 = a2.answered >= 5 && (acc2 ?? 0) >= 70
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
    bonusXp += XP_MISSION_0
    completedIndexes.push(0)
  }
  if (!bef[1] && aft[1]) {
    bonusXp += XP_MISSION_1
    completedIndexes.push(1)
  }
  if (!bef[2] && aft[2]) {
    bonusXp += XP_MISSION_2
    completedIndexes.push(2)
  }
  return { bonusXp, completedIndexes }
}

export async function missionAreasForUser(
  admin: ServiceClient,
  userId: string,
): Promise<[string, string, string]> {
  const { data: rows, error } = await admin
    .from('topic_performance')
    .select('topico_value, total_answered, total_correct, accuracy_pct, area_key')
    .eq('user_id', userId)

  if (error) {
    const { data: rows2, error: err2 } = await admin
      .from('topic_performance')
      .select('topico_value, total_answered, total_correct, accuracy_pct')
      .eq('user_id', userId)
    if (err2) {
      console.error('[daily-mission-bonus] topic_performance:', err2)
      return [DEFAULT_MISSION_AREAS[0], DEFAULT_MISSION_AREAS[1], DEFAULT_MISSION_AREAS[2]]
    }
    return pickMissionAreasFromTopicPerformance((rows2 ?? []) as TpRow[])
  }
  return pickMissionAreasFromTopicPerformance((rows ?? []) as TpRow[])
}

/** Aplica +1 resposta na área da questão (espelha o insert já persistido). */
export function applyAnswerToStudyToday(
  map: StudyTodayByArea,
  topico: string | undefined,
  isCorrect: boolean,
): StudyTodayByArea {
  const area = areaKeyFromTopico(topico)
  if (!isCountablePracticeArea(area)) return map
  const next: StudyTodayByArea = { ...map }
  const cur = next[area] ?? { answered: 0, correct: 0 }
  next[area] = {
    answered: cur.answered + 1,
    correct: cur.correct + (isCorrect ? 1 : 0),
  }
  return next
}
