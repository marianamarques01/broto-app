# 01-05 Summary

## Conteudo de `supabase/functions/_shared/cors.ts`

```ts
// supabase/functions/_shared/cors.ts
// Shared CORS utility for all Broto edge functions.
// Uses Deno-compatible ESM imports only - no Node.js modules.
// SECR-01: fails closed - empty ALLOWED_ORIGINS rejects all origins (no '*' fallback).
// SECR-02: single source of truth - all functions import from here.

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean)

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

/**
 * Returns CORS headers for the given request.
 * If ALLOWED_ORIGINS is unset or empty, the returned object has __blocked: 'true'.
 * If the request origin is not in ALLOWED_ORIGINS, the returned object has __blocked: 'true'.
 * Callers must check isOriginBlocked() before using headers in a response.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''

  // SECR-01: fail closed - no env var means reject all
  if (ALLOWED_ORIGINS.length === 0) {
    return { __blocked: 'true', ...CORS_HEADERS_BASE }
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return { __blocked: 'true', ...CORS_HEADERS_BASE }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    ...CORS_HEADERS_BASE,
  }
}

/** Returns true if the origin was blocked by getCorsHeaders. */
export function isOriginBlocked(corsHeaders: Record<string, string>): boolean {
  return corsHeaders.__blocked === 'true'
}

/**
 * Returns a JSON Response with the given status, body, and CORS headers.
 * Pass clean headers (not blocked headers) - use isOriginBlocked() first.
 * The __blocked marker is stripped before spreading into response headers.
 */
export function json(status: number, body: unknown, cors: Record<string, string>): Response {
  const { __blocked: _, ...safeHeaders } = cors
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...safeHeaders },
  })
}
```

## Funcoes atualizadas

- `supabase/functions/broto-chat/index.ts` - removeu CORS inline e passou a bloquear origem nao permitida com `403`.
- `supabase/functions/class-join/index.ts` - mesmo padrao de import compartilhado e bloqueio fail-closed.
- `supabase/functions/material-index/index.ts` - adicionou fluxo CORS completo (antes nao tinha o mesmo padrao centralizado) e normalizou respostas via `json()`.
- `supabase/functions/pet-me/index.ts` - removeu `ALLOWED_ORIGINS` inline e helper local.
- `supabase/functions/user-me/index.ts` - removeu fallback wildcard e aplicou bloqueio explicito.
- `supabase/functions/user-progress/index.ts` - removeu CORS duplicado e centralizou no shared.

## Validacoes

- `rg "origin \\|\\| '\\*'|origin \\|\\| \"\\*\"" supabase/functions` sem resultados.
- `rg "from '../_shared/cors\\.ts'|from \"../_shared/cors\\.ts\"" supabase/functions` retornou 6 imports (um por funcao).
- `rg "const ALLOWED_ORIGINS|function getCorsHeaders" supabase/functions` retorna apenas `_shared/cors.ts`.

## Commits relacionados

- `9027bbc1` - criacao inicial de `supabase/functions/_shared/cors.ts`
- `ac09a589` - migracao das 6 funcoes para o util compartilhado
