import { api } from '@/lib/api-client'
import { createCachedHook } from './createCachedHook'
import { createPetMeFetcher, type PetData } from '@broto/shared'

export { FASE_EMOJI, FASE_LABEL, type PetData } from '@broto/shared'

const { useHook, refresh } = createCachedHook<PetData>(createPetMeFetcher((path) => api.get(path)))

export const refreshPet = refresh

export function usePet() {
  const { data, loading, refresh: r } = useHook()
  return { pet: data, loading, refresh: r }
}
