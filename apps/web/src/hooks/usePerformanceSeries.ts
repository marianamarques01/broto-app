import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createUserPerformanceSeriesFetcher,
  type PerformancePeriod,
  type PerformanceBucket,
} from '@broto/shared'
import { api } from '@/lib/api-client'

const fetchSeries = createUserPerformanceSeriesFetcher((path, body) =>
  api.post(path, body),
)

const invalidateListeners = new Set<() => void>()

/** Chame após uma resposta salva no servidor para atualizar o gráfico sem esperar foco. */
export function invalidatePerformanceSeries(): void {
  invalidateListeners.forEach((l) => l())
}

export function usePerformanceSeries(period: PerformancePeriod): {
  buckets: PerformanceBucket[]
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const [buckets, setBuckets] = useState<PerformanceBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    const sub = () => refresh()
    invalidateListeners.add(sub)
    return () => {
      invalidateListeners.delete(sub)
    }
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const res = await fetchSeries(period)
        if (cancelled) return
        setBuckets(Array.isArray(res.buckets) ? res.buckets : [])
        setError(null)
      } catch (e) {
        if (cancelled) return
        setBuckets([])
        setError(e instanceof Error ? e.message : 'Erro ao carregar desempenho')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period, nonce])

  return useMemo(
    () => ({
      buckets,
      loading,
      error,
      refresh,
    }),
    [buckets, loading, error, refresh],
  )
}
