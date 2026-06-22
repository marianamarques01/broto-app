import { describe, expect, it } from 'vitest'
import {
  applySessionPriorityToAreas,
  pKnowConfidenceFromObservations,
} from './routine-generate-api'
import type { AreaStat } from '../types/dashboard-progress'

function area(value: string, accuracyPct: number): AreaStat {
  return {
    value,
    label: value,
    accuracyPct,
    totalAnswered: 10,
    topicos: [],
  }
}

describe('pKnowConfidenceFromObservations', () => {
  it('low com poucas observações', () => {
    expect(pKnowConfidenceFromObservations(0)).toBe('low')
    expect(pKnowConfidenceFromObservations(2)).toBe('low')
  })

  it('medium entre 3 e 7', () => {
    expect(pKnowConfidenceFromObservations(3)).toBe('medium')
    expect(pKnowConfidenceFromObservations(7)).toBe('medium')
  })

  it('high com 8 ou mais', () => {
    expect(pKnowConfidenceFromObservations(8)).toBe('high')
    expect(pKnowConfidenceFromObservations(20)).toBe('high')
  })
})

describe('applySessionPriorityToAreas', () => {
  it('coloca áreas da edge antes das demais', () => {
    const areas = [area('matematica', 80), area('linguagens', 70), area('ciencias-natureza', 50)]
    const reordered = applySessionPriorityToAreas(areas, [
      { area: 'ciencias-natureza' },
      { area: 'linguagens' },
    ])
    expect(reordered.map((a) => a.value)).toEqual(['ciencias-natureza', 'linguagens', 'matematica'])
  })
})
