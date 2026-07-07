import { isValidNotaCompetencia } from '@broto/shared/redacao/calibracao.ts'
import type { RedacaoNotaCompetencia } from '@broto/shared/types/redacao.ts'
import { isValidUuid } from './redacao-repertorio-validation.ts'

export type RedacaoCalibracaoSubmitInput = {
  correcao_id: string
  nota_humana_i: RedacaoNotaCompetencia
  nota_humana_ii: RedacaoNotaCompetencia
  nota_humana_iii: RedacaoNotaCompetencia
  nota_humana_iv: RedacaoNotaCompetencia
  nota_humana_v: RedacaoNotaCompetencia
  comentario?: string | null
}

export function parseRedacaoCalibracaoSubmitBody(
  body: unknown,
): { ok: true; data: RedacaoCalibracaoSubmitInput } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Corpo JSON inválido' }
  }

  const raw = body as Record<string, unknown>
  const correcao_id = typeof raw.correcao_id === 'string' ? raw.correcao_id.trim() : ''
  if (!isValidUuid(correcao_id)) {
    return { ok: false, message: 'correcao_id deve ser UUID válido' }
  }

  const notas = {
    nota_humana_i: raw.nota_humana_i,
    nota_humana_ii: raw.nota_humana_ii,
    nota_humana_iii: raw.nota_humana_iii,
    nota_humana_iv: raw.nota_humana_iv,
    nota_humana_v: raw.nota_humana_v,
  }

  for (const [field, value] of Object.entries(notas)) {
    if (!isValidNotaCompetencia(value)) {
      return { ok: false, message: `${field} deve ser 0, 40, 80, 120, 160 ou 200` }
    }
  }

  const comentario =
    raw.comentario === undefined || raw.comentario === null
      ? null
      : typeof raw.comentario === 'string'
        ? raw.comentario.trim().slice(0, 4000)
        : null

  if (raw.comentario !== undefined && raw.comentario !== null && comentario === null) {
    return { ok: false, message: 'comentario deve ser string' }
  }

  return {
    ok: true,
    data: {
      correcao_id,
      nota_humana_i: notas.nota_humana_i,
      nota_humana_ii: notas.nota_humana_ii,
      nota_humana_iii: notas.nota_humana_iii,
      nota_humana_iv: notas.nota_humana_iv,
      nota_humana_v: notas.nota_humana_v,
      comentario,
    } as RedacaoCalibracaoSubmitInput,
  }
}

export function parseCalibracaoListLimit(value: string | null | undefined): number {
  const parsed = Number.parseInt(value ?? '50', 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 50
  return Math.min(parsed, 100)
}
