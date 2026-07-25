import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { isValidUuid } from './uuid-validation.ts'

Deno.test('isValidUuid accepts v4 UUID', () => {
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true)
})

Deno.test('isValidUuid rejects empty and malformed', () => {
  assertEquals(isValidUuid(''), false)
  assertEquals(isValidUuid('not-a-uuid'), false)
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716'), false)
})
