import { api } from '@/lib/api-client'
import { refreshPet } from '@/hooks/usePet'
import { refreshProgress } from '@/hooks/useProgress'
import { clearDailyMissionsLocal } from '@/lib/daily-missions'
import { clearPerformanceHistoryLocal } from '@/lib/performance-history'
import { invalidatePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { invalidateRecentMistakes } from '@/lib/recent-mistakes-invalidate'

/** Apaga histórico de questões na conta + limpa caches locais alinhados a essas métricas. */
export async function resetPracticeHistoryFromServer(): Promise<void> {
  await api.post('/api/user/reset-practice', {})
  clearPerformanceHistoryLocal()
  clearDailyMissionsLocal()
  invalidatePerformanceSeries()
  invalidateRecentMistakes()
  refreshProgress()
  refreshPet()
}
