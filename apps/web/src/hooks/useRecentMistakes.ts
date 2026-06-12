import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { subscribeRecentMistakesInvalidation } from '@/lib/recent-mistakes-invalidate'
import type { RecentMistakesResponse } from '@broto/shared'
import { API_PATH_USER_RECENT_MISTAKES } from '@broto/shared'

const STALE_MS = 30_000
let cached: RecentMistakesResponse | null = null
let lastFetch = 0
let inflight: Promise<RecentMistakesResponse> | null = null

async function fetchRecentMistakes(): Promise<RecentMistakesResponse> {
  const now = Date.now()
  if (cached && now - lastFetch < STALE_MS) return cached
  if (inflight) return inflight

  inflight = api
    .get<RecentMistakesResponse>(API_PATH_USER_RECENT_MISTAKES)
    .then((data) => {
      cached = data
      lastFetch = Date.now()
      return data
    })
    .catch(() => ({ mistakes: [] }) as RecentMistakesResponse)
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function bustRecentMistakesCache(): void {
  cached = null
  lastFetch = 0
}

export function useRecentMistakes() {
  const [data, setData] = useState<RecentMistakesResponse | null>(cached)
  const [loading, setLoading] = useState(cached === null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const next = await fetchRecentMistakes()
      if (!cancelled) {
        setData(next)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [version])

  useEffect(() => {
    return subscribeRecentMistakesInvalidation(() => {
      bustRecentMistakesCache()
      setVersion((v) => v + 1)
    })
  }, [])

  return {
    mistakes: data?.mistakes ?? [],
    loading,
    refresh: () => {
      bustRecentMistakesCache()
      setVersion((v) => v + 1)
    },
  }
}
