import { assertEquals } from 'jsr:@std/assert@1'
import { estimateEmbeddingCostUsd, formatPgvector } from './openai-embeddings.ts'

Deno.test('estimateEmbeddingCostUsd: zero para tokens inválidos', () => {
  assertEquals(estimateEmbeddingCostUsd(0), 0)
  assertEquals(estimateEmbeddingCostUsd(-1), 0)
})

Deno.test('estimateEmbeddingCostUsd: calcula custo proporcional', () => {
  assertEquals(estimateEmbeddingCostUsd(1_000_000), 0.02)
  assertEquals(estimateEmbeddingCostUsd(500_000), 0.01)
})

Deno.test('formatPgvector: serializa array numérico', () => {
  assertEquals(formatPgvector([1, 2.5, 3]), '[1,2.5,3]')
})
