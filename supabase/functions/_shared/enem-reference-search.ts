import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { embedTexts, formatPgvector } from './openai-embeddings.ts'
import {
  SEMANTIC_SEARCH_DEFAULT_LIMIT,
  SEMANTIC_SEARCH_DEFAULT_THRESHOLD,
  SEMANTIC_SEARCH_FALLBACK_THRESHOLD,
} from './edge-api-types.ts'
import type { EnemCompetencia, EnemReferenceSection } from './enem-reference-chunking.ts'

export type EnemReferenceSearchChunk = {
  id: string
  chunk_text: string
  similarity: number
  metadata: Record<string, unknown>
  document_id: string
}

type MatchEnemReferenceRow = {
  id: string
  chunk_text: string
  similarity: number
  metadata: Record<string, unknown>
  document_id: string
}

export type SearchEnemReferenceChunksParams = {
  query: string
  openAiKey: string
  match_competence?: EnemCompetencia | null
  match_section?: EnemReferenceSection | null
  limit?: number
  similarity_threshold?: number
}

function formatChunkMetadataHeader(metadata: Record<string, unknown>): string {
  const parts: string[] = []
  const section = metadata.section
  if (typeof section === 'string' && section.trim()) {
    parts.push(`seção=${section.trim()}`)
  }
  const competencia = metadata.competencia
  if (typeof competencia === 'string' && competencia.trim()) {
    parts.push(`competência ${competencia.trim()}`)
  }
  const criterio = metadata.criterio_nivel
  if (typeof criterio === 'number' && Number.isFinite(criterio)) {
    parts.push(`nível ${criterio}`)
  }
  const sectionTitle = metadata.section_title
  if (typeof sectionTitle === 'string' && sectionTitle.trim()) {
    parts.push(sectionTitle.trim())
  }
  const page = metadata.page_number
  if (typeof page === 'number' && Number.isFinite(page)) {
    parts.push(`p.${page}`)
  }
  return parts.length > 0 ? `[${parts.join(' · ')}] ` : ''
}

/** Formata trechos da Cartilha INEP para injeção no prompt de correção. Retorna null se vazio. */
export function formatEnemReferenceContext(chunks: EnemReferenceSearchChunk[]): string | null {
  if (chunks.length === 0) return null

  const lines = chunks.map((chunk, index) => {
    const header = formatChunkMetadataHeader(chunk.metadata)
    const score =
      typeof chunk.similarity === 'number' && Number.isFinite(chunk.similarity)
        ? chunk.similarity.toFixed(2)
        : undefined
    const prefix = score ? `Trecho ${index + 1} (relevância ${score}): ` : `Trecho ${index + 1}: `
    return `${prefix}${header}${chunk.chunk_text.trim()}`
  })

  return [
    '--- Cartilha do Participante INEP (Matriz de Referência) ---',
    lines.join('\n\n'),
    '--- Fim dos trechos normativos ---',
  ].join('\n')
}

export async function searchEnemReferenceChunks(
  adminClient: SupabaseClient,
  params: SearchEnemReferenceChunksParams,
): Promise<EnemReferenceSearchChunk[]> {
  const limit = params.limit ?? SEMANTIC_SEARCH_DEFAULT_LIMIT
  const similarity_threshold = params.similarity_threshold ?? SEMANTIC_SEARCH_DEFAULT_THRESHOLD

  const { embeddings } = await embedTexts([params.query], params.openAiKey)
  const queryEmbedding = formatPgvector(embeddings[0])

  async function runSearch(threshold: number): Promise<EnemReferenceSearchChunk[]> {
    const { data: matches, error: rpcError } = await adminClient.rpc(
      'match_enem_reference_chunks',
      {
        query_embedding: queryEmbedding,
        match_competence: params.match_competence ?? null,
        match_section: params.match_section ?? null,
        match_count: limit,
        similarity_threshold: threshold,
      },
    )

    if (rpcError) {
      throw new Error(`Erro na busca Cartilha INEP: ${rpcError.message}`)
    }

    return ((matches ?? []) as MatchEnemReferenceRow[]).map((row) => ({
      id: row.id,
      chunk_text: row.chunk_text,
      similarity: row.similarity,
      metadata: row.metadata ?? {},
      document_id: row.document_id,
    }))
  }

  const primary = await runSearch(similarity_threshold)
  if (primary.length > 0) return primary

  if (similarity_threshold <= SEMANTIC_SEARCH_FALLBACK_THRESHOLD) {
    return primary
  }

  return await runSearch(SEMANTIC_SEARCH_FALLBACK_THRESHOLD)
}
