/**
 * Dia canônico Broto (MVP): UTC no servidor.
 * Manter em paridade com `packages/shared/src/utils/today-utc-iso.ts` (teste Deno espelha Vitest).
 * Ver `docs/deprecated/QUESTIONS.md`.
 */

export function todayUtcISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayUtcISO(): string {
  const y = new Date()
  y.setUTCDate(y.getUTCDate() - 1)
  return y.toISOString().slice(0, 10)
}

export function startOfUtcDayIso(): string {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}
