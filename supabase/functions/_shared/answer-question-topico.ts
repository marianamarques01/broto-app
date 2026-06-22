import { rollupTopicPerformanceSlug } from '@broto/shared/lib/topico-to-area.ts'

export type QuestionTopicoHints = {
  topico_value?: string | null
  topico_slug?: string | null
}

/** Resolve tópico para upsert de `topic_performance` / BKT. */
export function resolveEffectiveTopico(params: {
  mappedTopico?: string
  clientAreaKey?: string | null
  question?: QuestionTopicoHints | null
}): string | undefined {
  let resolvedTopico =
    params.mappedTopico != null && String(params.mappedTopico).trim()
      ? String(params.mappedTopico).trim()
      : undefined

  if (!resolvedTopico && params.clientAreaKey) {
    resolvedTopico = rollupTopicPerformanceSlug(params.clientAreaKey)
  }

  const q = params.question
  if (!resolvedTopico && q?.topico_value) {
    const v = String(q.topico_value).trim()
    resolvedTopico = v || undefined
  }
  if (!resolvedTopico && q?.topico_slug) {
    const v = String(q.topico_slug).trim()
    resolvedTopico = v || undefined
  }

  return resolvedTopico
}
