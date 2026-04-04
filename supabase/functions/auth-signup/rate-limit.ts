/** In-memory sliding window (por isolate Edge). Mitiga abuso; não substitui WAF global. */

const WINDOW_MS = 60_000
const MAX_PER_IP = 20
const MAX_PER_EMAIL = 8

type Bucket = { count: number; resetAt: number }

const byIp = new Map<string, Bucket>()
const byEmail = new Map<string, Bucket>()

function prune(m: Map<string, Bucket>, now: number): void {
  for (const [k, v] of m) {
    if (now > v.resetAt) m.delete(k)
  }
}

function allow(
  m: Map<string, Bucket>,
  key: string,
  max: number,
  now: number,
): { ok: true } | { retryAfterSec: number } {
  prune(m, now)
  const b = m.get(key)
  if (!b || now > b.resetAt) {
    m.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (b.count >= max) {
    return { retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  }
  b.count += 1
  return { ok: true }
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || 'unknown'
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  return 'unknown'
}

export function checkSignupRateLimit(
  ip: string,
  emailNormalized: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const r1 = allow(byIp, ip, MAX_PER_IP, now)
  if ('retryAfterSec' in r1) return { ok: false, retryAfterSec: r1.retryAfterSec }
  const r2 = allow(byEmail, emailNormalized.toLowerCase(), MAX_PER_EMAIL, now)
  if ('retryAfterSec' in r2) return { ok: false, retryAfterSec: r2.retryAfterSec }
  return { ok: true }
}
