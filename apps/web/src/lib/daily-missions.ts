import { createDailyMissions, type AreaKey, DAILY_MISSIONS_STORAGE_KEY } from '@broto/shared'
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

/** Zera só o estado local das missões (ex.: após resetar histórico de prática na conta). */
export function clearDailyMissionsLocal(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(DAILY_MISSIONS_STORAGE_KEY)
  notifyDailyMissions()
}
