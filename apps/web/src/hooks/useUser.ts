import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import type { UserProfile } from '@broto/shared'
import { createUserMeFetcher } from '@broto/shared'

export type { UserProfile } from '@broto/shared'

const { useHook, refresh } = createCachedHook<UserProfile>(
  createUserMeFetcher((path) => api.get(path)),
)

export const refreshUser = refresh

export function useUser() {
  const { data, loading, refresh: r } = useHook()
  return { user: data, loading, refresh: r }
}
