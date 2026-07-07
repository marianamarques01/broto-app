import { describe, expect, it } from 'vitest'
import { aggregateCorrecao, buildZeroCorrecao, validateCorrectionJson } from './validate-correction'

const TEXTO =
  'Linha um.\nLinha dois.\nLinha três.\nLinha quatro.\nLinha cinco.\nLinha seis.\nLinha sete.'

describe('aggregateCorrecao', () => {
  it('clampa notas e soma total', () => {
    const result = aggregateCorrecao(TEXTO, [
      { competencia: 'I', nota: 85, justificativa: 'Boa norma.', marcacoes: [] },
      { competencia: 'II', nota: 120, justificativa: 'Tema ok.', marcacoes: [] },
      { competencia: 'III', nota: 95, justificativa: 'Argumentos medianos.', marcacoes: [] },
      { competencia: 'IV', nota: 80, justificativa: 'Coesão adequada.', marcacoes: [] },
      { competencia: 'V', nota: 160, justificativa: 'Proposta completa.', marcacoes: [] },
    ])

    expect(result.notas).toEqual({ I: 80, II: 120, III: 80, IV: 80, V: 160 })
    expect(result.nota_total).toBe(520)
  })
})

describe('buildZeroCorrecao', () => {
  it('zera todas as competências', () => {
    const result = buildZeroCorrecao(TEXTO, {
      detectado: true,
      motivos: ['fuga_tema'],
      detalhes: 'Fuga total.',
    })

    expect(result.nota_total).toBe(0)
    expect(result.notas).toEqual({ I: 0, II: 0, III: 0, IV: 0, V: 0 })
    expect(result.fatores_zero.motivos).toEqual(['fuga_tema'])
  })
})

describe('validateCorrectionJson', () => {
  it('aplica fator zero determinístico quando linha_count < 7', () => {
    const result = validateCorrectionJson({
      texto: 'curto',
      linha_count: 4,
      competencias: [{ competencia: 'I', nota: 160, justificativa: 'Ignorado.', marcacoes: [] }],
      fatores_zero: { detectado: false, motivos: [] },
    })

    expect(result.nota_total).toBe(0)
    expect(result.fatores_zero).toEqual({
      detectado: true,
      motivos: ['texto_curto'],
      detalhes: 'Texto com 4 linha(s) — mínimo exigido pelo ENEM: 7 linhas.',
    })
  })

  it('zera correção quando LLM detecta fator zero válido', () => {
    const result = validateCorrectionJson({
      texto: TEXTO,
      linha_count: 7,
      competencias: [{ competencia: 'I', nota: 200, justificativa: 'Excelente.', marcacoes: [] }],
      fatores_zero: { detectado: true, motivos: ['fuga_tema'], detalhes: 'Fuga.' },
    })

    expect(result.nota_total).toBe(0)
    expect(result.fatores_zero.motivos).toEqual(['fuga_tema'])
  })

  it('normaliza marcações quando não há fator zero', () => {
    const trecho = 'Linha três.'
    const result = validateCorrectionJson({
      texto: TEXTO,
      linha_count: 7,
      competencias: [
        {
          competencia: 'II',
          nota: 120,
          justificativa: 'Ok.',
          marcacoes: [
            {
              start_offset: 0,
              end_offset: 1,
              trecho,
              tipo_problema: 'repertorio',
              comentario: 'Genérico.',
              competencia: 'II',
            },
          ],
        },
      ],
      fatores_zero: { detectado: false, motivos: [] },
    })

    expect(result.nota_total).toBe(120)
    expect(result.marcacoes_inline).toHaveLength(1)
    expect(result.marcacoes_inline[0].trecho).toBe(trecho)
  })
})
