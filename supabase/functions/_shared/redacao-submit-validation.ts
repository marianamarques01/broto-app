import { countLinhasRedacao } from '@broto/shared/redacao/count-linhas.ts'
import { isValidUuid } from './redacao-repertorio-validation.ts'

const REDACAO_MODOS = ['digitado', 'foto', 'cronometrado'] as const

type RedacaoModo = (typeof REDACAO_MODOS)[number]

export type RedacaoSubmitInput = {
  tema_id: string
  texto: string
  modo: RedacaoModo
  tempo_segundos: number | null
  redacao_id?: string
  class_id?: string | null
}

function isValidModo(value: unknown): value is RedacaoModo {
  return typeof value === 'string' && (REDACAO_MODOS as readonly string[]).includes(value)
}

export function parseRedacaoSubmitBody(
  raw: unknown,
): { ok: true; data: RedacaoSubmitInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Corpo inválido' }
  }

  const body = raw as Record<string, unknown>
  const tema_id = typeof body.tema_id === 'string' ? body.tema_id.trim() : ''
  if (!isValidUuid(tema_id)) {
    return { ok: false, error: 'tema_id deve ser UUID válido' }
  }

  if (typeof body.texto !== 'string') {
    return { ok: false, error: 'texto é obrigatório' }
  }
  const texto = body.texto
  if (!texto.trim()) {
    return { ok: false, error: 'texto não pode ser vazio' }
  }

  const modo = body.modo === undefined ? 'digitado' : body.modo
  if (!isValidModo(modo)) {
    return { ok: false, error: 'modo inválido' }
  }

  let tempo_segundos: number | null = null
  if (body.tempo_segundos !== undefined && body.tempo_segundos !== null) {
    if (typeof body.tempo_segundos !== 'number' || !Number.isFinite(body.tempo_segundos)) {
      return { ok: false, error: 'tempo_segundos inválido' }
    }
    tempo_segundos = Math.max(0, Math.floor(body.tempo_segundos))
  }

  let redacao_id: string | undefined
  if (body.redacao_id !== undefined && body.redacao_id !== null) {
    if (typeof body.redacao_id !== 'string' || !isValidUuid(body.redacao_id.trim())) {
      return { ok: false, error: 'redacao_id deve ser UUID válido' }
    }
    redacao_id = body.redacao_id.trim()
  }

  let class_id: string | null | undefined
  if (body.class_id !== undefined) {
    if (body.class_id === null) {
      class_id = null
    } else if (typeof body.class_id === 'string' && isValidUuid(body.class_id.trim())) {
      class_id = body.class_id.trim()
    } else {
      return { ok: false, error: 'class_id deve ser UUID válido ou null' }
    }
  }

  return {
    ok: true,
    data: {
      tema_id,
      texto,
      modo,
      tempo_segundos,
      redacao_id,
      class_id,
    },
  }
}

export function validateLinhaCountForSubmit(
  texto: string,
): { ok: true; linha_count: number } | { ok: false; error: string } {
  const linha_count = countLinhasRedacao(texto)
  if (linha_count < 7) {
    return { ok: false, error: 'A redação precisa ter pelo menos 7 linhas.' }
  }
  if (linha_count > 30) {
    return { ok: false, error: 'A redação não pode ultrapassar 30 linhas.' }
  }
  return { ok: true, linha_count }
}
