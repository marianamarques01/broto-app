import { describe, expect, it } from 'vitest'
import { mergeByAreaWithServer } from './merge-study-today'
import type { DailyMissionsState } from '../types/daily-missions'

describe('mergeByAreaWithServer', () => {
  const daily: DailyMissionsState = {
    date: '2026-06-19',
    byArea: {
      matematica: { answered: 2, correct: 1 },
    },
  }

  it('retorna byArea local quando servidor vazio', () => {
    expect(mergeByAreaWithServer(daily, undefined)).toEqual(daily.byArea)
  })

  it('usa Math.max por área entre local e servidor', () => {
    expect(
      mergeByAreaWithServer(daily, {
        matematica: { answered: 5, correct: 3 },
        linguagens: { answered: 1, correct: 1 },
      }),
    ).toEqual({
      matematica: { answered: 5, correct: 3 },
      linguagens: { answered: 1, correct: 1 },
    })
  })

  it('ignora chaves de área não contáveis no servidor', () => {
    expect(
      mergeByAreaWithServer(daily, {
        outros: { answered: 99, correct: 99 },
      }),
    ).toEqual(daily.byArea)
  })
})
