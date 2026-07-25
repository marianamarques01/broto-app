import { isCountablePracticeArea } from './lib/topico-to-area.ts'
import type { AreaStat, ProgressData } from './types/dashboard-progress.ts'

/** Bucket interno para respostas sem área ENEM — nunca exibir na UI. */
export const UNMAPPED_AREA_KEY = 'outros'

/** Tópico sintético sem classificação — não exibir em listas de estudo. */
export const UNCLASSIFIED_TOPIC_KEY = '__broto_sem_classificacao__'

export function isDisplayableEnemAreaKey(value: string): boolean {
  return isCountablePracticeArea(value)
}

export function filterDisplayAreas<T extends { value: string }>(
  areas: readonly T[] | undefined,
): T[] {
  if (!areas?.length) return []
  return areas.filter((a) => isDisplayableEnemAreaKey(a.value))
}

function stripUnclassifiedTopicos(areas: AreaStat[]): AreaStat[] {
  return areas.map((a) => ({
    ...a,
    topicos: a.topicos.filter((t) => t.value !== UNCLASSIFIED_TOPIC_KEY),
  }))
}

export function sanitizeStudyTodayByArea(
  byArea: Record<string, { answered: number; correct: number }> | undefined,
): Record<string, { answered: number; correct: number }> {
  if (!byArea) return {}
  const out: Record<string, { answered: number; correct: number }> = {}
  for (const [key, stats] of Object.entries(byArea)) {
    if (!isCountablePracticeArea(key)) continue
    out[key] = stats
  }
  return out
}

export function sanitizeProgressData(data: ProgressData): ProgressData {
  return {
    ...data,
    areas: stripUnclassifiedTopicos(filterDisplayAreas(data.areas)),
  }
}

export function pickWeakestDisplayArea(areas: AreaStat[] | undefined): AreaStat | undefined {
  const visible = filterDisplayAreas(areas)
  if (visible.length === 0) return undefined
  return [...visible].sort((a, b) => {
    if (a.totalAnswered === 0 && b.totalAnswered === 0) return 0
    if (a.totalAnswered === 0) return 1
    if (b.totalAnswered === 0) return -1
    return a.accuracyPct - b.accuracyPct
  })[0]
}
