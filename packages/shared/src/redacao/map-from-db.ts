import type {
  RedacaoCompetencia,
  RedacaoDificuldade,
  RedacaoEixoTematico,
  RedacaoModo,
  RedacaoRepertorio,
  RedacaoRepertorioTipo,
  RedacaoStatus,
  RedacaoTema,
  TextoMotivador,
} from '../types/redacao'

function parseMotivadores(raw: unknown): TextoMotivador[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item, index) => ({
      ordem: typeof item.ordem === 'number' ? item.ordem : index + 1,
      titulo: typeof item.titulo === 'string' ? item.titulo : undefined,
      conteudo: typeof item.conteudo === 'string' ? item.conteudo : '',
    }))
    .filter((m) => m.conteudo.length > 0)
}

export type RedacaoTemaRowLike = {
  id: string
  organization_id: string | null
  titulo: string
  textos_motivadores: unknown
  eixo_tematico: string
  dificuldade: string
  ano_referencia: number | null
  ativo: boolean
  created_by: string | null
  created_at: string
}

export type RedacaoRepertorioRowLike = {
  id: string
  organization_id: string
  class_id: string | null
  tipo: string
  titulo: string
  conteudo: string
  eixo_tematico: string | null
  competencia_alvo: string | null
  tags: string[] | null
  ativo: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function mapRedacaoTemaRow(row: RedacaoTemaRowLike): RedacaoTema {
  return {
    id: row.id,
    organization_id: row.organization_id,
    titulo: row.titulo,
    textos_motivadores: parseMotivadores(row.textos_motivadores),
    eixo_tematico: row.eixo_tematico as RedacaoEixoTematico,
    dificuldade: row.dificuldade as RedacaoDificuldade,
    ano_referencia: row.ano_referencia,
    ativo: row.ativo,
    created_by: row.created_by,
    created_at: row.created_at,
  }
}

export function mapRedacaoRepertorioRow(row: RedacaoRepertorioRowLike): RedacaoRepertorio {
  return {
    id: row.id,
    organization_id: row.organization_id,
    class_id: row.class_id,
    tipo: row.tipo as RedacaoRepertorioTipo,
    titulo: row.titulo,
    conteudo: row.conteudo,
    eixo_tematico: row.eixo_tematico as RedacaoEixoTematico | null,
    competencia_alvo: row.competencia_alvo as RedacaoCompetencia | null,
    tags: row.tags ?? [],
    ativo: row.ativo,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/** Tipos auxiliares para rascunhos lidos direto do PostgREST. */
export type RedacaoDraftRowLike = {
  id: string
  texto: string
  linha_count: number
  tempo_segundos: number | null
  modo: string
  status: string
}

export function mapRedacaoDraftRow(row: RedacaoDraftRowLike): {
  id: string
  texto: string
  linha_count: number
  tempo_segundos: number | null
  modo: RedacaoModo
  status: RedacaoStatus
} {
  return {
    id: row.id,
    texto: row.texto,
    linha_count: row.linha_count,
    tempo_segundos: row.tempo_segundos,
    modo: row.modo as RedacaoModo,
    status: row.status as RedacaoStatus,
  }
}
