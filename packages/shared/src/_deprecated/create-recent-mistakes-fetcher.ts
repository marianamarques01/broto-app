/** @deprecated Sem consumidores — web usa API_PATH direto em useRecentMistakes. */
import type { RecentMistakesResponse } from '../types/recent-mistakes'
import { API_PATH_USER_RECENT_MISTAKES } from '../api/user-resource-fetchers'
import type { ApiGet } from '../api/user-resource-fetchers'

export function createRecentMistakesFetcher(apiGet: ApiGet) {
  return () => apiGet<RecentMistakesResponse>(API_PATH_USER_RECENT_MISTAKES)
}
