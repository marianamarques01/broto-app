import type { RedacaoRepertoriosRow } from '../../database.types.ts'

export type MappedRepertorio = {
  id: string
  organization_id: string
  class_id: string | null
  tipo: string
  titulo: string
  conteudo: string
  eixo_tematico: string | null
  competencia_alvo: string | null
  tags: string[]
  ativo: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function mapRepertorioRow(row: RedacaoRepertoriosRow): MappedRepertorio {
  return {
    id: row.id,
    organization_id: row.organization_id,
    class_id: row.class_id,
    tipo: row.tipo,
    titulo: row.titulo,
    conteudo: row.conteudo,
    eixo_tematico: row.eixo_tematico,
    competencia_alvo: row.competencia_alvo,
    tags: row.tags ?? [],
    ativo: row.ativo,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
