import { filterDisplayAreas, studyJourneyCompletedCount } from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import {
  getStudyTopicCatalog,
  mergeTopicCatalogWithStats,
  type TopicOption,
} from '@/lib/study-area-mock'
import { loadStudyPackageSessionDraft } from '@/lib/study-package-session-storage'
import type { ProgressData, AreaStat } from '@/hooks/useProgress'
import type { StudyJourneyTab } from '@broto/shared'

export type StudyAreaStep = 'select' | 'loading' | 'study'
export type StudyAreaTab = StudyJourneyTab

/** Áreas reais do ENEM — `sem_area` é só fallback de dados, não entra na grade. */
export const STUDY_AREA_CARD_KEYS = Object.keys(AREA_CONFIG).filter((k) => k !== 'sem_area')

export function areaBlockForKey(
  areas: AreaStat[] | undefined,
  areaKey: string,
): AreaStat | undefined {
  return areas?.find((a) => a.value === areaKey)
}

export function topicsForAreaKey(areaKey: string, areas: AreaStat[] | undefined): TopicOption[] {
  const cat = getStudyTopicCatalog(areaKey)
  const block = areaBlockForKey(areas, areaKey)
  const merged = mergeTopicCatalogWithStats(cat, block?.topicos)
  return merged.map((t) => {
    const draft = loadStudyPackageSessionDraft(areaKey, t.value)
    const jc = draft ? studyJourneyCompletedCount(draft.completed) : 0
    return jc > 0 ? { ...t, journeyStagesCompleted: jc } : t
  })
}

export function landingQuickStats(progress: ProgressData | undefined) {
  const totalAnswered = progress?.totalAnswered ?? 0
  if (!progress || totalAnswered < 1) {
    return { totalAnswered, weightedAcc: null as number | null, lowest: null as number | null }
  }
  const topicRows = filterDisplayAreas(progress.areas)
    .flatMap((a) => a.topicos)
    .filter((t) => t.totalAnswered > 0)
  const lowest =
    topicRows.length > 0 ? Math.round(Math.min(...topicRows.map((t) => t.accuracyPct))) : null
  return {
    totalAnswered,
    weightedAcc: Math.round(progress.accuracyPct),
    lowest,
  }
}
