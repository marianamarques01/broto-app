/**
 * Bayesian Knowledge Tracing (BKT) — modelo de domínio por tópico.
 *
 * Estado latente: P(Know) ∈ [0, 1] = probabilidade de o aluno dominar o tópico.
 * Parâmetros clássicos (Corbett & Anderson):
 * - pLearn: P(aprender | ainda não sabe) após uma oportunidade de prática
 * - pGuess: P(acertar | não sabe)
 * - pSlip: P(errar | sabe)
 *
 * Fluxo por resposta:
 * 1. Atualização bayesiana com a observação (acerto/erro)
 * 2. Transição de aprendizagem (chance de passar de “não sabe” → “sabe”)
 *
 * @see packages/shared/src/ai/student-model/README.md
 * @see supabase/functions/_shared/bkt.ts (cópia espelhada para Deno deploy)
 */

/** Prior inicial para tópicos sem histórico (`topic_performance.p_know` default). */
export const BKT_DEFAULT_P_KNOW = 0.3

export type BktParams = {
  pLearn?: number
  pGuess?: number
  pSlip?: number
}

export const BKT_DEFAULT_PARAMS: Required<BktParams> = {
  pLearn: 0.1,
  pGuess: 0.2,
  pSlip: 0.1,
}

function clamp01(value: number): number {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

/**
 * Atualiza P(Know) após uma resposta observada.
 *
 * @param pKnowPrior - probabilidade anterior (0–1)
 * @param isCorrect - se a resposta foi correta
 * @param params - parâmetros BKT opcionais (defaults: pLearn=0.1, pGuess=0.2, pSlip=0.1)
 * @returns nova P(Know) clampada em [0, 1]
 */
export function updatePKnow(pKnowPrior: number, isCorrect: boolean, params?: BktParams): number {
  const { pLearn, pGuess, pSlip } = { ...BKT_DEFAULT_PARAMS, ...params }
  const prior = clamp01(pKnowPrior)

  let pKnowGivenObs: number
  if (isCorrect) {
    const pCorrect = prior * (1 - pSlip) + (1 - prior) * pGuess
    pKnowGivenObs = pCorrect > 0 ? (prior * (1 - pSlip)) / pCorrect : prior
  } else {
    const pIncorrect = prior * pSlip + (1 - prior) * (1 - pGuess)
    pKnowGivenObs = pIncorrect > 0 ? (prior * pSlip) / pIncorrect : prior
  }

  const afterLearn = pKnowGivenObs + (1 - pKnowGivenObs) * pLearn
  return clamp01(afterLearn)
}
