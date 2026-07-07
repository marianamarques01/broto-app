import { describe, expect, it } from 'vitest'
import {
  checkLinhaCountZeroFactor,
  mergeFatoresZero,
  normalizeFatoresZero,
  normalizeFatoresZeroMotivos,
} from './check-fatores-zero'

describe('checkLinhaCountZeroFactor', () => {
  it('retorna null com 7 ou mais linhas', () => {
    expect(checkLinhaCountZeroFactor(7)).toBeNull()
    expect(checkLinhaCountZeroFactor(15)).toBeNull()
  })

  it('detecta texto_curto abaixo de 7 linhas', () => {
    const result = checkLinhaCountZeroFactor(6)
    expect(result).toEqual({
      detectado: true,
      motivos: ['texto_curto'],
      detalhes: 'Texto com 6 linha(s) — mínimo exigido pelo ENEM: 7 linhas.',
    })
  })
})

describe('normalizeFatoresZeroMotivos', () => {
  it('filtra motivos inválidos e deduplica', () => {
    expect(
      normalizeFatoresZeroMotivos(['fuga_tema', 'invalido', 'fuga_tema', 'texto_curto']),
    ).toEqual(['fuga_tema', 'texto_curto'])
  })
})

describe('normalizeFatoresZero', () => {
  it('marca detectado=false se motivos ficarem vazios após filtro', () => {
    expect(normalizeFatoresZero({ detectado: true, motivos: ['foo'] })).toEqual({
      detectado: false,
      motivos: [],
    })
  })
})

describe('mergeFatoresZero', () => {
  it('combina determinístico com LLM', () => {
    const merged = mergeFatoresZero(checkLinhaCountZeroFactor(5), {
      detectado: true,
      motivos: ['fuga_tema', 'invalido'],
      detalhes: 'Fuga parcial.',
    })

    expect(merged.detectado).toBe(true)
    expect(merged.motivos).toEqual(['texto_curto', 'fuga_tema'])
    expect(merged.detalhes).toContain('Fuga parcial.')
  })
})
