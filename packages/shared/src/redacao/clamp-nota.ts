import { REDACAO_NOTAS_VALIDAS, type RedacaoNotaCompetencia } from '../types/redacao.ts'

/** Verifica se o valor é uma nota ENEM válida (0–200, múltiplo de 40). */
export function isValidNota(value: number): value is RedacaoNotaCompetencia {
  return (REDACAO_NOTAS_VALIDAS as readonly number[]).includes(value)
}

/** Arredonda para o múltiplo de 40 mais próximo e limita ao intervalo 0–200. */
export function clampNota(value: number): RedacaoNotaCompetencia {
  if (!Number.isFinite(value)) return 0

  const bounded = Math.max(0, Math.min(200, value))
  const snapped = Math.round(bounded / 40) * 40
  return snapped as RedacaoNotaCompetencia
}
