import type { PracticeSessionSummary, StudentMockExamConfig } from './types'

const MOCK_EXAM_AREA_LABELS: Record<string, string> = {
  linguagens: 'Linguagens',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  matematica: 'Matemática',
  sem_area: 'Sem área',
}

function labelsForAreaSlugs(slugs: string[]): string {
  const parts = slugs.map((s) => MOCK_EXAM_AREA_LABELS[s] ?? s)
  return parts.join(' · ')
}

function tryAreasFromSummary(summary: unknown): string | null {
  if (!summary || typeof summary !== 'object') return null
  const porArea = (summary as PracticeSessionSummary).porArea
  if (!porArea || typeof porArea !== 'object') return null
  const keys = Object.keys(porArea).filter((k) => k.length > 0)
  if (keys.length === 0) return null
  return labelsForAreaSlugs(keys)
}

/**
 * Rótulo curto das áreas da sessão de prática para listas (histórico).
 * Usa `practice_sessions.config`; se vazio ou legado, tenta `summary.porArea`.
 */
export function formatPracticeSessionAreasLabel(config: unknown, summary?: unknown): string {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const c = config as Partial<StudentMockExamConfig>
    const randomMode = Boolean(c.randomMode)
    const areaValues = Array.isArray(c.areaValues)
      ? c.areaValues.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : []

    if (randomMode) {
      return 'Aleatório (todas as áreas)'
    }
    if (areaValues.length === 1) {
      return labelsForAreaSlugs(areaValues)
    }
    if (areaValues.length > 1) {
      return labelsForAreaSlugs(areaValues)
    }
  }

  const fromSummary = tryAreasFromSummary(summary)
  if (fromSummary) return fromSummary

  return 'Todas as áreas'
}
