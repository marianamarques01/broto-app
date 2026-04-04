import type { IStorage } from '../storage/istorage'
import type { AreaKey, DailyMissionsState } from '../types/daily-missions'

export const DAILY_MISSIONS_STORAGE_KEY = 'broto:daily-missions:v1'

function todayLocalISO(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function emptyState(date: string): DailyMissionsState {
  return { date, byArea: {} }
}

function parseStoredState(raw: string, date: string): DailyMissionsState {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (e) {
    const err = new Error('daily-missions: JSON inválido no armazenamento local')
    ;(err as Error & { cause?: unknown }).cause = e
    throw err
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('daily-missions: formato de estado inválido')
  }
  const o = parsed as Record<string, unknown>
  if (!o.date || typeof o.date !== 'string') throw new Error('daily-missions: campo date inválido')
  if (o.date !== date) return emptyState(date)
  if (!o.byArea || typeof o.byArea !== 'object')
    throw new Error('daily-missions: campo byArea inválido')
  return {
    date: o.date as string,
    byArea: o.byArea as DailyMissionsState['byArea'],
  }
}

export function createDailyMissions(
  storage: IStorage,
  storageKey: string = DAILY_MISSIONS_STORAGE_KEY,
) {
  async function getDailyMissionsState(): Promise<DailyMissionsState> {
    const date = todayLocalISO()
    const raw = await storage.getItem(storageKey)
    if (!raw) return emptyState(date)
    return parseStoredState(raw, date)
  }

  async function incrementDailyAreaAnswer(params: {
    areaKey: AreaKey
    isCorrect: boolean
  }): Promise<DailyMissionsState> {
    const { areaKey, isCorrect } = params
    const current = await getDailyMissionsState()
    const prev = current.byArea[areaKey] ?? { answered: 0, correct: 0 }
    const next: DailyMissionsState = {
      ...current,
      byArea: {
        ...current.byArea,
        [areaKey]: {
          answered: prev.answered + 1,
          correct: prev.correct + (isCorrect ? 1 : 0),
        },
      },
    }
    await storage.setItem(storageKey, JSON.stringify(next))
    return next
  }

  async function resetDailyMissionsState(): Promise<void> {
    await storage.removeItem(storageKey)
  }

  return {
    getDailyMissionsState,
    incrementDailyAreaAnswer,
    resetDailyMissionsState,
  }
}
