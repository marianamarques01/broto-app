import { createDailyMissions, type AreaKey } from '@broto/shared'
import { localStorageAdapter } from '@/lib/adapters/local-storage-adapter'

export type { AreaKey, DailyMissionsState } from '@broto/shared'

const missions = createDailyMissions(localStorageAdapter)

const listeners = new Set<() => void>()

function notifyDailyMissions(): void {
  listeners.forEach((l) => l())
}

export function subscribeDailyMissions(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export async function getDailyMissionsState() {
  return missions.getDailyMissionsState()
}

export async function incrementDailyAreaAnswer(params: { areaKey: AreaKey; isCorrect: boolean }) {
  const next = await missions.incrementDailyAreaAnswer(params)
  notifyDailyMissions()
  return next
}
