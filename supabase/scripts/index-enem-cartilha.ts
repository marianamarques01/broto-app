/**
 * Indexação inicial da Cartilha do Participante INEP no corpus RAG global.
 *
 * O PDF **não** deve ser commitado no repositório. Mantenha-o fora do repo
 * (ex.: ~/Downloads/cartilha-participante-2025.pdf).
 *
 * Pré-requisitos:
 *   - Migration 20260707130000_enem_reference_rag.sql aplicada
 *   - OPENAI_API_KEY
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   export OPENAI_API_KEY=sk-...
 *   export SUPABASE_URL=https://<ref>.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   export CARTILHA_PDF_PATH=/caminho/para/cartilha-participante-2025.pdf
 *   deno run --allow-net --allow-env --allow-read supabase/scripts/index-enem-cartilha.ts
 *
 * Opcional:
 *   CARTILHA_SLUG=cartilha-participante-2025
 *   CARTILHA_VERSION=2025.1
 *   CARTILHA_SOURCE_URL=https://...  — URL pública ou signed URL (registrada no documento)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  CARTILHA_DEFAULT_TITLE,
  CARTILHA_DOCUMENT_SLUG,
  indexEnemReferenceFromPdfBuffer,
} from '../functions/_shared/enem-reference-index.ts'

const pdfPath = Deno.env.get('CARTILHA_PDF_PATH')
const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openAiKey = Deno.env.get('OPENAI_API_KEY')

if (!pdfPath) {
  console.error('Defina CARTILHA_PDF_PATH com o caminho local do PDF (não commitar no repo).')
  Deno.exit(1)
}
if (!url || !serviceKey || !openAiKey) {
  console.error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY.')
  Deno.exit(1)
}

const slug = Deno.env.get('CARTILHA_SLUG') ?? CARTILHA_DOCUMENT_SLUG
const version = Deno.env.get('CARTILHA_VERSION') ?? '2025.1'
const sourceUrl = Deno.env.get('CARTILHA_SOURCE_URL') ?? null

console.log(`[index-enem-cartilha] slug=${slug} version=${version}`)
console.log(`[index-enem-cartilha] lendo PDF: ${pdfPath}`)

const pdfBytes = await Deno.readFile(pdfPath)
const sb = createClient(url, serviceKey)

const result = await indexEnemReferenceFromPdfBuffer(
  sb,
  {
    slug,
    title: CARTILHA_DEFAULT_TITLE,
    version,
    source_url: sourceUrl,
  },
  pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
  openAiKey,
)

if (!result.ok) {
  console.error('[index-enem-cartilha] falhou:', result.error)
  Deno.exit(1)
}

console.log(
  `[index-enem-cartilha] ok document_id=${result.document_id} chunks=${result.indexed} custo≈$${result.cost_estimate_usd.toFixed(4)}`,
)

const { count } = await sb
  .from('enem_reference_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('document_id', result.document_id)

console.log(`[index-enem-cartilha] verificação: ${count ?? 0} embeddings persistidos`)
Deno.exit(0)
