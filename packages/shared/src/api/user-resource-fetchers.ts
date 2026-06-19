import type { UserProfile } from '../types/user-profile'
import type { PetData } from '../types/pet'
import { sanitizeProgressData } from '../enem-area-display'
import type { ProgressData } from '../types/dashboard-progress'
import type { PerformancePeriod, PerformanceSeriesResponse } from '../types/performance-series'

export const API_PATH_USER_ME = '/api/user/me'
export const API_PATH_PET_ME = '/api/pet/me'
export const API_PATH_USER_PROGRESS = '/api/user/progress'
export const API_PATH_USER_PERFORMANCE_SERIES = '/api/user/performance-series'
export const API_PATH_USER_RECENT_MISTAKES = '/api/user/recent-mistakes'

export type ApiGet = <T>(path: string) => Promise<T>
export type ApiPost = <T>(path: string, body?: Record<string, unknown>) => Promise<T>

export function createUserMeFetcher(apiGet: ApiGet): () => Promise<UserProfile> {
  return () => apiGet<UserProfile>(API_PATH_USER_ME)
}

export function createPetMeFetcher(apiGet: ApiGet): () => Promise<PetData> {
  return () => apiGet<PetData>(API_PATH_PET_ME)
}

export function createUserProgressFetcher(apiGet: ApiGet): () => Promise<ProgressData> {
  return async () => sanitizeProgressData(await apiGet<ProgressData>(API_PATH_USER_PROGRESS))
}

export function createUserPerformanceSeriesFetcher(apiPost: ApiPost) {
  return (period: PerformancePeriod) =>
    apiPost<PerformanceSeriesResponse>(API_PATH_USER_PERFORMANCE_SERIES, { period })
}
