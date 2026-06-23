import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { MaterialEmbedChunk } from './edge-api-types.ts'
import { embedTexts, estimateEmbeddingCostUsd, formatPgvector } from './openai-embeddings.ts'

export type PersistMaterialEmbeddingsParams = {
  material_id: string
  class_id: string
  organization_id: string
  chunks: MaterialEmbedChunk[]
  openAiKey: string
}

export type PersistMaterialEmbeddingsResult = {
  indexed: number
  cost_estimate_usd: number
}

export async function persistMaterialEmbeddings(
  adminClient: SupabaseClient,
  params: PersistMaterialEmbeddingsParams,
): Promise<PersistMaterialEmbeddingsResult> {
  const { material_id, class_id, organization_id, chunks, openAiKey } = params

  const texts = chunks.map((c) => c.text)
  const { embeddings, totalTokens } = await embedTexts(texts, openAiKey)

  const rows = chunks.map((chunk, index) => ({
    material_id,
    class_id,
    organization_id,
    chunk_index: index,
    chunk_text: chunk.text,
    chunk_tokens: chunk.tokens ?? null,
    embedding: formatPgvector(embeddings[index]),
    metadata: chunk.metadata ?? {},
  }))

  const { error: upsertError } = await adminClient
    .from('material_embeddings')
    .upsert(rows, { onConflict: 'material_id,chunk_index' })

  if (upsertError) {
    throw new Error(`Erro ao persistir embeddings: ${upsertError.message}`)
  }

  if (chunks.length > 0) {
    const { error: pruneError } = await adminClient
      .from('material_embeddings')
      .delete()
      .eq('material_id', material_id)
      .gte('chunk_index', chunks.length)

    if (pruneError) {
      console.warn('[material-embed] falha ao remover chunks obsoletos:', pruneError.message)
    }
  } else {
    await adminClient.from('material_embeddings').delete().eq('material_id', material_id)
  }

  return {
    indexed: chunks.length,
    cost_estimate_usd: estimateEmbeddingCostUsd(totalTokens),
  }
}
