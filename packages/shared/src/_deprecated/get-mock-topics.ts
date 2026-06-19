/** @deprecated Sem consumidores — catálogo usa getStudyTopicCatalog / mergeTopicCatalogWithStats. */
import type { TopicOption } from '../study-area-mock'

const MOCK_TOPICS: Record<string, TopicOption[]> = {}

export function getMockTopics(areaKey: string): TopicOption[] {
  return MOCK_TOPICS[areaKey] ?? []
}
