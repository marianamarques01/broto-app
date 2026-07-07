import { describe, expect, it } from 'vitest'
import type { RedacaoCorrecao, RedacaoRevisaoHumana } from '../types/redacao.ts'
import {
  assertCorrecaoBlindSemNotasIa,
  buildCalibracaoComparacao,
  computeCalibracaoMetricas,
  isValidNotaCompetencia,
  stripCorrecaoIaScores,
} from './calibracao.ts'

const CORRECAO_BASE: RedacaoCorrecao = {
  id: 'c1',
  redacao_id: 'r1',
  nota_competencia_i: 120,
  nota_competencia_ii: 80,
  nota_competencia_iii: 160,
  nota_competencia_iv: 40,
  nota_competencia_v: 200,
  nota_total: 600,
  justificativa_i: 'ia i',
  justificativa_ii: 'ia ii',
  justificativa_iii: 'ia iii',
  justificativa_iv: 'ia iv',
  justificativa_v: 'ia v',
  marcacoes_inline: [],
  fatores_zero: { detectado: false, motivos: [] },
  prompt_version: 'v1',
  modelo_usado: 'gpt-4o',
  rag_chunks_used: [{ id: 'chunk-1' }],
  created_at: '2026-07-01T00:00:00Z',
}

describe('stripCorrecaoIaScores', () => {
  it('remove notas, justificativas e marcações da IA', () => {
    const blind = stripCorrecaoIaScores(CORRECAO_BASE)
    expect(blind).toEqual({
      id: 'c1',
      redacao_id: 'r1',
      prompt_version: 'v1',
      modelo_usado: 'gpt-4o',
      created_at: '2026-07-01T00:00:00Z',
    })
    expect(assertCorrecaoBlindSemNotasIa(blind as unknown as Record<string, unknown>)).toBe(true)
  })
})

describe('buildCalibracaoComparacao', () => {
  it('calcula diferença por competência', () => {
    const revisao: RedacaoRevisaoHumana = {
      id: 'rev1',
      correcao_id: 'c1',
      revisor_id: 'u1',
      nota_humana_i: 160,
      nota_humana_ii: 80,
      nota_humana_iii: 120,
      nota_humana_iv: 80,
      nota_humana_v: 160,
      notas_ia_reveladas_em: '2026-07-02T00:00:00Z',
      comentario: null,
      created_at: '2026-07-02T00:00:00Z',
    }

    const comparacao = buildCalibracaoComparacao(CORRECAO_BASE, revisao)
    expect(comparacao).toHaveLength(5)
    expect(comparacao[0]).toMatchObject({
      competencia: 'I',
      nota_ia: 120,
      nota_humana: 160,
      diferenca: 40,
      diferenca_absoluta: 40,
    })
    expect(comparacao[3]).toMatchObject({
      competencia: 'IV',
      nota_ia: 40,
      nota_humana: 80,
      diferenca: 40,
      diferenca_absoluta: 40,
    })
  })
})

describe('computeCalibracaoMetricas', () => {
  it('calcula diferença média absoluta por competência', () => {
    const metricas = computeCalibracaoMetricas([
      { competencia: 'I', nota_ia: 120, nota_humana: 160 },
      { competencia: 'I', nota_ia: 80, nota_humana: 80 },
      { competencia: 'II', nota_ia: 40, nota_humana: 80 },
    ])

    const compI = metricas.find((m) => m.competencia === 'I')
    expect(compI?.amostras).toBe(2)
    expect(compI?.diferenca_media_absoluta).toBe(20)

    const compII = metricas.find((m) => m.competencia === 'II')
    expect(compII?.amostras).toBe(1)
    expect(compII?.diferenca_media_absoluta).toBe(40)
  })
})

describe('isValidNotaCompetencia', () => {
  it('aceita múltiplos de 40', () => {
    expect(isValidNotaCompetencia(120)).toBe(true)
    expect(isValidNotaCompetencia(35)).toBe(false)
  })
})

describe('assertCorrecaoBlindSemNotasIa', () => {
  it('rejeita payload com nota da IA', () => {
    expect(assertCorrecaoBlindSemNotasIa({ nota_competencia_i: 120 })).toBe(false)
    expect(assertCorrecaoBlindSemNotasIa({ id: 'c1' })).toBe(true)
  })
})
