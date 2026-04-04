import { createDailyMissions, type AreaKey } from '@broto/shared'
import { asyncStorageAdapter } from '@/lib/adapters/async-storage-adapter'

const missions = createDailyMissions(asyncStorageAdapter)

export type { AreaKey, DailyMissionsState } from '@broto/shared'

export const getDailyMissionsState = () => missions.getDailyMissionsState()
export const incrementDailyAreaAnswer = (params: { areaKey: AreaKey; isCorrect: boolean }) =>
  missions.incrementDailyAreaAnswer(params)
export const resetDailyMissionsState = () => missions.resetDailyMissionsState()
