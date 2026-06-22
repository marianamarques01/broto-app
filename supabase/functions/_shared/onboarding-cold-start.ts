/**
 * Espelho de `packages/shared/src/routine/onboarding-cold-start.ts` (deriveStrongWeakAreas).
 * Edge Functions no deploy não resolvem `@broto/shared/routine/*` — manter sincronizado.
 */

const ONBOARDING_AREA_KEY_MAP: Record<string, string> = {
  linguagens: 'linguagens',
  humanas: 'ciencias-humanas',
  natureza: 'ciencias-natureza',
  matematica: 'matematica',
}

const ENEM_AREA_KEYS = new Set([
  'linguagens',
  'ciencias-humanas',
  'ciencias-natureza',
  'matematica',
])

function normalizeAreaSlug(raw: string): string | null {
  const trimmed = raw.trim()
  if (ENEM_AREA_KEYS.has(trimmed)) return trimmed
  return ONBOARDING_AREA_KEY_MAP[trimmed] ?? null
}

export function deriveStrongWeakAreas(niveis: Record<string, string | null> | undefined): {
  strongAreas: string[]
  weakAreas: string[]
} {
  const strongAreas: string[] = []
  const weakAreas: string[] = []

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
