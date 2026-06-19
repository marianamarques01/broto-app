import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import { createUserProgressFetcher, type ProgressData } from '@broto/shared'

export type { ProgressData, AreaStat, TopicoStat } from '@broto/shared'

const { useHook, refresh } = createCachedHook<ProgressData>(
  createUserProgressFetcher((path) => api.get(path)),
)

export const refreshProgress = refresh

export function useProgress() {
  const { data, loading, refresh: r } = useHook()
  return { progress: data, loading, refresh: r }
}
