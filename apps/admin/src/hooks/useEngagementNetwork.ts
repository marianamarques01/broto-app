import { useCallback, useEffect, useState } from 'react'
import type { NetworkEngagementFilters, NetworkEngagementGetResponse } from '@broto/shared'
import { api } from '@/lib/api-client'

export function useEngagementNetwork(
  networkOrgId: string | undefined,
  filters: NetworkEngagementFilters,
) {
  const [data, setData] = useState<NetworkEngagementGetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!networkOrgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getWithParams<NetworkEngagementGetResponse>('engagement-network-get', {
        networkOrgId,
        regional: filters.regional,
        grade: filters.grade,
        periodDays: filters.periodDays,
      })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar painel de rede')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [networkOrgId, filters.regional, filters.grade, filters.periodDays])

  useEffect(() => {
    if (!networkOrgId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.getWithParams<NetworkEngagementGetResponse>('engagement-network-get', {
          networkOrgId,
          regional: filters.regional,
          grade: filters.grade,
          periodDays: filters.periodDays,
        })
        if (!cancelled) setData(res)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar painel de rede')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [networkOrgId, filters.regional, filters.grade, filters.periodDays])

  return { data, loading, error, reload }
}
