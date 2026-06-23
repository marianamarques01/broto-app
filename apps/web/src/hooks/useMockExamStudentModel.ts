import { useEffect, useMemo, useState } from 'react'
import {
  computeAreaStatsFromResults,
  computeCriticalTopics,
  type MockExamAreaStat,
  type PracticeSessionSummary,
  type TopicPerformanceSnapshot,
} from '@broto/shared'
import { supabase } from '@/lib/supabase'

type FetchState = {
  loading: boolean
  error: string | null
  topicPerformance: TopicPerformanceSnapshot[]
}

export function useMockExamStudentModel(
  summary: PracticeSessionSummary | null,
  userId: string | null,
) {
  const simuladoResults = useMemo(() => summary?.resultados ?? [], [summary?.resultados])

  const areaStats = useMemo(
    (): MockExamAreaStat[] =>
      simuladoResults.length > 0
        ? computeAreaStatsFromResults(simuladoResults)
        : computeAreaStatsFromSummary(summary),
    [simuladoResults, summary],
  )

  const topicKeys = useMemo(
    () => [...new Set(simuladoResults.map((r) => r.topicKey).filter(Boolean))] as string[],
    [simuladoResults],
  )

  const canFetch = Boolean(userId && topicKeys.length > 0)

  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    topicPerformance: [],
  })

  useEffect(() => {
    if (!canFetch || !userId) return

    let cancelled = false

    async function load() {
      setFetchState({ loading: true, error: null, topicPerformance: [] })
      try {
        const { data, error } = await supabase
          .from('topic_performance')
          .select('topico_value, area_key, p_know, total_answered')
          .eq('user_id', userId)
          .in('topico_value', topicKeys)

        if (cancelled) return
        if (error) throw error

        setFetchState({
          loading: false,
          error: null,
          topicPerformance: (data ?? []) as TopicPerformanceSnapshot[],
        })
      } catch (e) {
        if (!cancelled) {
          setFetchState({
            loading: false,
            error: e instanceof Error ? e.message : 'Erro ao carregar domínio por tópico',
            topicPerformance: [],
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [canFetch, userId, topicKeys])

  const criticalTopics = useMemo(
    () =>
      canFetch && !fetchState.loading
        ? computeCriticalTopics(simuladoResults, fetchState.topicPerformance)
        : [],
    [canFetch, fetchState.loading, fetchState.topicPerformance, simuladoResults],
  )

  return {
    loading: canFetch && fetchState.loading,
    error: fetchState.error,
    areaStats,
    criticalTopics,
  }
}

/** Fallback para sessões antigas sem `resultados` por questão. */
function computeAreaStatsFromSummary(summary: PracticeSessionSummary | null): MockExamAreaStat[] {
  if (!summary) return []
  return Object.entries(summary.porArea).map(([areaKey, stat]) => ({
    areaKey,
    correct: stat.corretas,
    total: stat.total,
    pct: stat.total > 0 ? stat.corretas / stat.total : 0,
  }))
}
