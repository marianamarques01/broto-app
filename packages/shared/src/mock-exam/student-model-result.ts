/** Resultado por questão — persistido em `practice_sessions.summary.resultados`. */
export interface MockExamResultItem {
  questionId: string
  topicKey: string | null
  areaKey: string
  isCorrect: boolean
}

export interface MockExamAreaStat {
  areaKey: string
  correct: number
  total: number
  /** 0–1 */
  pct: number
}

export interface CriticalTopicItem {
  topicKey: string
  areaKey: string
  pKnow: number
}

export interface TopicPerformanceSnapshot {
  topico_value: string
  area_key: string | null
  p_know: number
  total_answered: number
}

/** Agrega acertos por área a partir dos resultados individuais do simulado. */
export function computeAreaStatsFromResults(results: MockExamResultItem[]): MockExamAreaStat[] {
  const byArea = new Map<string, MockExamResultItem[]>()
  for (const r of results) {
    const area = r.areaKey.trim() || 'sem_area'
    const list = byArea.get(area) ?? []
    list.push(r)
    byArea.set(area, list)
  }

  return [...byArea.entries()]
    .map(([areaKey, items]) => {
      const correct = items.filter((item) => item.isCorrect).length
      const total = items.length
      return {
        areaKey,
        correct,
        total,
        pct: total > 0 ? correct / total : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** Tópicos errados com P(Know) baixo — prioridade para revisão. */
export function computeCriticalTopics(
  results: MockExamResultItem[],
  topicPerformance: TopicPerformanceSnapshot[],
  limit = 3,
): CriticalTopicItem[] {
  const pKnowByTopic = new Map(topicPerformance.map((row) => [row.topico_value, row.p_know]))

  const byTopic = new Map<string, CriticalTopicItem>()
  for (const r of results) {
    if (r.isCorrect || !r.topicKey) continue
    const topicKey = r.topicKey
    const pKnow = pKnowByTopic.get(topicKey) ?? 0.3
    const existing = byTopic.get(topicKey)
    if (!existing || pKnow < existing.pKnow) {
      byTopic.set(topicKey, { topicKey, areaKey: r.areaKey, pKnow })
    }
  }

  return [...byTopic.values()]
    .filter((item) => item.pKnow < 0.5)
    .sort((a, b) => a.pKnow - b.pKnow)
    .slice(0, limit)
}

/** Cor da barra de desempenho por threshold (≥70% verde · 50–70% amarelo · <50% vermelho). */
export function mockExamAreaBarColor(pctFraction: number): string {
  const pct = pctFraction * 100
  if (pct >= 70) return 'var(--green-400)'
  if (pct >= 50) return 'var(--gold-400)'
  return 'var(--red-400)'
}

/** URL do banco de questões com tópicos críticos pré-filtrados. */
export function buildCriticalTopicsPracticeHref(criticalTopics: CriticalTopicItem[]): string | null {
  if (criticalTopics.length === 0) return null

  const countByArea = new Map<string, number>()
  for (const t of criticalTopics) {
    countByArea.set(t.areaKey, (countByArea.get(t.areaKey) ?? 0) + 1)
  }
  const areaKey =
    [...countByArea.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? criticalTopics[0].areaKey

  const topicsInArea = criticalTopics.filter((t) => t.areaKey === areaKey).map((t) => t.topicKey)
  if (topicsInArea.length === 0) return null

  const params = new URLSearchParams({ topics: topicsInArea.join(',') })
  return `/study/${encodeURIComponent(areaKey)}/banco?${params.toString()}`
}
