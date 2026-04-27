/** Invalidação do cache de erros recentes após nova resposta (evita dependência circular com hooks). */

const listeners = new Set<() => void>()

export function invalidateRecentMistakes(): void {
  for (const fn of listeners) fn()
}

export function subscribeRecentMistakesInvalidation(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
