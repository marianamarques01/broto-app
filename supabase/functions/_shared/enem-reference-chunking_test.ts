import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  buildEnemReferenceChunksFromText,
  ENEM_REFERENCE_MAX_SECTION_TOKENS,
} from './enem-reference-chunking.ts'
import { estimateTokenCount } from './material-chunking.ts'

const SAMPLE_CARTILHA = `
COMPETÊNCIA I
Domínio da norma culta da língua escrita.

Nota 200
Demonstra excelente domínio da modalidade escrita formal da língua portuguesa e de escolha de registro.

Nota 160
Demonstra bom domínio da modalidade escrita formal da língua portuguesa e de escolha de registro.

COMPETÊNCIA II
Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento.

Nota 200
Desenvolve o tema por meio de argumentação consistente e apresenta repertório produtivo.

Fatores de anulação da nota
Fuga ao tema: não desenvolve o assunto proposto.
Texto em língua estrangeira ou com menos de 7 linhas.
`.trim()

Deno.test('buildEnemReferenceChunksFromText: segmenta por competência e fatores zero', () => {
  const chunks = buildEnemReferenceChunksFromText(SAMPLE_CARTILHA)
  assert(chunks.length >= 3)

  const compI = chunks.find((c) => c.metadata.competencia === 'I')
  assert(compI)
  assertEquals(compI.metadata.section, 'matriz_referencia')
  assert(compI.text.includes('Nota 200'))

  const fatoresZero = chunks.find((c) => c.metadata.section === 'fatores_zero')
  assert(fatoresZero)
  assert(fatoresZero.text.includes('Fuga ao tema'))
})

Deno.test('buildEnemReferenceChunksFromText: subdivide seções longas', () => {
  const longBody = 'Argumentação detalhada. '.repeat(400)
  const text = `COMPETÊNCIA III\n${longBody}`
  const chunks = buildEnemReferenceChunksFromText(text)
  assert(chunks.length > 1)
  for (const chunk of chunks) {
    assert(
      (chunk.tokens ?? estimateTokenCount(chunk.text)) <= ENEM_REFERENCE_MAX_SECTION_TOKENS + 50,
    )
  }
})

Deno.test('buildEnemReferenceChunksFromText: detecta proposta de intervenção', () => {
  const text = `Proposta de intervenção\nAgente, ação, meio, finalidade e detalhamento são obrigatórios.`
  const chunks = buildEnemReferenceChunksFromText(text)
  assertEquals(chunks[0]?.metadata.section, 'proposta_intervencao')
  assertEquals(chunks[0]?.metadata.competencia, 'V')
})
