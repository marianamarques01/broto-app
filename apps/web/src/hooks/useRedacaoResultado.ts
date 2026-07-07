import { useCallback, useEffect, useState } from 'react'
import type { RedacaoGetResponse } from '@broto/shared'
import { api } from '@/lib/api-client'

export function useRedacaoResultado(redacaoId: string | undefined) {
  const [data, setData] = useState<RedacaoGetResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    if (!redacaoId) return

    let cancelled = false

    async function fetchResultado() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.getWithParams<RedacaoGetResponse>('/api/redacao/get', {
          redacao_id: redacaoId,
        })
        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Não foi possível carregar o resultado da redação.'
          setError(message)
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchResultado()
    return () => {
      cancelled = true
    }
  }, [redacaoId, reloadToken])

  const status = data?.redacao.status
  const needsPoll = status === 'enviada' || status === 'corrigindo'

  useEffect(() => {
    if (!redacaoId || !needsPoll) return

    const id = window.setInterval(() => {
      setReloadToken((token) => token + 1)
    }, 4000)

    return () => window.clearInterval(id)
  }, [needsPoll, redacaoId])

  return { data, loading, error, reload }
}
