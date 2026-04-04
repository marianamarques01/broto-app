import { describe, it, expect } from 'vitest'
import { createCachedStore } from './create-cached-hook'

describe('createCachedStore', () => {
  it('never runs more than one fetcher concurrently when refresh() is burst-called', async () => {
    let concurrent = 0
    let maxConcurrent = 0
    let totalCalls = 0

    const fetcher = async () => {
      totalCalls++
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((r) => setTimeout(r, 30))
      concurrent--
      return { v: totalCalls }
    }

    const store = createCachedStore(fetcher)
    store.refresh()
    store.refresh()
    store.refresh()

    await new Promise((r) => setTimeout(r, 200))

    expect(maxConcurrent).toBe(1)
    expect(totalCalls).toBeGreaterThanOrEqual(1)
    expect(totalCalls).toBeLessThanOrEqual(3)
  })
})
