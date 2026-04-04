import { describe, it, expect } from 'vitest'
import type { IStorage } from '../storage/istorage'
import { createDailyMissions, DAILY_MISSIONS_STORAGE_KEY } from './core'

function memoryStorage(initial: Record<string, string> = {}): IStorage {
  const m = new Map(Object.entries(initial))
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => {
      m.set(k, v)
    },
    removeItem: async (k) => {
      m.delete(k)
    },
  }
}

describe('createDailyMissions', () => {
  it('increments per area and persists via IStorage', async () => {
    const storage = memoryStorage()
    const dm = createDailyMissions(storage, DAILY_MISSIONS_STORAGE_KEY)
    const a = await dm.incrementDailyAreaAnswer({ areaKey: 'matematica', isCorrect: true })
    expect(a.byArea.matematica).toEqual({ answered: 1, correct: 1 })

    const b = await dm.incrementDailyAreaAnswer({ areaKey: 'matematica', isCorrect: false })
    expect(b.byArea.matematica).toEqual({ answered: 2, correct: 1 })

    const roundTrip = await dm.getDailyMissionsState()
    expect(roundTrip.byArea.matematica).toEqual({ answered: 2, correct: 1 })
  })

  it('propagates corrupt JSON as an error', async () => {
    const storage = memoryStorage({ [DAILY_MISSIONS_STORAGE_KEY]: 'not-json' })
    const dm = createDailyMissions(storage, DAILY_MISSIONS_STORAGE_KEY)
    await expect(dm.getDailyMissionsState()).rejects.toThrow(/JSON/)
  })
})
