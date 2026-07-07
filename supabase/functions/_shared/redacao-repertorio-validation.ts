const REDACAO_EIXOS_TEMATICOS = [
  'educacao',
  'saude',
  'meio_ambiente',
  'tecnologia',
  'trabalho',
  'direitos_humanos',
  'cultura',
] as const

type RedacaoEixoTematico = (typeof REDACAO_EIXOS_TEMATICOS)[number]

const REDACAO_COMPETENCIAS = ['I', 'II', 'III', 'IV', 'V'] as const

type RedacaoCompetencia = (typeof REDACAO_COMPETENCIAS)[number]

const REDACAO_REPERTORIO_TIPOS = [
  'dica',
  'repertorio',
  'modelo_estrutura',
  'conectivos',
  'proposta_intervencao',
] as const

type RedacaoRepertorioTipo = (typeof REDACAO_REPERTORIO_TIPOS)[number]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function parseOptionalUuid(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return isValidUuid(value) ? value : undefined
}

export function isValidRepertorioTipo(value: unknown): value is RedacaoRepertorioTipo {
  return (
    typeof value === 'string' && (REDACAO_REPERTORIO_TIPOS as readonly string[]).includes(value)
  )
}

export function isValidEixoTematico(value: unknown): value is RedacaoEixoTematico {
  return typeof value === 'string' && (REDACAO_EIXOS_TEMATICOS as readonly string[]).includes(value)
}

export function isValidCompetencia(value: unknown): value is RedacaoCompetencia {
  return typeof value === 'string' && (REDACAO_COMPETENCIAS as readonly string[]).includes(value)
}

export function parseOptionalEixo(value: unknown): RedacaoEixoTematico | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return isValidEixoTematico(value) ? value : undefined
}

export function parseOptionalCompetencia(value: unknown): RedacaoCompetencia | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return isValidCompetencia(value) ? value : undefined
}

export function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return undefined
  const tags = value.filter((t): t is string => typeof t === 'string').map((t) => t.trim())
  return tags.filter(Boolean)
}

export type RepertorioCreateInput = {
  tipo: RedacaoRepertorioTipo
  titulo: string
  conteudo: string
  class_id?: string | null
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
}

export type RepertorioUpdateInput = {
  id: string
  tipo?: RedacaoRepertorioTipo
  titulo?: string
  conteudo?: string
  class_id?: string | null
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
  tags?: string[]
  ativo?: boolean
}

export function validateCreateInput(
  body: Record<string, unknown>,
): { ok: true; data: RepertorioCreateInput } | { ok: false; error: string } {
  if (!isValidRepertorioTipo(body.tipo)) {
    return { ok: false, error: 'tipo inválido' }
  }
  if (typeof body.titulo !== 'string' || !body.titulo.trim()) {
    return { ok: false, error: 'titulo é obrigatório' }
  }
  if (typeof body.conteudo !== 'string' || !body.conteudo.trim()) {
    return { ok: false, error: 'conteudo é obrigatório' }
  }

  const classId = parseOptionalUuid(body.class_id)
  if (body.class_id !== undefined && body.class_id !== null && classId === undefined) {
    return { ok: false, error: 'class_id deve ser UUID válido ou null' }
  }

  const eixo = parseOptionalEixo(body.eixo_tematico)
  if (body.eixo_tematico !== undefined && body.eixo_tematico !== null && eixo === undefined) {
    return { ok: false, error: 'eixo_tematico inválido' }
  }

  const competencia = parseOptionalCompetencia(body.competencia_alvo)
  if (
    body.competencia_alvo !== undefined &&
    body.competencia_alvo !== null &&
    competencia === undefined
  ) {
    return { ok: false, error: 'competencia_alvo inválida' }
  }

  const tags = parseTags(body.tags)
  if (body.tags !== undefined && tags === undefined) {
    return { ok: false, error: 'tags deve ser array de strings' }
  }

  return {
    ok: true,
    data: {
      tipo: body.tipo,
      titulo: body.titulo.trim(),
      conteudo: body.conteudo.trim(),
      class_id: classId,
      eixo_tematico: eixo,
      competencia_alvo: competencia,
      tags,
    },
  }
}

export function validateUpdateInput(
  body: Record<string, unknown>,
): { ok: true; data: RepertorioUpdateInput } | { ok: false; error: string } {
  if (!isValidUuid(body.id)) {
    return { ok: false, error: 'id deve ser UUID válido' }
  }

  if (body.tipo !== undefined && !isValidRepertorioTipo(body.tipo)) {
    return { ok: false, error: 'tipo inválido' }
  }
  if (body.titulo !== undefined) {
    if (typeof body.titulo !== 'string' || !body.titulo.trim()) {
      return { ok: false, error: 'titulo não pode ser vazio' }
    }
  }
  if (body.conteudo !== undefined) {
    if (typeof body.conteudo !== 'string' || !body.conteudo.trim()) {
      return { ok: false, error: 'conteudo não pode ser vazio' }
    }
  }

  const classId = parseOptionalUuid(body.class_id)
  if (body.class_id !== undefined && body.class_id !== null && classId === undefined) {
    return { ok: false, error: 'class_id deve ser UUID válido ou null' }
  }

  const eixo = parseOptionalEixo(body.eixo_tematico)
  if (body.eixo_tematico !== undefined && body.eixo_tematico !== null && eixo === undefined) {
    return { ok: false, error: 'eixo_tematico inválido' }
  }

  const competencia = parseOptionalCompetencia(body.competencia_alvo)
  if (
    body.competencia_alvo !== undefined &&
    body.competencia_alvo !== null &&
    competencia === undefined
  ) {
    return { ok: false, error: 'competencia_alvo inválida' }
  }

  const tags = parseTags(body.tags)
  if (body.tags !== undefined && tags === undefined) {
    return { ok: false, error: 'tags deve ser array de strings' }
  }

  if (body.ativo !== undefined && typeof body.ativo !== 'boolean') {
    return { ok: false, error: 'ativo deve ser boolean' }
  }

  const hasField =
    body.tipo !== undefined ||
    body.titulo !== undefined ||
    body.conteudo !== undefined ||
    body.class_id !== undefined ||
    body.eixo_tematico !== undefined ||
    body.competencia_alvo !== undefined ||
    body.tags !== undefined ||
    body.ativo !== undefined

  if (!hasField) {
    return { ok: false, error: 'Nenhum campo para atualizar' }
  }

  return {
    ok: true,
    data: {
      id: body.id,
      tipo: body.tipo as RedacaoRepertorioTipo | undefined,
      titulo: typeof body.titulo === 'string' ? body.titulo.trim() : undefined,
      conteudo: typeof body.conteudo === 'string' ? body.conteudo.trim() : undefined,
      class_id: classId,
      eixo_tematico: eixo,
      competencia_alvo: competencia,
      tags,
      ativo: typeof body.ativo === 'boolean' ? body.ativo : undefined,
    },
  }
}
