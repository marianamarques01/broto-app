import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { invalidatePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { invalidateRecentMistakes } from '@/lib/recent-mistakes-invalidate'

/** Apaga histórico de questões na conta + invalida caches locais alinhados a essas métricas. */
export async function resetPracticeHistoryFromServer(): Promise<void> {
  await api.post('/api/user/reset-practice', {})
  invalidatePerformanceSeries()
  invalidateRecentMistakes()
  refreshProgress()
  refreshPet()
}
