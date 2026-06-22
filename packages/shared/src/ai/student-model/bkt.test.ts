import { describe, it, expect } from 'vitest'
import { BKT_DEFAULT_P_KNOW, BKT_DEFAULT_PARAMS, updatePKnow } from './bkt'

describe('updatePKnow', () => {
  it('aumenta P(Know) após acerto com prior baixo (cold start)', () => {
    const next = updatePKnow(BKT_DEFAULT_P_KNOW, true)
    expect(next).toBeGreaterThan(BKT_DEFAULT_P_KNOW)
    expect(next).toBeLessThan(1)
  })

  it('reduz P(Know) após erro com prior alto', () => {
    const prior = 0.92
    const next = updatePKnow(prior, false)
    expect(next).toBeLessThan(prior)
    expect(next).toBeGreaterThan(0)
  })

  it('sequência de acertos eleva P(Know) monotonicamente', () => {
    let p = BKT_DEFAULT_P_KNOW
    const trail: number[] = [p]
    for (let i = 0; i < 8; i++) {
      p = updatePKnow(p, true)
      trail.push(p)
    }
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i]).toBeGreaterThan(trail[i - 1]!)
    }
  })

  it('sequência de erros reduz P(Know) monotonicamente', () => {
    let p = 0.75
    const trail: number[] = [p]
    for (let i = 0; i < 6; i++) {
      p = updatePKnow(p, false)
      trail.push(p)
    }
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i]).toBeLessThan(trail[i - 1]!)
    }
  })

  it('estabiliza abaixo de 1 mesmo com muitos acertos a partir de prior alto', () => {
    let p = 0.97
    for (let i = 0; i < 20; i++) {
      p = updatePKnow(p, true)
    }
    expect(p).toBeGreaterThan(0.97)
    expect(p).toBeLessThan(1)
  })

  it('primeira observação parte do prior default da migration (0.3)', () => {
    const afterCorrect = updatePKnow(BKT_DEFAULT_P_KNOW, true, BKT_DEFAULT_PARAMS)
    const afterWrong = updatePKnow(BKT_DEFAULT_P_KNOW, false, BKT_DEFAULT_PARAMS)

    expect(BKT_DEFAULT_P_KNOW).toBe(0.3)
    expect(afterCorrect).not.toBe(afterWrong)
    expect(afterCorrect).toBeGreaterThan(0.3)
    expect(afterWrong).toBeLessThan(0.3)
  })
})
