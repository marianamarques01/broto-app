import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { incrementDailyAreaAnswer } from '@/lib/missions/daily-missions'

export interface SubmitAnswerPayload {
  questionId: string
  isCorrect: boolean
  areaKey?: string
  timeSpentSec?: number
}

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<void> {
  await api.post('/api/answer/question', { ...payload })
  if (payload.areaKey) {
    incrementDailyAreaAnswer({
      areaKey: payload.areaKey,
      isCorrect: payload.isCorrect,
    }).catch(() => {})
  }
  // Invalidate caches so pet XP and progress update across all tabs
  refreshPet()
  refreshProgress()
}
