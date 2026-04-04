import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { createPetMeFetcher, FASE_EMOJI, FASE_LABEL, type PetData } from '@broto/shared'

export { FASE_EMOJI, FASE_LABEL, type PetData } from '@broto/shared'

const { useHook, refresh, refreshIfStale } = createCachedHook<PetData>(
  createPetMeFetcher((path) => api.get(path)),
)

export const refreshPet = refresh

export function usePet() {
  const { data, loading, refresh: r } = useHook()
  useFocusEffect(
    useCallback(() => {
      refreshIfStale()
    }, []),
  )
  return { pet: data, loading, refresh: r }
}
