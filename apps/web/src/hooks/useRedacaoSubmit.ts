import { useCallback, useState } from 'react'
import type { RedacaoModo, RedacaoSubmitRequest, RedacaoSubmitResponse } from '@broto/shared'
import { api } from '@/lib/api-client'
import { useClass } from '@/hooks/useClass'

type SubmitInput = {
  temaId: string
  texto: string
  modo: RedacaoModo
  tempoSegundos: number | null
  redacaoId?: string | null
}

export function useRedacaoSubmit() {
  const { currentClass } = useClass()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitRedacao = useCallback(
    async (input: SubmitInput): Promise<RedacaoSubmitResponse | null> => {
      setSubmitting(true)
      setError(null)

      const body: RedacaoSubmitRequest = {
        tema_id: input.temaId,
        texto: input.texto,
        modo: input.modo,
        tempo_segundos: input.tempoSegundos,
        redacao_id: input.redacaoId ?? undefined,
        class_id: currentClass?.id ?? null,
      }

      try {
        const response = await api.post<RedacaoSubmitResponse>('/api/redacao/submit', {
          ...body,
        })
        return response
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível enviar a redação.'
        setError(message)
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [currentClass?.id],
  )

  return { submitRedacao, submitting, error, setError }
}
