// supabase/functions/_shared/cors.ts
// Shared CORS utility for all Broto edge functions.
// Uses Deno-compatible ESM imports only - no Node.js modules.
// SECR-01: no '*' wildcard for public deployments.
//   Explicit ALLOWED_ORIGINS always wins for prod URLs (HTTPS em domínio real).
//   Plus: origens típicas de dev (localhost, loopback IPv6 e RFC1918) são sempre aceitas,
//   para não travar desenvolvimento quando o secret só lista a URL de produção.
// SECR-02: single source of truth — all functions import from here.

const EXPLICIT_ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/** hostnames típicos do Vite; um site aleatório na internet não consegue forjar esse Origin no browser */
const MACHINE_LOCAL_ORIGIN_RE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i

/** IPv4 RFC1918 + loopback (ex.: vite --host 0.0.0.0 e abrir pela LAN em 192.168.x.x) */
const PRIVATE_OR_LOOPBACK_ORIGIN_RE =
  /^https?:\/\/(?:127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(?::\d+)?$/i

function isImplicitTrustedDevOrigin(origin: string): boolean {
  return MACHINE_LOCAL_ORIGIN_RE.test(origin) || PRIVATE_OR_LOOPBACK_ORIGIN_RE.test(origin)
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  if (EXPLICIT_ALLOWED_ORIGINS.includes(origin)) return true
  return isImplicitTrustedDevOrigin(origin)
}

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  /** Inclui PATCH/PUT/DELETE para chamadas da API web (ex.: renomear Broto). */
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
}

/**
 * Returns CORS headers for the given request.
 * If the request Origin is not allowed, the returned object has __blocked: 'true'.
 * Callers must check isOriginBlocked() before using headers in a response.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''

  if (!isAllowedOrigin(origin)) {
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
