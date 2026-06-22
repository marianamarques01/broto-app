import type { PerformanceBucket } from '../types/performance-series'

const UTC_DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

/** Extrai buckets com chave YYYY-MM-DD (série UTC do servidor). */
export function bucketsToUtcDayMap(
  buckets: PerformanceBucket[],
): Record<string, { answered: number; correct: number }> {
  const out: Record<string, { answered: number; correct: number }> = {}
  for (const b of buckets) {
    if (!UTC_DAY_KEY.test(b.key)) continue
    out[b.key] = { answered: b.answered, correct: b.correct }
  }
  return out
}
