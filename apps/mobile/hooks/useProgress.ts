import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  createUserProgressFetcher,
  type ProgressData,
  type AreaStat,
  type TopicoStat,
} from '@broto/shared'

export type { ProgressData, AreaStat, TopicoStat } from '@broto/shared'

const { useHook, refresh, refreshIfStale } = createCachedHook<ProgressData>(
  createUserProgressFetcher((path) => api.get(path)),
)

export const refreshProgress = refresh

export function useProgress() {
  const { data, loading, refresh: r } = useHook()
  useFocusEffect(
    useCallback(() => {
      refreshIfStale()
    }, []),
  )
  return { progress: data, loading, refresh: r }
}
