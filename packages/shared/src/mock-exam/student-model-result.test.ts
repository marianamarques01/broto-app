import { describe, expect, it } from 'vitest'
import {
  buildCriticalTopicsPracticeHref,
  computeAreaStatsFromResults,
  computeCriticalTopics,
  mockExamAreaBarColor,
  type MockExamResultItem,
} from './student-model-result'

const results: MockExamResultItem[] = [
  { questionId: 'q1', topicKey: 'genetica', areaKey: 'ciencias-natureza', isCorrect: false },
  { questionId: 'q2', topicKey: 'genetica', areaKey: 'ciencias-natureza', isCorrect: true },
  { questionId: 'q3', topicKey: 'funcoes', areaKey: 'matematica', isCorrect: false },
  { questionId: 'q4', topicKey: 'funcoes', areaKey: 'matematica', isCorrect: false },
  { questionId: 'q5', topicKey: null, areaKey: 'matematica', isCorrect: true },
]

describe('computeAreaStatsFromResults', () => {
  it('agrega acertos por área', () => {
    const stats = computeAreaStatsFromResults(results)
    const cn = stats.find((s) => s.areaKey === 'ciencias-natureza')
    const mat = stats.find((s) => s.areaKey === 'matematica')
    expect(cn).toMatchObject({ correct: 1, total: 2, pct: 0.5 })
    expect(mat).toMatchObject({ correct: 1, total: 3, pct: 1 / 3 })
  })
})

describe('computeCriticalTopics', () => {
  it('prioriza tópicos errados com p_know baixo', () => {
    const critical = computeCriticalTopics(results, [
      { topico_value: 'genetica', area_key: 'ciencias-natureza', p_know: 0.2, total_answered: 5 },
      { topico_value: 'funcoes', area_key: 'matematica', p_know: 0.45, total_answered: 8 },
    ])
    expect(critical.map((t) => t.topicKey)).toEqual(['genetica', 'funcoes'])
    expect(critical[0]?.pKnow).toBe(0.2)
  })

  it('ignora tópicos com p_know >= 0.5', () => {
    const critical = computeCriticalTopics(
      results.filter((r) => r.topicKey === 'genetica'),
      [{ topico_value: 'genetica', area_key: 'ciencias-natureza', p_know: 0.6, total_answered: 5 }],
    )
    expect(critical).toHaveLength(0)
  })
})

describe('mockExamAreaBarColor', () => {
  it('aplica thresholds de cor', () => {
    expect(mockExamAreaBarColor(0.75)).toBe('var(--green-400)')
    expect(mockExamAreaBarColor(0.55)).toBe('var(--gold-400)')
    expect(mockExamAreaBarColor(0.4)).toBe('var(--red-400)')
  })
})

describe('buildCriticalTopicsPracticeHref', () => {
  it('monta URL do banco com tópicos da área dominante', () => {
    const href = buildCriticalTopicsPracticeHref([
      { topicKey: 'genetica', areaKey: 'ciencias-natureza', pKnow: 0.2 },
      { topicKey: 'funcoes', areaKey: 'matematica', pKnow: 0.3 },
    ])
    expect(href).toContain('/study/ciencias-natureza/banco')
    expect(href).toContain('topics=genetica')
  })
})
