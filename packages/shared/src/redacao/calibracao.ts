import {
  REDACAO_COMPETENCIAS,
  REDACAO_NOTAS_VALIDAS,
  type RedacaoCompetencia,
  type RedacaoCorrecao,
  type RedacaoNotaCompetencia,
  type RedacaoRevisaoHumana,
} from '../types/redacao.ts'
import { getNotaCompetencia } from './competencia-labels.ts'

/** Resposta cega — sem notas, justificativas ou marcações da IA. */
export type RedacaoCorrecaoBlind = {
  id: string
  redacao_id: string
  prompt_version: string
  modelo_usado: string
  created_at: string
}

export type CalibracaoComparacaoCompetencia = {
  competencia: RedacaoCompetencia
  nota_ia: number
  nota_humana: number
  diferenca: number
  diferenca_absoluta: number
}

export type CalibracaoMetricasCompetencia = {
  competencia: RedacaoCompetencia
  amostras: number
  diferenca_media_absoluta: number
}

export type CalibracaoNotasHumanas = {
  nota_humana_i: RedacaoNotaCompetencia
  nota_humana_ii: RedacaoNotaCompetencia
  nota_humana_iii: RedacaoNotaCompetencia
  nota_humana_iv: RedacaoNotaCompetencia
  nota_humana_v: RedacaoNotaCompetencia
}

const NOTA_HUMANA_FIELD: Record<RedacaoCompetencia, keyof CalibracaoNotasHumanas> = {
  I: 'nota_humana_i',
  II: 'nota_humana_ii',
  III: 'nota_humana_iii',
  IV: 'nota_humana_iv',
  V: 'nota_humana_v',
}

/** Remove dados da IA que poderiam enviesar o revisor humano. */
export function stripCorrecaoIaScores(correcao: RedacaoCorrecao): RedacaoCorrecaoBlind {
  return {
    id: correcao.id,
    redacao_id: correcao.redacao_id,
    prompt_version: correcao.prompt_version,
    modelo_usado: correcao.modelo_usado,
    created_at: correcao.created_at,
  }
}

export function isValidNotaCompetencia(value: unknown): value is RedacaoNotaCompetencia {
  return typeof value === 'number' && (REDACAO_NOTAS_VALIDAS as readonly number[]).includes(value)
}

export function getNotaHumanaCompetencia(
  revisao: Pick<
    RedacaoRevisaoHumana,
    'nota_humana_i' | 'nota_humana_ii' | 'nota_humana_iii' | 'nota_humana_iv' | 'nota_humana_v'
  >,
  competencia: RedacaoCompetencia,
): number | null {
  const field = NOTA_HUMANA_FIELD[competencia]
  const value = revisao[field]
  return typeof value === 'number' ? value : null
}

export function buildCalibracaoComparacao(
  correcao: RedacaoCorrecao,
  revisao: RedacaoRevisaoHumana,
): CalibracaoComparacaoCompetencia[] {
  return REDACAO_COMPETENCIAS.map((competencia) => {
    const nota_ia = getNotaCompetencia(correcao, competencia)
    const nota_humana = getNotaHumanaCompetencia(revisao, competencia) ?? 0
    const diferenca = nota_humana - nota_ia
    return {
      competencia,
      nota_ia,
      nota_humana,
      diferenca,
      diferenca_absoluta: Math.abs(diferenca),
    }
  })
}

export type CalibracaoParNotas = {
  competencia: RedacaoCompetencia
  nota_ia: number
  nota_humana: number
}

export function computeCalibracaoMetricas(
  pares: CalibracaoParNotas[],
): CalibracaoMetricasCompetencia[] {
  return REDACAO_COMPETENCIAS.map((competencia) => {
    const subset = pares.filter((p) => p.competencia === competencia)
    if (subset.length === 0) {
      return { competencia, amostras: 0, diferenca_media_absoluta: 0 }
    }
    const soma = subset.reduce((acc, p) => acc + Math.abs(p.nota_humana - p.nota_ia), 0)
    return {
      competencia,
      amostras: subset.length,
      diferenca_media_absoluta: Math.round(soma / subset.length),
    }
  })
}

/** Garante que a resposta cega não vaza notas ou feedback da IA. */
export function assertCorrecaoBlindSemNotasIa(payload: Record<string, unknown>): boolean {
  const forbidden = [
    'nota_competencia_i',
    'nota_competencia_ii',
    'nota_competencia_iii',
    'nota_competencia_iv',
    'nota_competencia_v',
    'nota_total',
    'justificativa_i',
    'justificativa_ii',
    'justificativa_iii',
    'justificativa_iv',
    'justificativa_v',
    'marcacoes_inline',
    'fatores_zero',
    'rag_chunks_used',
  ]
  return forbidden.every((key) => !(key in payload))
}
