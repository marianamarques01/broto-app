import {
  REDACAO_COMPETENCIAS,
  REDACAO_FATORES_ZERO,
  type RedacaoCompetencia,
  type RedacaoCorrecao,
  type RedacaoFatorZero,
  type RedacaoTema,
} from '../types/redacao.ts'

export const REDACAO_COMPETENCIA_TITLES: Record<RedacaoCompetencia, string> = {
  I: 'Domínio da modalidade escrita formal da língua portuguesa',
  II: 'Compreensão da proposta e estrutura dissertativo-argumentativa',
  III: 'Seleção, organização e interpretação de informações e argumentos',
  IV: 'Mecanismos linguísticos de coesão e articulação textual',
  V: 'Proposta de intervenção respeitando direitos humanos',
}

export const REDACAO_COMPETENCIA_SHORT: Record<RedacaoCompetencia, string> = {
  I: 'Norma culta',
  II: 'Tema e repertório',
  III: 'Argumentação',
  IV: 'Coesão',
  V: 'Proposta de intervenção',
}

export const REDACAO_COMPETENCIA_COLORS: Record<RedacaoCompetencia, string> = {
  I: '#3ecf8e',
  II: '#5b9cf6',
  III: '#a78bfa',
  IV: '#f5b942',
  V: '#fb7e6a',
}

export const REDACAO_FATOR_ZERO_LABELS: Record<RedacaoFatorZero, string> = {
  fuga_tema: 'Fuga ao tema',
  texto_curto: 'Texto muito curto (menos de 7 linhas)',
  copia_motivadores: 'Cópia dos textos motivadores',
  lingua_estrangeira: 'Uso predominante de língua estrangeira',
  identificacao_candidato: 'Identificação do candidato no texto',
  nao_dissertativo: 'Não atende à estrutura dissertativo-argumentativa',
}

const NOTA_FIELD: Record<RedacaoCompetencia, keyof RedacaoCorrecao> = {
  I: 'nota_competencia_i',
  II: 'nota_competencia_ii',
  III: 'nota_competencia_iii',
  IV: 'nota_competencia_iv',
  V: 'nota_competencia_v',
}

const JUSTIFICATIVA_FIELD: Record<RedacaoCompetencia, keyof RedacaoCorrecao> = {
  I: 'justificativa_i',
  II: 'justificativa_ii',
  III: 'justificativa_iii',
  IV: 'justificativa_iv',
  V: 'justificativa_v',
}

export function getNotaCompetencia(
  correcao: RedacaoCorrecao,
  competencia: RedacaoCompetencia,
): number {
  return correcao[NOTA_FIELD[competencia]] as number
}

export function getJustificativaCompetencia(
  correcao: RedacaoCorrecao,
  competencia: RedacaoCompetencia,
): string {
  const value = correcao[JUSTIFICATIVA_FIELD[competencia]]
  return typeof value === 'string' ? value : ''
}

/** Competência com menor nota; empate → ordem I…V. */
export function findWeakestCompetencia(correcao: RedacaoCorrecao): RedacaoCompetencia {
  let weakest: RedacaoCompetencia = 'I'
  let minNota = getNotaCompetencia(correcao, 'I')

  for (const competencia of REDACAO_COMPETENCIAS) {
    const nota = getNotaCompetencia(correcao, competencia)
    if (nota < minNota) {
      minNota = nota
      weakest = competencia
    }
  }

  return weakest
}

/** Escolhe outro tema para praticar a competência fraca (mesmo eixo, exclui o atual). */
export function pickTemaParaPratica(
  temas: RedacaoTema[],
  currentTemaId: string,
  eixoTematico: RedacaoTema['eixo_tematico'],
): RedacaoTema | null {
  const sameEixo = temas.filter((t) => t.id !== currentTemaId && t.eixo_tematico === eixoTematico)
  if (sameEixo.length > 0) {
    return sameEixo[Math.floor(Math.random() * sameEixo.length)] ?? null
  }

  const others = temas.filter((t) => t.id !== currentTemaId)
  if (others.length === 0) return null
  return others[Math.floor(Math.random() * others.length)] ?? null
}

export function formatFatorZeroMotivos(motivos: RedacaoFatorZero[]): string {
  return motivos
    .filter((m) => (REDACAO_FATORES_ZERO as readonly string[]).includes(m))
    .map((m) => REDACAO_FATOR_ZERO_LABELS[m])
    .join(' · ')
}
