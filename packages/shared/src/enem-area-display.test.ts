import { describe, expect, it } from 'vitest'
import {
  filterDisplayAreas,
  pickWeakestDisplayArea,
  sanitizeProgressData,
} from './enem-area-display'
import type { AreaStat, ProgressData } from './types/dashboard-progress'

const canonical: AreaStat = {
  value: 'matematica',
  label: 'Matematica',
  totalAnswered: 2,
  totalCorrect: 1,
  accuracyPct: 50,
  topicos: [],
}

const outros: AreaStat = {
  value: 'outros',
  label: 'Outros',
  totalAnswered: 60,
  totalCorrect: 11,
  accuracyPct: 18.3,
  topicos: [],
}

describe('enem-area-display', () => {
  it('remove outros da lista exibível', () => {
    expect(filterDisplayAreas([canonical, outros])).toEqual([canonical])
  })

  it('sanitizeProgressData não devolve bucket outros', () => {
    const data: ProgressData = {
      totalAnswered: 2,
      totalCorrect: 1,
      accuracyPct: 50,
      areas: [canonical, outros],
    }
    expect(sanitizeProgressData(data).areas).toEqual([canonical])
    expect(sanitizeProgressData(data).totalAnswered).toBe(2)
  })

  it('pickWeakestDisplayArea ignora outros', () => {
    expect(pickWeakestDisplayArea([outros, canonical])?.value).toBe('matematica')
  })
})
