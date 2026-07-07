import { clampNota } from './clamp-nota.ts'
import {
  checkLinhaCountZeroFactor,
  mergeFatoresZero,
  normalizeFatoresZero,
  type FatoresZeroLlmInput,
} from './check-fatores-zero.ts'
import { normalizeMarcacoes, type MarcacaoInput } from './normalize-marcacoes.ts'
import {
  REDACAO_COMPETENCIAS,
  type FatoresZero,
  type MarcacaoInline,
  type RedacaoCompetencia,
  type RedacaoNotaCompetencia,
} from '../types/redacao.ts'

export type CompetenciaCorrecaoInput = {
  competencia: RedacaoCompetencia
  nota: number
  justificativa: string
  marcacoes?: MarcacaoInput[]
}

export type ValidatedCorrecao = {
  notas: Record<RedacaoCompetencia, RedacaoNotaCompetencia>
  justificativas: Record<RedacaoCompetencia, string>
  marcacoes_inline: MarcacaoInline[]
  fatores_zero: FatoresZero
  nota_total: number
}

const EMPTY_JUSTIFICATIVA = 'Correção não disponível para esta competência.'

function emptyNotas(): Record<RedacaoCompetencia, RedacaoNotaCompetencia> {
  return { I: 0, II: 0, III: 0, IV: 0, V: 0 }
}

function emptyJustificativas(): Record<RedacaoCompetencia, string> {
  return {
    I: EMPTY_JUSTIFICATIVA,
    II: EMPTY_JUSTIFICATIVA,
    III: EMPTY_JUSTIFICATIVA,
    IV: EMPTY_JUSTIFICATIVA,
    V: EMPTY_JUSTIFICATIVA,
  }
}

function sumNotas(notas: Record<RedacaoCompetencia, RedacaoNotaCompetencia>): number {
  return REDACAO_COMPETENCIAS.reduce((acc, c) => acc + notas[c], 0)
}

/** Agrega resultados por competência em notas, justificativas e marcações normalizadas. */
export function aggregateCorrecao(
  texto: string,
  competencias: CompetenciaCorrecaoInput[],
): Omit<ValidatedCorrecao, 'fatores_zero'> {
  const notas = emptyNotas()
  const justificativas = emptyJustificativas()
  const marcacoesRaw: MarcacaoInput[] = []

  for (const result of competencias) {
    if (!REDACAO_COMPETENCIAS.includes(result.competencia)) continue

    notas[result.competencia] = clampNota(result.nota)
    justificativas[result.competencia] =
      typeof result.justificativa === 'string' && result.justificativa.trim()
        ? result.justificativa.trim()
        : EMPTY_JUSTIFICATIVA

    for (const marcacao of result.marcacoes ?? []) {
      marcacoesRaw.push({
        ...marcacao,
        competencia: marcacao.competencia ?? result.competencia,
      })
    }
  }

  return {
    notas,
    justificativas,
    marcacoes_inline: normalizeMarcacoes(texto, marcacoesRaw),
    nota_total: sumNotas(notas),
  }
}

/** Monta correção zerada quando há fator de anulação. */
export function buildZeroCorrecao(
  texto: string,
  fatores_zero: FatoresZero,
  marcacoesExtra: MarcacaoInput[] = [],
): ValidatedCorrecao {
  return {
    notas: emptyNotas(),
    justificativas: emptyJustificativas(),
    marcacoes_inline: normalizeMarcacoes(texto, marcacoesExtra),
    fatores_zero,
    nota_total: 0,
  }
}

export type ValidateCorrectionParams = {
  texto: string
  linha_count: number
  competencias: CompetenciaCorrecaoInput[]
  fatores_zero?: FatoresZeroLlmInput | FatoresZero | null
  marcacoes_extra?: MarcacaoInput[]
}

/**
 * Valida e normaliza o JSON agregado do motor de correção.
 * `linha_count < 7` é determinístico (sem depender da LLM).
 */
export function validateCorrectionJson(params: ValidateCorrectionParams): ValidatedCorrecao {
  const { texto, linha_count, competencias, marcacoes_extra = [] } = params

  const linhaZero = checkLinhaCountZeroFactor(linha_count)
  const fatores_zero = mergeFatoresZero(linhaZero, params.fatores_zero)

  if (fatores_zero.detectado) {
    return buildZeroCorrecao(texto, fatores_zero, marcacoes_extra)
  }

  const aggregated = aggregateCorrecao(texto, competencias)

  return {
    ...aggregated,
    fatores_zero: normalizeFatoresZero({ detectado: false, motivos: [] }),
  }
}
