/**
 * Dia canônico Broto (MVP): UTC no servidor e no cliente ao exibir dados do servidor.
 * Ver `docs/deprecated/QUESTIONS.md` — decisão histórica UTC everywhere.
 */

/** Data UTC no formato YYYY-MM-DD. */
export function todayUtcISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Dia UTC anterior (YYYY-MM-DD). */
export function yesterdayUtcISO(): string {
  const y = new Date()
  y.setUTCDate(y.getUTCDate() - 1)
  return y.toISOString().slice(0, 10)
}

/** Início do dia UTC atual como ISO instant (00:00:00.000Z). */
export function startOfUtcDayIso(): string {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}
