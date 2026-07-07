/** Domínio redação ENEM — tipos platform-agnostic (REDA-01). */

export const REDACAO_EIXOS_TEMATICOS = [
  'educacao',
  'saude',
  'meio_ambiente',
  'tecnologia',
  'trabalho',
  'direitos_humanos',
  'cultura',
] as const

export type RedacaoEixoTematico = (typeof REDACAO_EIXOS_TEMATICOS)[number]

export const REDACAO_DIFICULDADES = ['facil', 'medio', 'dificil'] as const

export type RedacaoDificuldade = (typeof REDACAO_DIFICULDADES)[number]

export const REDACAO_COMPETENCIAS = ['I', 'II', 'III', 'IV', 'V'] as const

export type RedacaoCompetencia = (typeof REDACAO_COMPETENCIAS)[number]

export const REDACAO_MODOS = ['digitado', 'foto', 'cronometrado'] as const

export type RedacaoModo = (typeof REDACAO_MODOS)[number]

export const REDACAO_STATUS = ['rascunho', 'enviada', 'corrigindo', 'corrigida', 'erro'] as const

export type RedacaoStatus = (typeof REDACAO_STATUS)[number]

export const REDACAO_REPERTORIO_TIPOS = [
  'dica',
  'repertorio',
  'modelo_estrutura',
  'conectivos',
  'proposta_intervencao',
] as const

export type RedacaoRepertorioTipo = (typeof REDACAO_REPERTORIO_TIPOS)[number]

export const REDACAO_FATORES_ZERO = [
  'fuga_tema',
  'texto_curto',
  'copia_motivadores',
  'lingua_estrangeira',
  'identificacao_candidato',
  'nao_dissertativo',
] as const

export type RedacaoFatorZero = (typeof REDACAO_FATORES_ZERO)[number]

export type TextoMotivador = {
  ordem: number
  titulo?: string
  conteudo: string
}

export type MarcacaoInline = {
  start_offset: number
  end_offset: number
  trecho: string
  tipo_problema: string
  comentario: string
  competencia: RedacaoCompetencia
}

export type FatoresZero = {
  detectado: boolean
  motivos: RedacaoFatorZero[]
  detalhes?: string
}

export type RedacaoTema = {
  id: string
  organization_id: string | null
  titulo: string
  textos_motivadores: TextoMotivador[]
  eixo_tematico: RedacaoEixoTematico
  dificuldade: RedacaoDificuldade
  ano_referencia: number | null
  ativo: boolean
  created_by: string | null
  created_at: string
}

export type Redacao = {
  id: string
  user_id: string
  organization_id: string
  class_id: string | null
  tema_id: string
  texto: string
  imagem_url: string | null
  modo: RedacaoModo
  linha_count: number
  tempo_segundos: number | null
  status: RedacaoStatus
  created_at: string
}

export type RedacaoCorrecao = {
  id: string
  redacao_id: string
  nota_competencia_i: number
  nota_competencia_ii: number
  nota_competencia_iii: number
  nota_competencia_iv: number
  nota_competencia_v: number
  nota_total: number
  justificativa_i: string
  justificativa_ii: string
  justificativa_iii: string
  justificativa_iv: string
  justificativa_v: string
  marcacoes_inline: MarcacaoInline[]
  fatores_zero: FatoresZero
  prompt_version: string
  modelo_usado: string
  rag_chunks_used: unknown | null
  created_at: string
}

export type RedacaoRevisaoHumana = {
  id: string
  correcao_id: string
  revisor_id: string
  nota_humana_i: number | null
  nota_humana_ii: number | null
  nota_humana_iii: number | null
  nota_humana_iv: number | null
  nota_humana_v: number | null
  notas_ia_reveladas_em: string | null
  comentario: string | null
  created_at: string
}

export type RedacaoRepertorio = {
  id: string
  organization_id: string
  class_id: string | null
  tipo: RedacaoRepertorioTipo
  titulo: string
  conteudo: string
  eixo_tematico: RedacaoEixoTematico | null
  competencia_alvo: RedacaoCompetencia | null
  tags: string[]
  ativo: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type RedacaoCompetenceSnapshot = {
  id: string
  user_id: string
  competencia: RedacaoCompetencia
  nota: number
  redacao_id: string
  created_at: string
}

/** Notas válidas por competência ENEM (múltiplos de 40). */
export const REDACAO_NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200] as const

export type RedacaoNotaCompetencia = (typeof REDACAO_NOTAS_VALIDAS)[number]
