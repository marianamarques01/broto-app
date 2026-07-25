import { assertEquals } from 'jsr:@std/assert@1'
import { parseNetworkFilters } from './engagement-network-core.ts'

Deno.test('parseNetworkFilters: ignora all e normaliza periodDays', () => {
  assertEquals(parseNetworkFilters({ regional: 'all', grade: 'all', periodDays: '30' }), {
    periodDays: 30,
  })
})

Deno.test('parseNetworkFilters: aplica regional e grade', () => {
  assertEquals(parseNetworkFilters({ regional: 'Norte', grade: '3º ano EM', periodDays: null }), {
    regional: 'Norte',
    grade: '3º ano EM',
  })
})

Deno.test('parseNetworkFilters: periodDays inválido é ignorado', () => {
  assertEquals(parseNetworkFilters({ periodDays: 'abc' }), {})
})
