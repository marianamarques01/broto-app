/**
 * Inverso operacional de `getQuestionId` para paths no storage.
 * Suporta `YYYY-NNN` e `YYYY-NNN-idioma`.
 */
export function parseQuestionId(questionId: string): {
  year: number
  index: number
  language: string | null
} | null {
  const trimmed = questionId.trim()
  const m = trimmed.match(/^(\d{4})-(\d+)(?:-([a-z]+))?$/)
  if (!m) return null
  const year = Number(m[1])
  const index = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(index)) return null
  return { year, index, language: m[3] ?? null }
}
