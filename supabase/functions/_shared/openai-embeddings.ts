/** OpenAI text-embedding-3-small — batches e estimativa de custo. */

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536
export const EMBEDDING_BATCH_SIZE = 20
/** USD por 1M tokens (text-embedding-3-small, mar/2026). */
export const EMBEDDING_COST_PER_MILLION_TOKENS_USD = 0.02

type OpenAiEmbeddingResponse = {
  data: Array<{ index: number; embedding: number[] }>
  usage?: { total_tokens?: number }
  error?: { message?: string }
}

export function estimateEmbeddingCostUsd(totalTokens: number): number {
  if (!Number.isFinite(totalTokens) || totalTokens <= 0) return 0
  return (totalTokens / 1_000_000) * EMBEDDING_COST_PER_MILLION_TOKENS_USD
}

/** Formato pgvector para PostgREST. */
export function formatPgvector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

export async function embedTexts(
  texts: string[],
  apiKey: string,
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  if (texts.length === 0) {
    return { embeddings: [], totalTokens: 0 }
  }

  const allEmbeddings: number[][] = new Array(texts.length)
  let totalTokens = 0

  for (let offset = 0; offset < texts.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(offset, offset + EMBEDDING_BATCH_SIZE)

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    })

    const body = (await res.json()) as OpenAiEmbeddingResponse
    if (!res.ok) {
      const msg = body.error?.message ?? `OpenAI embeddings HTTP ${res.status}`
      throw new Error(msg)
    }

    const batchTokens = body.usage?.total_tokens ?? 0
    totalTokens += batchTokens

    const sorted = [...body.data].sort((a, b) => a.index - b.index)
    for (let i = 0; i < sorted.length; i++) {
      allEmbeddings[offset + i] = sorted[i].embedding
    }
  }

  return { embeddings: allEmbeddings, totalTokens }
}
