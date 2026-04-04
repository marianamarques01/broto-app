import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import type { UserProfile } from '@broto/shared'
import { createUserMeFetcher } from '@broto/shared'

export type { UserProfile } from '@broto/shared'

const { useHook, refresh, refreshIfStale } = createCachedHook<UserProfile>(
  createUserMeFetcher((path) => api.get(path)),
)

export const refreshUser = refresh

export function useUser() {
  const { data, loading, refresh: r } = useHook()
  useFocusEffect(
    useCallback(() => {
      refreshIfStale()
    }, []),
  )
  return { user: data, loading, refresh: r }
}
