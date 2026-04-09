import { AREA_CONFIG } from '@/lib/area-config'
import type { AreaStat } from '@/hooks/useProgress'
import type { DailyMissionsState } from '@broto/shared'

const DEFAULT_MISSION_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'] as const

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
  if (!serverToday || Object.keys(serverToday).length === 0) return daily.byArea
  const keys = new Set([
    ...Object.keys(daily.byArea),
    ...Object.keys(serverToday),
  ])
  const out: DailyMissionsState['byArea'] = {}
  for (const k of keys) {
    const l = daily.byArea[k] ?? { answered: 0, correct: 0 }
    const s = serverToday[k] ?? { answered: 0, correct: 0 }
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
    title: `3 questões de ${areaLabel(missionAreas[0])}`,
    subtitle: 'Área com maior oportunidade',
    xp: 30,
    areaKey: missionAreas[0],
    done: areaAnswered(missionAreas[0]) >= 3,
    locked: false,
  }
  const m1 = {
    title: `2 questões de ${areaLabel(missionAreas[1])}`,
    subtitle: 'Continue progredindo',
    xp: 20,
    areaKey: missionAreas[1],
    done: areaAnswered(missionAreas[1]) >= 2,
    locked: areaAnswered(missionAreas[0]) < 3,
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
