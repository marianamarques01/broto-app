/**
 * Classifica erros por tempo de resposta (`tempo_resposta` em segundos no DB).
 * Thresholds em ms — calibrar com percentis de produção (p90 slow, p25 fast).
 */
export const SLOW_THRESHOLD_MS = 45_000
export const FAST_THRESHOLD_MS = 8_000

export type MistakeType = 'stuck' | 'guessed' | 'normal'

export function classifyMistake(
  isCorrect: boolean,
  tempoRespostaSec: number | null | undefined,
): MistakeType | null {
  if (isCorrect) return null

  if (!tempoRespostaSec || tempoRespostaSec <= 0) return 'normal'

  const tempoMs = tempoRespostaSec * 1000
  if (tempoMs > SLOW_THRESHOLD_MS) return 'stuck'
  if (tempoMs < FAST_THRESHOLD_MS) return 'guessed'
  return 'normal'
}

export const MISTAKE_PRIORITY_MULTIPLIER: Record<MistakeType, number> = {
  stuck: 1.5,
  guessed: 0.8,
  normal: 1.0,
}
