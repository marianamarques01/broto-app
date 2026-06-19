/** Narrow `unknown` to a plain object (exclui null, arrays, primitivos). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
