import { useCallback, useEffect, useState } from 'react'
import type { RedacaoHistoryResponse } from '@broto/shared'
import { api } from '@/lib/api-client'

export function useRedacaoEvolucao() {
  const [data, setData] = useState<RedacaoHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchEvolucao() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.getWithParams<RedacaoHistoryResponse>('/api/redacao/history', {})
        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Não foi possível carregar sua evolução em redação.'
          setError(message)
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchEvolucao()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { data, loading, error, reload }
}
