import type { SubmitAnswerPayload } from '../types/submit-answer'

export interface AfterAnswerSubmitDeps {
  bumpPerformanceDay?: (isCorrect: boolean) => void | Promise<void>
  incrementDailyAreaAnswer?: (params: { areaKey: string; isCorrect: boolean }) => Promise<unknown>
  refreshPet: () => void
  refreshProgress: () => void
}

/**
 * Shared side-effects after a question is answered successfully (API already persisted).
 * Order: performance bump → daily missions → cache refresh.
 */
export async function runAfterAnswerSubmitted(
  payload: SubmitAnswerPayload,
  deps: AfterAnswerSubmitDeps,
): Promise<void> {
  if (deps.bumpPerformanceDay) {
    await Promise.resolve(deps.bumpPerformanceDay(payload.isCorrect))
  }
  if (payload.areaKey && deps.incrementDailyAreaAnswer) {
    await deps.incrementDailyAreaAnswer({
      areaKey: payload.areaKey,
      isCorrect: payload.isCorrect,
    })
  }
  deps.refreshPet()
  deps.refreshProgress()
}
