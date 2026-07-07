import type { RedacaoCorrecao, RedacaoModo, RedacaoStatus } from '@broto/shared/types/redacao.ts'
import type { RedacaoCorrecoesRow, RedacoesRow } from '../../database.types.ts'

export function mapRedacaoRow(row: RedacoesRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    class_id: row.class_id,
    tema_id: row.tema_id,
    texto: row.texto,
    imagem_url: row.imagem_url,
    modo: row.modo as RedacaoModo,
    linha_count: row.linha_count,
    tempo_segundos: row.tempo_segundos,
    status: row.status as RedacaoStatus,
    created_at: row.created_at,
  }
}

export function mapCorrecaoRow(row: RedacaoCorrecoesRow): RedacaoCorrecao {
  return {
    id: row.id,
    redacao_id: row.redacao_id,
    nota_competencia_i: row.nota_competencia_i,
    nota_competencia_ii: row.nota_competencia_ii,
    nota_competencia_iii: row.nota_competencia_iii,
    nota_competencia_iv: row.nota_competencia_iv,
    nota_competencia_v: row.nota_competencia_v,
    nota_total: row.nota_total,
    justificativa_i: row.justificativa_i,
    justificativa_ii: row.justificativa_ii,
    justificativa_iii: row.justificativa_iii,
    justificativa_iv: row.justificativa_iv,
    justificativa_v: row.justificativa_v,
    marcacoes_inline: Array.isArray(row.marcacoes_inline)
      ? (row.marcacoes_inline as RedacaoCorrecao['marcacoes_inline'])
      : [],
    fatores_zero:
      row.fatores_zero && typeof row.fatores_zero === 'object'
        ? (row.fatores_zero as RedacaoCorrecao['fatores_zero'])
        : { detectado: false, motivos: [] },
    prompt_version: row.prompt_version,
    modelo_usado: row.modelo_usado,
    rag_chunks_used: row.rag_chunks_used,
    created_at: row.created_at,
  }
}
