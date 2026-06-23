import { describe, expect, it } from 'vitest'
import { computeClassAreaStats, computeClassAtRisk, pKnowTone } from './class-p-know-insights'

describe('computeClassAreaStats', () => {
  it('agrupa por area_key e ordena do mais fraco ao mais forte', () => {
    const stats = computeClassAreaStats([
      {
        user_id: 'a',
        area_key: 'matematica',
        topico_value: 'funcoes',
        p_know: 0.5,
        last_practiced: '2026-06-01',
      },
      {
        user_id: 'b',
        area_key: 'matematica',
        topico_value: 'geometria',
        p_know: 0.7,
        last_practiced: '2026-06-02',
      },
      {
        user_id: 'a',
        area_key: 'linguagens',
        topico_value: 'gramatica',
        p_know: 0.8,
        last_practiced: '2026-06-03',
      },
    ])

    expect(stats).toHaveLength(2)
    expect(stats[0]?.area).toBe('matematica')
    expect(stats[0]?.avgPKnow).toBeCloseTo(0.6)
    expect(stats[0]?.studentCount).toBe(2)
    expect(stats[1]?.area).toBe('linguagens')
  })

  it('ignora area_key não exibível', () => {
    expect(
      computeClassAreaStats([
        {
          user_id: 'a',
          area_key: 'outros',
          topico_value: 'x',
          p_know: 0.2,
          last_practiced: null,
        },
      ]),
    ).toHaveLength(0)
  })
})

describe('computeClassAtRisk', () => {
  it('marca inativos e alunos com 3+ tópicos fracos', () => {
    const result = computeClassAtRisk({
      studentIds: ['s1', 's2'],
      studentNames: new Map([
        ['s1', 'Ana'],
        ['s2', 'Bruno'],
      ]),
      studentStreaks: new Map([
        ['s1', 2],
        ['s2', 0],
      ]),
      activeStudentIds: new Set(['s1']),
      performance: [
        {
          user_id: 's2',
          area_key: 'matematica',
          topico_value: 'a',
          p_know: 0.2,
          last_practiced: null,
        },
        {
          user_id: 's2',
          area_key: 'matematica',
          topico_value: 'b',
          p_know: 0.25,
          last_practiced: null,
        },
        {
          user_id: 's2',
          area_key: 'matematica',
          topico_value: 'c',
          p_know: 0.1,
          last_practiced: null,
        },
      ],
    })

    expect(result.inactive).toHaveLength(1)
    expect(result.inactive[0]?.userId).toBe('s2')
    expect(result.struggling).toHaveLength(1)
    expect(result.struggling[0]?.weakTopicCount).toBe(3)
  })
})

describe('pKnowTone', () => {
  it('classifica faixas de domínio', () => {
    expect(pKnowTone(0.8)).toBe('good')
    expect(pKnowTone(0.5)).toBe('mid')
    expect(pKnowTone(0.2)).toBe('low')
  })
})
