import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildMockExamPayload, isValidMockExamN } from './build-payload'
import type { MockExamPoolEntry } from './types'

function entry(
  id: string,
  discipline: string | null,
  overrides: Partial<MockExamPoolEntry> = {},
): MockExamPoolEntry {
  const [y, idx, ...rest] = id.split(/-/)
  return {
    questionId: id,
    year: Number(y),
    index: Number(idx),
    language: rest.length ? rest.join('-') : null,
    discipline,
    ...overrides,
  }
}

describe('buildMockExamPayload', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('POOL_EMPTY quando pool vazio', () => {
    const r = buildMockExamPayload(5, false, ['mat'], [])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('POOL_EMPTY')
  })

  it('POOL_TOO_SMALL quando N maior que pool', () => {
    const pool = [entry('2023-1', 'mat'), entry('2023-2', 'mat')]
    const r = buildMockExamPayload(5, true, [], pool)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('POOL_TOO_SMALL')
  })

  it('deduplica por questionId antes de amostrar', () => {
    const pool = [entry('2023-1', 'mat'), entry('2023-1', 'mat', { year: 2023, index: 1 })]
    const r = buildMockExamPayload(1, true, [], pool)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.questionIds.length).toBe(1)
  })

  it('randomMode retorna N distintos quando pool permite', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const pool = Array.from({ length: 20 }, (_, i) => entry(`2023-${i + 1}`, 'mat'))
    const r = buildMockExamPayload(7, true, [], pool)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.questionIds.length).toBe(7)
      expect(new Set(r.questionIds).size).toBe(7)
    }
  })

  it('estratificação: múltiplas áreas distribui N entre disciplinas', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const pool = [
      ...Array.from({ length: 10 }, (_, i) => entry(`2023-${i + 1}`, 'mat')),
      ...Array.from({ length: 10 }, (_, i) => entry(`2022-${i + 1}`, 'ciencias_natureza')),
    ]
    const r = buildMockExamPayload(6, false, ['mat', 'ciencias_natureza'], pool)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.selected.length).toBe(6)
      const nMat = r.selected.filter((s) => s.discipline === 'mat').length
      const nCn = r.selected.filter((s) => s.discipline === 'ciencias_natureza').length
      expect(nMat + nCn).toBe(6)
      expect(nMat).toBe(3)
      expect(nCn).toBe(3)
    }
  })

  it('randomMode: ignora estratos e amostra N sobre o pool inteiro', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.33)
    const pool = [
      ...Array.from({ length: 8 }, (_, i) => entry(`2023-${i + 1}`, 'mat')),
      ...Array.from({ length: 8 }, (_, i) => entry(`2022-${i + 1}`, 'hum')),
    ]
    const r = buildMockExamPayload(4, true, ['mat', 'hum'], pool)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.questionIds.length).toBe(4)
      expect(new Set(r.questionIds).size).toBe(4)
    }
  })
})

describe('isValidMockExamN', () => {
  it('aceita limites do MVP', () => {
    expect(isValidMockExamN(5)).toBe(true)
    expect(isValidMockExamN(90)).toBe(true)
    expect(isValidMockExamN(4)).toBe(false)
    expect(isValidMockExamN(91)).toBe(false)
  })
})
