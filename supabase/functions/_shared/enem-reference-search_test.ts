import { assert, assertEquals } from 'jsr:@std/assert@1'
import { formatEnemReferenceContext } from './enem-reference-search.ts'
import type { EnemReferenceSearchChunk } from './enem-reference-search.ts'

const sampleChunks: EnemReferenceSearchChunk[] = [
  {
    id: 'a',
    document_id: 'doc-1',
    similarity: 0.87,
    chunk_text: 'Demonstra excelente domínio da norma culta da língua escrita.',
    metadata: {
      section: 'matriz_referencia',
      competencia: 'I',
      criterio_nivel: 200,
      section_title: 'Competência I',
      page_number: 42,
    },
  },
  {
    id: 'b',
    document_id: 'doc-1',
    similarity: 0.72,
    chunk_text: 'Fuga ao tema: não desenvolve o assunto proposto.',
    metadata: {
      section: 'fatores_zero',
      section_title: 'Fatores de anulação',
    },
  },
]

Deno.test('formatEnemReferenceContext: retorna null para lista vazia', () => {
  assertEquals(formatEnemReferenceContext([]), null)
})

Deno.test('formatEnemReferenceContext: inclui cabeçalhos normativos e metadata', () => {
  const formatted = formatEnemReferenceContext(sampleChunks)
  assert(formatted)
  assert(formatted.includes('Cartilha do Participante INEP'))
  assert(formatted.includes('competência I'))
  assert(formatted.includes('nível 200'))
  assert(formatted.includes('p.42'))
  assert(formatted.includes('relevância 0.87'))
  assert(formatted.includes('Fuga ao tema'))
  assert(formatted.includes('seção=fatores_zero'))
  assert(formatted.includes('Fim dos trechos normativos'))
})

Deno.test('formatEnemReferenceContext: formata chunk sem score', () => {
  const formatted = formatEnemReferenceContext([
    {
      id: 'c',
      document_id: 'doc-1',
      similarity: NaN,
      chunk_text: 'Texto normativo simples.',
      metadata: { section: 'proposta_intervencao', competencia: 'V' },
    },
  ])
  assert(formatted)
  assert(formatted.includes('Trecho 1: '))
  assert(formatted.includes('competência V'))
  assert(formatted.includes('Texto normativo simples.'))
})
