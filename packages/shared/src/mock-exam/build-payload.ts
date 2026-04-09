import { MOCK_EXAM_N_MAX, MOCK_EXAM_N_MIN } from './constants'
import type { MockExamPoolEntry, BuildMockExamPayloadResult } from './types'
import { shuffleInPlace } from './shuffle'

function dedupePool(pool: MockExamPoolEntry[]): MockExamPoolEntry[] {
  const seen = new Set<string>()
  const out: MockExamPoolEntry[] = []
  for (const p of pool) {
    if (seen.has(p.questionId)) continue
    seen.add(p.questionId)
    out.push(p)
  }
  return out
}

function allocateStrataCounts(n: number, numStrata: number): number[] {
  if (numStrata <= 0) return []
  const base = Math.floor(n / numStrata)
  let rem = n % numStrata
  const counts: number[] = []
  for (let i = 0; i < numStrata; i++) {
    counts.push(base + (rem > 0 ? 1 : 0))
    if (rem > 0) rem--
  }
  return counts
}

/**
 * Seleciona até `nQuestoes` itens únicos do pool com amostragem estratificada por `discipline`
 * quando há várias áreas explícitas; em `randomMode`, amostra uniforme sobre todo o pool.
 */
export function buildMockExamPayload(
  nQuestoes: number,
  randomMode: boolean,
  areaValues: string[],
  pool: MockExamPoolEntry[],
): BuildMockExamPayloadResult {
  const n = Math.floor(nQuestoes)
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: { code: 'POOL_TOO_SMALL', poolSize: 0, requested: 0 } }
  }

  const clean = dedupePool(pool)
  if (clean.length === 0) {
    return { ok: false, error: { code: 'POOL_EMPTY' } }
  }
  if (clean.length < n) {
    return { ok: false, error: { code: 'POOL_TOO_SMALL', poolSize: clean.length, requested: n } }
  }

  if (randomMode || areaValues.length <= 1) {
    const shuffled = shuffleInPlace([...clean])
    const selected = shuffled.slice(0, n)
    return {
      ok: true,
      questionIds: selected.map((x) => x.questionId),
      selected,
    }
  }

  const areas = [...areaValues]
  const byArea = new Map<string, MockExamPoolEntry[]>()
  for (const a of areas) {
    byArea.set(a, [])
  }
  for (const item of clean) {
    const d = item.discipline ?? ''
    if (byArea.has(d)) {
      byArea.get(d)!.push(item)
    }
  }

  const counts = allocateStrataCounts(n, areas.length)
  const selected: MockExamPoolEntry[] = []

  for (let i = 0; i < areas.length; i++) {
    const need = counts[i] ?? 0
    const stratum = shuffleInPlace([...(byArea.get(areas[i]) ?? [])])
    if (stratum.length < need) {
      const poolSize = clean.length
      return { ok: false, error: { code: 'POOL_TOO_SMALL', poolSize, requested: n } }
    }
    selected.push(...stratum.slice(0, need))
  }

  shuffleInPlace(selected)
  return {
    ok: true,
    questionIds: selected.map((x) => x.questionId),
    selected,
  }
}

export function isValidMockExamN(n: number): boolean {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v >= MOCK_EXAM_N_MIN && v <= MOCK_EXAM_N_MAX
}
