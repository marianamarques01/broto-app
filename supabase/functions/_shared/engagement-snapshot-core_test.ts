import { assertEquals } from 'jsr:@std/assert@1'
import { isValidUuid } from './uuid-validation.ts'

Deno.test('isValidUuid: aceita uuid v4', () => {
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true)
})

Deno.test('isValidUuid: rejeita string inválida', () => {
  assertEquals(isValidUuid('not-a-uuid'), false)
  assertEquals(isValidUuid(''), false)
})
