import { describe, expect, it } from 'vitest'
import { clampLinhasRedacao, countLinhasRedacao, linhaCountStatus } from './count-linhas'

describe('countLinhasRedacao', () => {
  it('retorna 0 para texto vazio', () => {
    expect(countLinhasRedacao('')).toBe(0)
  })

  it('conta uma linha sem quebra', () => {
    expect(countLinhasRedacao('Introdução')).toBe(1)
  })

  it('conta linhas incluindo vazias no meio', () => {
    expect(countLinhasRedacao('a\n\nb')).toBe(3)
  })

  it('clamp impede mais de 30 linhas', () => {
    const input = Array.from({ length: 35 }, (_, i) => `linha ${i + 1}`).join('\n')
    const clamped = clampLinhasRedacao(input)
    expect(countLinhasRedacao(clamped)).toBe(30)
  })
})

describe('linhaCountStatus', () => {
  it('marca abaixo do mínimo ENEM', () => {
    expect(linhaCountStatus(6)).toBe('below_min')
  })

  it('marca faixa válida', () => {
    expect(linhaCountStatus(15)).toBe('valid')
  })

  it('marca teto da folha', () => {
    expect(linhaCountStatus(30)).toBe('at_max')
  })
})
