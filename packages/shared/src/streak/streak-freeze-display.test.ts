import { describe, expect, it } from 'vitest'
import { daysUntilNextStreakFreeze, streakFreezeDisplayLabel } from './streak-freeze-display'

describe('streak-freeze-display', () => {
  it('streak 2 sem freeze: próximo em 5 dias', () => {
    expect(daysUntilNextStreakFreeze(2, 0)).toBe(5)
    expect(streakFreezeDisplayLabel(2, 0)).toBe('🧊 0/3 · próximo em 5 dias')
  })

  it('streak 7 com freeze disponível', () => {
    expect(streakFreezeDisplayLabel(7, 1)).toBe('🧊 1 freeze')
  })

  it('3 freezes: mostra inventário cheio', () => {
    expect(daysUntilNextStreakFreeze(14, 3)).toBeNull()
    expect(streakFreezeDisplayLabel(14, 3)).toBe('🧊 3 freezes')
  })
})
