export interface SubmitAnswerPayload {
  questionId: string
  isCorrect: boolean
  areaKey?: string
  timeSpentSec?: number
  /** Quando presente, grava vínculo com `practice_sessions` (sessão tipo simulado). */
  sessionId?: string
}

export interface SubmitAnswerResponse {
  success: true
  xpGained: number
  missionBonusXp: number
  missionCompletedIndexes: number[]
  newLevel: number
}
