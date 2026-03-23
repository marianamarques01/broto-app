import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { incrementDailyAreaAnswer } from '@/lib/daily-missions'
import { bumpPerformanceDay } from '@/lib/performance-history'

export interface SubmitAnswerPayload {
  questionId: string
  isCorrect: boolean
  areaKey?: string
  timeSpentSec?: number
}

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<void> {
  await api.post('/api/answer/question', { ...payload })
  bumpPerformanceDay(payload.isCorrect)
  if (payload.areaKey) {
    incrementDailyAreaAnswer({
      areaKey: payload.areaKey,
      isCorrect: payload.isCorrect,
    })
  }
  refreshPet()
  refreshProgress()
}
