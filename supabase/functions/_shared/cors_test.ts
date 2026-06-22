import { assertEquals } from 'jsr:@std/assert@1'
import { getCorsHeaders, isOriginBlocked, json } from './cors.ts'

Deno.test('getCorsHeaders: localhost dev permitido', () => {
  const req = new Request('https://example.com', {
    headers: { Origin: 'http://localhost:5173' },
  })
  const cors = getCorsHeaders(req)
  assertEquals(isOriginBlocked(cors), false)
  assertEquals(cors['Access-Control-Allow-Origin'], 'http://localhost:5173')
})

Deno.test('getCorsHeaders: LAN privada permitida', () => {
  const req = new Request('https://example.com', {
    headers: { Origin: 'http://192.168.0.42:5173' },
  })
  const cors = getCorsHeaders(req)
  assertEquals(isOriginBlocked(cors), false)
  assertEquals(cors['Access-Control-Allow-Origin'], 'http://192.168.0.42:5173')
})

Deno.test('getCorsHeaders: origem desconhecida bloqueada', () => {
  const req = new Request('https://example.com', {
    headers: { Origin: 'https://evil.example.com' },
  })
  const cors = getCorsHeaders(req)
  assertEquals(isOriginBlocked(cors), true)
  assertEquals(cors['Access-Control-Allow-Origin'], undefined)
})

Deno.test('getCorsHeaders: origem explícita em ALLOWED_ORIGINS', async () => {
  const prev = Deno.env.get('ALLOWED_ORIGINS')
  Deno.env.set('ALLOWED_ORIGINS', 'https://app.broto.com.br')
  try {
    const mod = await import(`./cors.ts?p9=${crypto.randomUUID()}`)
    const req = new Request('https://example.com', {
      headers: { Origin: 'https://app.broto.com.br' },
    })
    const cors = mod.getCorsHeaders(req)
    assertEquals(mod.isOriginBlocked(cors), false)
    assertEquals(cors['Access-Control-Allow-Origin'], 'https://app.broto.com.br')
  } finally {
    if (prev === undefined) Deno.env.delete('ALLOWED_ORIGINS')
    else Deno.env.set('ALLOWED_ORIGINS', prev)
  }
})

Deno.test('json: não vaza marcador __blocked nos headers', () => {
  const cors = getCorsHeaders(
    new Request('https://example.com', { headers: { Origin: 'http://localhost:3000' } }),
  )
  const res = json(200, { ok: true }, cors)
  assertEquals(res.headers.get('__blocked'), null)
  assertEquals(res.headers.get('Content-Type'), 'application/json')
})
