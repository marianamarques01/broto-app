/**
 * Cópia espelhada de `packages/shared/src/ai/student-model/bkt.ts`.
 * Edge Functions Deno não importam `@broto/shared` no deploy — manter sincronizado.
 */

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
