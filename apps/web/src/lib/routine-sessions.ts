import type { AreaStat } from '@/hooks/useProgress'
import type { DailyMissionsState } from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import { buildDailyMissions } from '@/lib/build-daily-missions'

export type RoutineSessionStatus = 'completed' | 'active' | 'pending'

export interface RoutineSession {
  id: string
  startLabel: string
  topicLabel: string
  areaKey: string
  areaLabel: string
  kindLabel: string
  durationMin: number
  xp: number
  status: RoutineSessionStatus
  locked: boolean
  accuracyBadge: string | null
}

const START_LABELS = ['08:00', '09:05', '10:00', '14:00'] as const

function mergeByAreaWithServer(
  daily: DailyMissionsState,
  serverToday?: Record<string, { answered: number; correct: number }>,
): DailyMissionsState['byArea'] {
  if (!serverToday || Object.keys(serverToday).length === 0) return daily.byArea
  const keys = new Set([...Object.keys(daily.byArea), ...Object.keys(serverToday)])
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

function pickTopicLabel(areaKey: string, areas: AreaStat[] | undefined): string {
  const a = areas?.find((x) => x.value === areaKey)
  if (!a) return 'Prática guiada'
  const sorted = [...a.topicos]
    .filter((t) => t.totalAnswered > 0)
    .sort((x, y) => x.accuracyPct - y.accuracyPct)
  const t = sorted[0]
  return t?.label ?? `Foco em ${AREA_CONFIG[areaKey]?.label ?? a.label}`
}

function pickFourthAreaKey(
  areas: AreaStat[] | undefined,
  used: string[],
): string {
  const sortedKeys = areas?.length
    ? [...areas]
        .filter((a) => a.totalAnswered >= 1)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .map((a) => a.value)
    : []
  const fallback = ['ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas'] as const
  const next = sortedKeys.find((k) => !used.includes(k))
  if (next) return next
  const alt = fallback.find((k) => !used.includes(k))
  return alt ?? 'ciencias-natureza'
}

export function buildRoutineSessions(
  areas: AreaStat[] | undefined,
  daily: DailyMissionsState,
  horasPorDia: number,
  studyTodayByArea?: Record<string, { answered: number; correct: number }>,
): RoutineSession[] {
  const missions = buildDailyMissions(areas, daily, studyTodayByArea)
  const byArea = mergeByAreaWithServer(daily, studyTodayByArea)
  const keys = [missions[0].areaKey, missions[1].areaKey, missions[2].areaKey]
  const fourthKey = pickFourthAreaKey(areas, keys)
  const allKeys = [...keys, fourthKey]

  const slotMin = Math.max(25, Math.round((horasPorDia * 60) / 4))

  const done = [
    missions[0].done,
    missions[1].done,
    missions[2].done,
    missions[2].done && (byArea[fourthKey]?.answered ?? 0) >= 5,
  ]

  const locked = [
    false,
    !done[0],
    !done[0] || !done[1],
    !done[0] || !done[1] || !done[2],
  ]

  let activeIndex = -1
  for (let i = 0; i < 4; i++) {
    if (!done[i] && !locked[i]) {
      activeIndex = i
      break
    }
  }

  return allKeys.map((areaKey, i) => {
    const area = areas?.find((a) => a.value === areaKey)
    const acc =
      area && area.totalAnswered > 0 ? `${area.accuracyPct}%` : null

    let status: RoutineSessionStatus
    if (done[i]) status = 'completed'
    else if (i === activeIndex) status = 'active'
    else status = 'pending'

    const topicLabel =
      i < 3 ? pickTopicLabel(areaKey, areas) : pickTopicLabel(fourthKey, areas)

    const xpVals = [missions[0].xp, missions[1].xp, missions[2].xp, 25]

    return {
      id: `routine-slot-${i}`,
      startLabel: START_LABELS[i],
      topicLabel,
      areaKey,
      areaLabel: AREA_CONFIG[areaKey]?.label ?? area?.label ?? 'Área',
      kindLabel: 'Questões',
      durationMin: slotMin,
      xp: xpVals[i],
      status,
      locked: locked[i],
      accuracyBadge: done[i] ? acc : null,
    }
  })
}

export function countCompletedSessions(sessions: RoutineSession[]): number {
  return sessions.filter((s) => s.status === 'completed').length
}
