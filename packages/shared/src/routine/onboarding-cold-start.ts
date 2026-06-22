import type { AreaStat } from '../types/dashboard-progress'
import type { EnemAreaKey } from '../enem-area-key'
import type { DiaRotina } from './generate-routine'
import { gerarRotina } from './generate-routine'

/** Chaves curtas do wizard de onboarding → slugs canônicos de área ENEM. */
export const ONBOARDING_AREA_KEY_MAP: Record<string, EnemAreaKey> = {
  linguagens: 'linguagens',
  humanas: 'ciencias-humanas',
  natureza: 'ciencias-natureza',
  matematica: 'matematica',
}

const AREA_LABELS: Record<EnemAreaKey, string> = {
  linguagens: 'Linguagens',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  matematica: 'Matemática',
}

const ALL_AREA_KEYS: EnemAreaKey[] = [
  'linguagens',
  'ciencias-humanas',
  'ciencias-natureza',
  'matematica',
]

export type OnboardingNivelArea = 'iniciante' | 'intermediario' | 'avancado'

export interface OnboardingRoutineInput {
  horasPorDia: number
  examDate?: string | null
  niveis?: Record<string, OnboardingNivelArea | null | undefined>
  strongAreas?: string[]
  weakAreas?: string[]
}

function isEnemAreaKey(value: string): value is EnemAreaKey {
  return value in AREA_LABELS
}

function normalizeAreaSlug(raw: string): EnemAreaKey | null {
  const trimmed = raw.trim()
  if (isEnemAreaKey(trimmed)) return trimmed
  const mapped = ONBOARDING_AREA_KEY_MAP[trimmed]
  return mapped ?? null
}

/** Deriva áreas fortes/fracas a partir dos níveis self-reported do onboarding. */
export function deriveStrongWeakAreas(
  niveis: Record<string, OnboardingNivelArea | null | undefined> | undefined,
): { strongAreas: EnemAreaKey[]; weakAreas: EnemAreaKey[] } {
  const strongAreas: EnemAreaKey[] = []
  const weakAreas: EnemAreaKey[] = []

  if (!niveis) return { strongAreas, weakAreas }

  for (const [rawKey, nivel] of Object.entries(niveis)) {
    const areaKey = normalizeAreaSlug(rawKey)
    if (!areaKey || !nivel) continue
    if (nivel === 'avancado' && !strongAreas.includes(areaKey)) {
      strongAreas.push(areaKey)
    }
    if (nivel === 'iniciante' && !weakAreas.includes(areaKey)) {
      weakAreas.push(areaKey)
    }
  }

  return { strongAreas, weakAreas }
}

function accuracyFromNivel(nivel: OnboardingNivelArea | null | undefined): number {
  if (nivel === 'iniciante') return 25
  if (nivel === 'avancado') return 75
  return 50
}

function buildAreaStat(areaKey: EnemAreaKey, accuracyPct: number): AreaStat {
  return {
    value: areaKey,
    label: AREA_LABELS[areaKey],
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPct,
    topicos: [],
  }
}

/**
 * Monta áreas para cold start: fracas primeiro (gerarRotina mantém ordem quando totalAnswered=0).
 */
export function buildColdStartAreas(input: OnboardingRoutineInput): AreaStat[] {
  const derived = deriveStrongWeakAreas(input.niveis)
  const strongSet = new Set(
    (input.strongAreas?.length ? input.strongAreas : derived.strongAreas)
      .map(normalizeAreaSlug)
      .filter((k): k is EnemAreaKey => k !== null),
  )
  const weakSet = new Set(
    (input.weakAreas?.length ? input.weakAreas : derived.weakAreas)
      .map(normalizeAreaSlug)
      .filter((k): k is EnemAreaKey => k !== null),
  )

  const nivelByArea = new Map<EnemAreaKey, OnboardingNivelArea | null>()
  if (input.niveis) {
    for (const [rawKey, nivel] of Object.entries(input.niveis)) {
      const areaKey = normalizeAreaSlug(rawKey)
      if (areaKey) nivelByArea.set(areaKey, nivel ?? null)
    }
  }

  const weak: AreaStat[] = []
  const neutral: AreaStat[] = []
  const strong: AreaStat[] = []

  for (const areaKey of ALL_AREA_KEYS) {
    const nivel = nivelByArea.get(areaKey) ?? null
    const stat = buildAreaStat(areaKey, accuracyFromNivel(nivel))
    if (weakSet.has(areaKey)) weak.push(stat)
    else if (strongSet.has(areaKey)) strong.push(stat)
    else neutral.push(stat)
  }

  return [...weak, ...neutral, ...strong]
}

/** Gera rotina semanal local (cold start — sem p_know acumulado). */
export function generateOnboardingRoutine(input: OnboardingRoutineInput): DiaRotina[] {
  const areas = buildColdStartAreas(input)
  const horas = Number.isFinite(input.horasPorDia) && input.horasPorDia > 0 ? input.horasPorDia : 2
  return gerarRotina(areas, horas)
}
