export interface SubmitAnswerPayload {
  questionId: string
  isCorrect: boolean
  areaKey?: string
  timeSpentSec?: number
}
