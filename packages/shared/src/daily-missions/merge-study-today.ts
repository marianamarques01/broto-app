import { sanitizeStudyTodayByArea } from '../enem-area-display'
import type { DailyMissionsState } from '../types/daily-missions'

export type StudyTodayByArea = Record<string, { answered: number; correct: number }>

/**
 * Mescla contagens locais (`daily-missions`) com `studyTodayByArea` do servidor,
 * usando o máximo de cada lado por área.
 */
export function mergeByAreaWithServer(
  daily: DailyMissionsState,
  serverToday?: StudyTodayByArea,
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
