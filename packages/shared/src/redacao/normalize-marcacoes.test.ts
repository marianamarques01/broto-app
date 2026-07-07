import { describe, expect, it } from 'vitest'
import { findTrechoInTexto, isMarcacaoOffsetValid, normalizeMarcacoes } from './normalize-marcacoes'

const TEXTO =
  'A educação no Brasil enfrenta desafios estruturais.\n' +
  'Primeiramente, a falta de investimento compromete a qualidade.\n' +
  'Portanto, medidas urgentes são necessárias.'

describe('isMarcacaoOffsetValid', () => {
  it('valida offset correto', () => {
    const trecho = 'falta de investimento'
    const start = TEXTO.indexOf(trecho)
    expect(
      isMarcacaoOffsetValid(TEXTO, {
        start_offset: start,
        end_offset: start + trecho.length,
        trecho,
        tipo_problema: 'argumentacao',
        comentario: 'Exemplo.',
        competencia: 'III',
      }),
    ).toBe(true)
  })
})

describe('findTrechoInTexto', () => {
  it('encontra trecho com diferença de caixa', () => {
    const found = findTrechoInTexto(TEXTO, 'FALTA DE INVESTIMENTO')
    expect(found).not.toBeNull()
    expect(TEXTO.slice(found!.start_offset, found!.end_offset).toLowerCase()).toBe(
      'falta de investimento',
    )
  })

  it('encontra trecho com espaços flexíveis', () => {
    const found = findTrechoInTexto(TEXTO, 'falta   de   investimento')
    expect(found).not.toBeNull()
  })
})

describe('normalizeMarcacoes', () => {
  it('corrige offsets errados via fuzzy match', () => {
    const trecho = 'falta de investimento'
    const marcacoes = normalizeMarcacoes(TEXTO, [
      {
        start_offset: 0,
        end_offset: 3,
        trecho,
        tipo_problema: 'coesao',
        comentario: 'Trecho impreciso.',
        competencia: 'IV',
      },
    ])

    expect(marcacoes).toHaveLength(1)
    expect(marcacoes[0].trecho).toBe(trecho)
    expect(isMarcacaoOffsetValid(TEXTO, marcacoes[0])).toBe(true)
  })

  it('descarta marcações cujo trecho não existe no texto', () => {
    const marcacoes = normalizeMarcacoes(TEXTO, [
      {
        start_offset: 0,
        end_offset: 5,
        trecho: 'trecho inexistente no texto',
        tipo_problema: 'ortografia',
        comentario: 'N/A',
        competencia: 'I',
      },
    ])
    expect(marcacoes).toHaveLength(0)
  })
})
