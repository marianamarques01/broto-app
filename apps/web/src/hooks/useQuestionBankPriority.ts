import { useMemo } from 'react'
import { buildQuestionBankPriority, type QuestionBankPriorityResult } from '@broto/shared'
import type { AreaStat } from '@/hooks/useProgress'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import type { RecentMistakeItem } from '@broto/shared'

export function useQuestionBankPriority(params: {
  areaKey: string
  areaLabel: string
  allInArea: QuestionBankRow[]
  areaStat: AreaStat | undefined
  mistakes: RecentMistakeItem[]
  catalogLoading: boolean
  mistakesLoading: boolean
}): QuestionBankPriorityResult | null {
  const { areaKey, areaLabel, allInArea, areaStat, mistakes, catalogLoading, mistakesLoading } =
    params

  return useMemo(() => {
    if (catalogLoading || mistakesLoading) return null
    return buildQuestionBankPriority({
      areaKey,
      areaLabel,
      allInArea,
      areaStat,
      mistakes,
    })
  }, [areaKey, areaLabel, allInArea, areaStat, mistakes, catalogLoading, mistakesLoading])
}
