import type { SubmitAnswerPayload } from '../types/submit-answer'

export interface AfterAnswerSubmitDeps {
  refreshPet: () => void
  refreshProgress: () => void
}

/**
 * Shared side-effects after a question is answered successfully (API already persisted).
 * Contagens diárias vêm do servidor (UTC); apenas refresh de caches do cliente.
 */
export async function runAfterAnswerSubmitted(
  _payload: SubmitAnswerPayload,
  deps: AfterAnswerSubmitDeps,
): Promise<void> {
  deps.refreshPet()
  deps.refreshProgress()
}
