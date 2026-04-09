import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { incrementDailyAreaAnswer } from '@/lib/daily-missions'
import { bumpPerformanceDay } from '@/lib/performance-history'
import { invalidatePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { runAfterAnswerSubmitted, type SubmitAnswerPayload } from '@broto/shared'

export type { SubmitAnswerPayload } from '@broto/shared'

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<void> {
  await api.post('/api/answer/question', { ...payload })
  await runAfterAnswerSubmitted(payload, {
    bumpPerformanceDay,
    incrementDailyAreaAnswer,
    refreshPet,
    refreshProgress,
  })
  invalidatePerformanceSeries()
}
