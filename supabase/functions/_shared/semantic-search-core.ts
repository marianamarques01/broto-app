import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { embedTexts, formatPgvector } from './openai-embeddings.ts'
import {
  SEMANTIC_SEARCH_DEFAULT_LIMIT,
  SEMANTIC_SEARCH_DEFAULT_THRESHOLD,
  SEMANTIC_SEARCH_FALLBACK_THRESHOLD,
} from './edge-api-types.ts'

export type SemanticSearchChunk = {
  id: string
  chunk_text: string
  similarity: number
  metadata: Record<string, unknown>
  material_id: string
}

type MatchMaterialChunkRow = {
  id: string
  chunk_text: string
  similarity: number
  metadata: Record<string, unknown>
  material_id: string
}

export type SearchMaterialChunksParams = {
  query: string
  class_id: string
  openAiKey: string
  limit?: number
  similarity_threshold?: number
}

export async function searchMaterialChunks(
  adminClient: SupabaseClient,
  params: SearchMaterialChunksParams,
): Promise<SemanticSearchChunk[]> {
  const limit = params.limit ?? SEMANTIC_SEARCH_DEFAULT_LIMIT
  const similarity_threshold = params.similarity_threshold ?? SEMANTIC_SEARCH_DEFAULT_THRESHOLD

  const { embeddings } = await embedTexts([params.query], params.openAiKey)
  const queryEmbedding = formatPgvector(embeddings[0])

  async function runSearch(threshold: number): Promise<SemanticSearchChunk[]> {
    const { data: matches, error: rpcError } = await adminClient.rpc('match_material_chunks', {
      query_embedding: queryEmbedding,
      match_class_id: params.class_id,
      match_count: limit,
      similarity_threshold: threshold,
    })

    if (rpcError) {
      throw new Error(`Erro na busca semântica: ${rpcError.message}`)
    }

    return ((matches ?? []) as MatchMaterialChunkRow[]).map((row) => ({
      id: row.id,
      chunk_text: row.chunk_text,
      similarity: row.similarity,
      metadata: row.metadata ?? {},
      material_id: row.material_id,
    }))
  }

  const primary = await runSearch(similarity_threshold)
  if (primary.length > 0) return primary

  if (similarity_threshold <= SEMANTIC_SEARCH_FALLBACK_THRESHOLD) {
    return primary
  }

  return await runSearch(SEMANTIC_SEARCH_FALLBACK_THRESHOLD)
}
