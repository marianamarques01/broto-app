import type { UserProfile } from '../types/user-profile'
import type { PetData } from '../types/pet'
import type { ProgressData } from '../types/dashboard-progress'

export const API_PATH_USER_ME = '/api/user/me'
export const API_PATH_PET_ME = '/api/pet/me'
export const API_PATH_USER_PROGRESS = '/api/user/progress'

export type ApiGet = <T>(path: string) => Promise<T>

export function createUserMeFetcher(apiGet: ApiGet): () => Promise<UserProfile> {
  return () => apiGet<UserProfile>(API_PATH_USER_ME)
}

export function createPetMeFetcher(apiGet: ApiGet): () => Promise<PetData> {
  return () => apiGet<PetData>(API_PATH_PET_ME)
}

export function createUserProgressFetcher(apiGet: ApiGet): () => Promise<ProgressData> {
  return () => apiGet<ProgressData>(API_PATH_USER_PROGRESS)
}
