import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { invalidatePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { invalidateRecentMistakes } from '@/lib/recent-mistakes-invalidate'
import { runAfterAnswerSubmitted, type SubmitAnswerPayload } from '@broto/shared'

export type { SubmitAnswerPayload } from '@broto/shared'

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<void> {
  await api.post('/api/answer/question', { ...payload })
  await runAfterAnswerSubmitted(payload, {
    refreshPet,
    refreshProgress,
  })
  invalidatePerformanceSeries()
  invalidateRecentMistakes()
}
