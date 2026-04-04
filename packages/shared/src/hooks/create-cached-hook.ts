/**
 * Generic factory for module-level cached data stores.
 * Deduplicates in-flight requests, supports staleness window,
 * and uses a generation counter to prevent stale responses
 * from overwriting fresher data (fixes race condition on refresh).
 *
 * This module is React-free — each app provides a thin hook wrapper
 * using its own React instance (avoids dual-React in monorepos).
 */

export interface CachedStore<T> {
  getCached: () => T | null
  isLoading: () => boolean
  subscribe: (listener: () => void) => () => void
  fetchData: () => Promise<T | null>
  refresh: () => void
  refreshIfStale: () => void
}

const STALE_MS = 30_000 // 30 seconds — skip refetch if data is fresh

export function createCachedStore<T>(fetcher: () => Promise<T>): CachedStore<T> {
  let cached: T | null = null
  let inflight: Promise<T | null> | null = null
  let fetchedAt = 0
  let generation = 0
  const listeners = new Set<() => void>()

  function notifyListeners() {
    listeners.forEach((fn) => fn())
  }

  function fetchData(): Promise<T | null> {
    if (inflight) return inflight

    const gen = generation

    inflight = fetcher()
      .then((data) => {
        if (gen === generation) {
          cached = data
          fetchedAt = Date.now()
        }
        return cached
      })
      .catch(() => {
        if (gen === generation) {
          cached = null
        }
        return null
      })
      .finally(() => {
        if (gen === generation) {
          inflight = null
        }
        notifyListeners()
      })

    return inflight
  }

  function refresh() {
    generation++
    cached = null
    inflight = null
    fetchedAt = 0
    fetchData()
  }

  function refreshIfStale() {
    if (cached === null || Date.now() - fetchedAt > STALE_MS) {
      fetchData()
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function getCached() {
    return cached
  }
  function isLoading() {
    return cached === null && inflight !== null
  }

  return { getCached, isLoading, subscribe, fetchData, refresh, refreshIfStale }
}
