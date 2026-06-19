/** @deprecated Sem consumidores — utilitário de teste/hot-reload sem callers. */
export function clearQuestionBankStaticCaches(
  topicMappingCache: Map<string, Record<string, string>>,
  examDetailsCache: Map<string, unknown>,
): void {
  topicMappingCache.clear()
  examDetailsCache.clear()
}
