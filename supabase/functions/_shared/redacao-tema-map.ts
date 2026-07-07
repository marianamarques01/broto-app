import type { RedacaoTemasRow } from '../../database.types.ts'

export type TextoMotivadorMapped = {
  ordem: number
  titulo?: string
  conteudo: string
}

export type MappedTema = {
  id: string
  organization_id: string | null
  titulo: string
  textos_motivadores: TextoMotivadorMapped[]
  eixo_tematico: string
  dificuldade: string
  ano_referencia: number | null
  ativo: boolean
  created_by: string | null
  created_at: string
}

function parseMotivadores(raw: unknown): TextoMotivadorMapped[] {
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

export function mapTemaRow(row: RedacaoTemasRow): MappedTema {
  return {
    id: row.id,
    organization_id: row.organization_id,
    titulo: row.titulo,
    textos_motivadores: parseMotivadores(row.textos_motivadores),
    eixo_tematico: row.eixo_tematico,
    dificuldade: row.dificuldade,
    ano_referencia: row.ano_referencia,
    ativo: row.ativo,
    created_by: row.created_by,
    created_at: row.created_at,
  }
}
