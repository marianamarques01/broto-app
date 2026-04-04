import { assertEquals, assertThrows } from 'https://deno.land/std@0.168.0/assert/mod.ts'
import { mapCreateUserError, parseSignupBody } from './validate.ts'

Deno.test('parseSignupBody: aceita payload mínimo web/mobile', () => {
  const p = parseSignupBody({
    email: '  A@B.COM ',
    password: '123456',
    nome: '  Ana ',
  })
  assertEquals(p.email, 'a@b.com')
  assertEquals(p.password, '123456')
  assertEquals(p.nome, 'Ana')
})

Deno.test('parseSignupBody: rejeita senha curta e nome vazio', () => {
  assertThrows(() => parseSignupBody({ email: 'a@b.co', password: '12345', nome: 'x' }), Error)
  assertThrows(() => parseSignupBody({ email: 'a@b.co', password: '123456', nome: '' }), Error)
})

Deno.test('mapCreateUserError: usuário duplicado → 409', () => {
  const r = mapCreateUserError('User already registered')
  assertEquals(r.status, 409)
})
