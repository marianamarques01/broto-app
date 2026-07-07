import { assert, assertEquals, assertFalse } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { parseRedacaoSubmitBody, validateLinhaCountForSubmit } from './redacao-submit-validation.ts'

const TEMA_ID = '11111111-1111-4111-8111-111111111111'

Deno.test('parseRedacaoSubmitBody — mínimo válido', () => {
  const parsed = parseRedacaoSubmitBody({
    tema_id: TEMA_ID,
    texto: 'Linha 1\nLinha 2',
  })
  assert(parsed.ok)
  if (parsed.ok) {
    assertEquals(parsed.data.modo, 'digitado')
    assertEquals(parsed.data.tempo_segundos, null)
  }
})

Deno.test('parseRedacaoSubmitBody — rejeita tema_id inválido', () => {
  const parsed = parseRedacaoSubmitBody({ tema_id: 'x', texto: 'ok' })
  assertFalse(parsed.ok)
})

Deno.test('validateLinhaCountForSubmit — 7 a 30 linhas', () => {
  const short = validateLinhaCountForSubmit('a\nb\n')
  assertFalse(short.ok)

  const ok = validateLinhaCountForSubmit('1\n2\n3\n4\n5\n6\n7')
  assert(ok.ok)
  if (ok.ok) assertEquals(ok.linha_count, 7)

  const long = validateLinhaCountForSubmit(
    Array.from({ length: 31 }, (_, i) => String(i + 1)).join('\n'),
  )
  assertFalse(long.ok)
})
