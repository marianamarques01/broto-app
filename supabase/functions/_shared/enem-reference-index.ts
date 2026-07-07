import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { embedTexts, estimateEmbeddingCostUsd, formatPgvector } from './openai-embeddings.ts'
import {
  buildEnemReferenceChunksFromPages,
  buildEnemReferenceChunksFromText,
  type EnemReferenceChunk,
} from './enem-reference-chunking.ts'
import { MAX_PDF_PAGES } from './material-storage-fetch.ts'

export const CARTILHA_DOCUMENT_SLUG = 'cartilha-participante-2025'
export const CARTILHA_DEFAULT_TITLE = 'Cartilha do Participante ENEM 2025'

export type EnemReferenceIndexInput = {
  slug: string
  title: string
  version: string
  source_url?: string | null
}

export type EnemReferenceIndexResult =
  | { ok: true; document_id: string; indexed: number; cost_estimate_usd: number }
  | { ok: false; error: string }

export async function extractPdfPagesFromBuffer(
  buffer: ArrayBuffer,
): Promise<Array<{ pageNumber: number; text: string }>> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text: pageTexts } = await extractText(pdf, { mergePages: false })
  const limitedPages = pageTexts.slice(0, MAX_PDF_PAGES)

  const pages = limitedPages
    .map((text, index) => ({ pageNumber: index + 1, text: text.trim() }))
    .filter((p) => p.text.length > 0)

  if (pages.length === 0) {
    throw new Error(
      'PDF sem texto extraível (pode ser scan/imagem). Use um PDF com texto selecionável.',
    )
  }

  if (pageTexts.length > MAX_PDF_PAGES) {
    console.warn(
      `[enem-reference-index] PDF truncado: ${MAX_PDF_PAGES}/${pageTexts.length} páginas indexadas`,
    )
  }

  return pages
}

export function buildEnemReferenceChunks(
  pages: Array<{ pageNumber: number; text: string }> | null,
  plainText: string,
): EnemReferenceChunk[] {
  if (pages && pages.length > 0) {
    return buildEnemReferenceChunksFromPages(pages)
  }
  return buildEnemReferenceChunksFromText(plainText)
}

async function persistEnemReferenceEmbeddings(
  adminClient: SupabaseClient,
  documentId: string,
  chunks: EnemReferenceChunk[],
  openAiKey: string,
): Promise<{ indexed: number; cost_estimate_usd: number }> {
  const texts = chunks.map((c) => c.text)
  const { embeddings, totalTokens } = await embedTexts(texts, openAiKey)

  const rows = chunks.map((chunk, index) => ({
    document_id: documentId,
    chunk_index: index,
    chunk_text: chunk.text,
    chunk_tokens: chunk.tokens ?? null,
    embedding: formatPgvector(embeddings[index]),
    metadata: chunk.metadata,
  }))

  const { error: upsertError } = await adminClient
    .from('enem_reference_embeddings')
    .upsert(rows, { onConflict: 'document_id,chunk_index' })

  if (upsertError) {
    throw new Error(`Erro ao persistir embeddings da Cartilha: ${upsertError.message}`)
  }

  if (chunks.length > 0) {
    const { error: pruneError } = await adminClient
      .from('enem_reference_embeddings')
      .delete()
      .eq('document_id', documentId)
      .gte('chunk_index', chunks.length)

    if (pruneError) {
      console.warn('[enem-reference-index] falha ao remover chunks obsoletos:', pruneError.message)
    }
  } else {
    await adminClient.from('enem_reference_embeddings').delete().eq('document_id', documentId)
  }

  return {
    indexed: chunks.length,
    cost_estimate_usd: estimateEmbeddingCostUsd(totalTokens),
  }
}

async function upsertDocument(
  adminClient: SupabaseClient,
  input: EnemReferenceIndexInput,
): Promise<string> {
  const { data, error } = await adminClient
    .from('enem_reference_documents')
    .upsert(
      {
        slug: input.slug,
        title: input.title,
        version: input.version,
        source_url: input.source_url ?? null,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Erro ao registrar documento normativo: ${error?.message ?? 'sem id'}`)
  }

  return data.id as string
}

/** Indexa PDF da Cartilha INEP: extrai, chunka semanticamente, embeda e persiste. */
export async function indexEnemReferenceFromPdfBuffer(
  adminClient: SupabaseClient,
  input: EnemReferenceIndexInput,
  pdfBuffer: ArrayBuffer,
  openAiKey: string,
): Promise<EnemReferenceIndexResult> {
  try {
    const pages = await extractPdfPagesFromBuffer(pdfBuffer)
    const chunks = buildEnemReferenceChunks(pages, '')

    if (chunks.length === 0) {
      return { ok: false, error: 'Não foi possível segmentar a Cartilha em chunks normativos' }
    }

    const documentId = await upsertDocument(adminClient, input)
    const result = await persistEnemReferenceEmbeddings(adminClient, documentId, chunks, openAiKey)

    const { error: touchError } = await adminClient
      .from('enem_reference_documents')
      .update({ indexed_at: new Date().toISOString() })
      .eq('id', documentId)

    if (touchError) {
      console.warn('[enem-reference-index] falha ao atualizar indexed_at:', touchError.message)
    }

    return {
      ok: true,
      document_id: documentId,
      indexed: result.indexed,
      cost_estimate_usd: result.cost_estimate_usd,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}

/** Reindexa a partir de source_url já registrada ou informada no input. */
export async function indexEnemReferenceFromUrl(
  adminClient: SupabaseClient,
  input: EnemReferenceIndexInput & { source_url: string },
  openAiKey: string,
  fetchPdf: (url: string) => Promise<ArrayBuffer>,
): Promise<EnemReferenceIndexResult> {
  try {
    const buffer = await fetchPdf(input.source_url)
    return await indexEnemReferenceFromPdfBuffer(adminClient, input, buffer, openAiKey)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
