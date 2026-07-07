import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  CalibracaoComparacaoCompetencia,
  CalibracaoMetricasCompetencia,
  RedacaoCalibracaoGetResponse,
  RedacaoCalibracaoListItem,
  RedacaoCalibracaoListResponse,
  RedacaoCalibracaoMetricsResponse,
  RedacaoCalibracaoSubmitResponse,
  RedacaoNotaCompetencia,
} from '@broto/shared'

function parseError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error?: unknown }).error
    if (typeof err === 'string') return err
  }
  return fallback
}

export type CalibracaoSubmitInput = {
  correcao_id: string
  nota_humana_i: RedacaoNotaCompetencia
  nota_humana_ii: RedacaoNotaCompetencia
  nota_humana_iii: RedacaoNotaCompetencia
  nota_humana_iv: RedacaoNotaCompetencia
  nota_humana_v: RedacaoNotaCompetencia
  comentario?: string | null
}

export function useRedacaoCalibracao() {
  const [items, setItems] = useState<RedacaoCalibracaoListItem[]>([])
  const [metrics, setMetrics] = useState<{
    total_revisoes: number
    por_competencia: CalibracaoMetricasCompetencia[]
  } | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [loadingReview, setLoadingReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<RedacaoCalibracaoGetResponse | null>(null)
  const [comparacao, setComparacao] = useState<CalibracaoComparacaoCompetencia[] | null>(null)

  const refetchAll = useCallback(async () => {
    setError(null)

    const listUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redacao-revisao-humana?action=list`
    const metricsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redacao-revisao-humana?action=metrics`

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setError('Sessão expirada')
      setLoadingList(false)
      setLoadingMetrics(false)
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    }

    const [listRes, metricsRes] = await Promise.all([
      fetch(listUrl, { headers }),
      fetch(metricsUrl, { headers }),
    ])

    if (!listRes.ok) {
      const body = (await listRes.json().catch(() => null)) as { error?: string } | null
      setError(parseError(body, 'Erro ao carregar fila de calibração'))
      setItems([])
    } else {
      const body = (await listRes.json()) as RedacaoCalibracaoListResponse
      setItems(body.items ?? [])
    }
    setLoadingList(false)

    if (!metricsRes.ok) {
      const body = (await metricsRes.json().catch(() => null)) as { error?: string } | null
      setError((prev) => prev ?? parseError(body, 'Erro ao carregar métricas'))
      setMetrics(null)
    } else {
      const body = (await metricsRes.json()) as RedacaoCalibracaoMetricsResponse
      setMetrics({
        total_revisoes: body.total_revisoes,
        por_competencia: body.por_competencia ?? [],
      })
    }
    setLoadingMetrics(false)
  }, [])

  useEffect(() => {
    async function load() {
      await refetchAll()
    }

    void load()
  }, [refetchAll])

  const loadReview = useCallback(async (correcaoId: string) => {
    setLoadingReview(true)
    setError(null)
    setComparacao(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setError('Sessão expirada')
      setLoadingReview(false)
      return
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redacao-revisao-humana?action=get&correcao_id=${encodeURIComponent(correcaoId)}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(parseError(body, 'Erro ao carregar redação para revisão'))
      setReview(null)
      setLoadingReview(false)
      return
    }

    const body = (await res.json()) as RedacaoCalibracaoGetResponse
    setReview(body)
    if (body.ia_revelada && body.comparacao) {
      setComparacao(body.comparacao)
    }
    setLoadingReview(false)
  }, [])

  const submitReview = useCallback(
    async (input: CalibracaoSubmitInput): Promise<{ error: string | null }> => {
      setSubmitting(true)
      setError(null)

      const { data, error: invokeError } = await supabase.functions.invoke(
        'redacao-revisao-humana',
        {
          method: 'POST',
          body: { action: 'submit', ...input },
        },
      )

      setSubmitting(false)

      if (invokeError) return { error: invokeError.message }
      const body = data as RedacaoCalibracaoSubmitResponse | { error?: string } | null
      if (!body || !('ok' in body) || !body.ok) {
        return { error: parseError(body, 'Erro ao submeter revisão') }
      }

      setComparacao(body.comparacao)
      setReview((prev) =>
        prev
          ? {
              ...prev,
              ia_revelada: true,
              comparacao: body.comparacao,
              correcao_ia: body.correcao_ia,
              revisao: body.revisao,
            }
          : prev,
      )

      await refetchAll()
      return { error: null }
    },
    [refetchAll],
  )

  const clearReview = useCallback(() => {
    setReview(null)
    setComparacao(null)
    setError(null)
  }, [])

  return {
    items,
    metrics,
    loadingList,
    loadingMetrics,
    loadingReview,
    submitting,
    error,
    review,
    comparacao,
    loadReview,
    submitReview,
    clearReview,
    refetchAll,
  }
}
