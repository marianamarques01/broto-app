import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildMaterialChunks,
  extractMaterialContent,
  type MaterialSourceType,
} from './material-content-extract.ts'
import { persistMaterialEmbeddings } from './material-embed-core.ts'

export type RagIndexMaterialInput = {
  material_id: string
  class_id: string
  organization_id: string
  title: string
  type: MaterialSourceType
  source_url: string
}

export type RagIndexMaterialResult =
  | { ok: true; indexed: number; cost_estimate_usd: number }
  | { ok: false; error: string }

/** Indexação RAG: extrai texto, chunka e persiste embeddings (sem NotebookLM). */
export async function indexMaterialRag(
  adminClient: SupabaseClient,
  input: RagIndexMaterialInput,
  openAiKey: string,
): Promise<RagIndexMaterialResult> {
  const extracted = await extractMaterialContent(
    {
      type: input.type,
      source_url: input.source_url,
      title: input.title,
    },
    { adminClient },
  )

  const chunks = buildMaterialChunks(extracted, input.title)
  if (chunks.length === 0) {
    return { ok: false, error: 'Não foi possível extrair texto do material' }
  }

  const result = await persistMaterialEmbeddings(adminClient, {
    material_id: input.material_id,
    class_id: input.class_id,
    organization_id: input.organization_id,
    chunks,
    openAiKey,
  })

  return {
    ok: true,
    indexed: result.indexed,
    cost_estimate_usd: result.cost_estimate_usd,
  }
}
