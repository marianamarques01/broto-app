import { useCallback, useEffect, useState } from 'react'
import type { EngagementOrgGetResponse } from '@broto/shared'
import { api } from '@/lib/api-client'

export function useEngagementOrg(organizationId: string | undefined) {
  const [data, setData] = useState<EngagementOrgGetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getWithParams<EngagementOrgGetResponse>('engagement-org-get', {
        organizationId,
      })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar engajamento da escola')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (!organizationId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.getWithParams<EngagementOrgGetResponse>('engagement-org-get', {
          organizationId,
        })
        if (!cancelled) setData(res)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar engajamento da escola')
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
  }, [organizationId])

  return { data, loading, error, reload }
}
