import { AREA_CONFIG } from '@/lib/area-config'
import type { AreaStat } from '@/hooks/useProgress'
import { sanitizeStudyTodayByArea, type DailyMissionsState } from '@broto/shared'

/** Regras de missões/XP: manter alinhadas a `supabase/functions/_shared/daily-mission-bonus.ts`. */

const DEFAULT_MISSION_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'] as const

/** Meta mínima de questões por missão de volume (primeiras duas); também fallback na UI do banco. */
export const DAILY_MISSION_VOLUME_QUEST_GOAL = 5

/** Extrai N de títulos como "5 questões de Matemática…" para barras de progresso. */
export function parseDailyMissionQuestionCount(title: string): number | null {
  const m = /^(\d+)\s+questões\b/i.exec(title.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

function areaLabel(key: string) {
  return AREA_CONFIG[key]?.label ?? 'Questões'
}

export interface DailyMissionItem {
  title: string
  subtitle: string
  xp: number
  areaKey: string
  done: boolean
  locked: boolean
}

function mergeByAreaWithServer(
  daily: DailyMissionsState,
  serverToday?: Record<string, { answered: number; correct: number }>,
): DailyMissionsState['byArea'] {
  const server = sanitizeStudyTodayByArea(serverToday)
  if (Object.keys(server).length === 0) return daily.byArea
  const keys = new Set([...Object.keys(daily.byArea), ...Object.keys(server)])
  const out: DailyMissionsState['byArea'] = {}
  for (const k of keys) {
    const l = daily.byArea[k] ?? { answered: 0, correct: 0 }
    const s = server[k] ?? { answered: 0, correct: 0 }
    out[k] = {
      answered: Math.max(l.answered, s.answered),
      correct: Math.max(l.correct, s.correct),
    }
  }
  return out
}

export function buildDailyMissions(
  areas: AreaStat[] | undefined,
  daily: DailyMissionsState,
  /** Contagens do dia vindas do banco (`pet-me`) para alinhar missões ao servidor. */
  studyTodayByArea?: Record<string, { answered: number; correct: number }>,
): DailyMissionItem[] {
  const byArea = mergeByAreaWithServer(daily, studyTodayByArea)
  const sortedKeys = areas?.length
    ? [...areas]
        .filter((a) => a.totalAnswered >= 1)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .map((a) => a.value)
    : []

  const missionAreas = [
    sortedKeys[0] ?? DEFAULT_MISSION_AREAS[0],
    sortedKeys[1] ?? DEFAULT_MISSION_AREAS[1],
    sortedKeys[2] ?? DEFAULT_MISSION_AREAS[2],
  ]

  const areaAnswered = (key: string) => byArea[key]?.answered ?? 0
  const areaCorrect = (key: string) => byArea[key]?.correct ?? 0
  const areaAccuracy = (key: string) => {
    const a = areaAnswered(key)
    if (a === 0) return null
    return Math.round((areaCorrect(key) / a) * 100)
  }

  const m0 = {
    title: `${DAILY_MISSION_VOLUME_QUEST_GOAL} questões de ${areaLabel(missionAreas[0])}`,
    subtitle: 'Área com maior oportunidade',
    xp: 30,
    areaKey: missionAreas[0],
    done: areaAnswered(missionAreas[0]) >= DAILY_MISSION_VOLUME_QUEST_GOAL,
    locked: false,
  }
  const m1 = {
    title: `${DAILY_MISSION_VOLUME_QUEST_GOAL} questões de ${areaLabel(missionAreas[1])}`,
    subtitle: 'Continue progredindo',
    xp: 20,
    areaKey: missionAreas[1],
    done: areaAnswered(missionAreas[1]) >= DAILY_MISSION_VOLUME_QUEST_GOAL,
    locked: areaAnswered(missionAreas[0]) < DAILY_MISSION_VOLUME_QUEST_GOAL,
  }
  const m2 = {
    title: 'Atingir 70% de acerto',
    subtitle:
      areaAccuracy(missionAreas[2]) !== null
        ? `Acerto atual: ${areaAccuracy(missionAreas[2])}%`
        : 'Acerto atual: —',
    xp: 50,
    areaKey: missionAreas[2],
    done: areaAnswered(missionAreas[2]) >= 5 && (areaAccuracy(missionAreas[2]) ?? 0) >= 70,
    locked: areaAnswered(missionAreas[2]) < 5,
  }
  return [m0, m1, m2]
}
