import { REDACAO_EIXOS_TEMATICOS, type RedacaoEixoTematico } from '../types/redacao'

export const REDACAO_EIXO_LABELS: Record<RedacaoEixoTematico, string> = {
  educacao: 'Educação',
  saude: 'Saúde',
  meio_ambiente: 'Meio ambiente',
  tecnologia: 'Tecnologia',
  trabalho: 'Trabalho',
  direitos_humanos: 'Direitos humanos',
  cultura: 'Cultura',
}

/** Cores de destaque por eixo (alinhadas ao design system web). */
export const REDACAO_EIXO_COLORS: Record<RedacaoEixoTematico, string> = {
  educacao: '#2dd4a8',
  saude: '#fb7e6a',
  meio_ambiente: '#5eead4',
  tecnologia: '#60a5fa',
  trabalho: '#f5c842',
  direitos_humanos: '#a78bfa',
  cultura: '#f472b6',
}

export const REDACAO_DIFICULDADE_LABELS: Record<'facil' | 'medio' | 'dificil', string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

export function isRedacaoEixoTematico(value: string): value is RedacaoEixoTematico {
  return (REDACAO_EIXOS_TEMATICOS as readonly string[]).includes(value)
}
