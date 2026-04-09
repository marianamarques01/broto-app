export interface SubmitAnswerPayload {
  questionId: string
  isCorrect: boolean
  areaKey?: string
  timeSpentSec?: number
  /** Quando presente, grava vínculo com `practice_sessions` (simulado). */
  sessionId?: string
}
