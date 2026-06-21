/**
 * Labels de `topico_value` — manter sincronizado com
 * `packages/shared/src/lib/topico-to-area.ts` (áreas) e `user-progress-aggregate-from-answers.ts`.
 */
import { AREA_ROLLUP_PREFIX } from './enem-topic-area.ts'

export const TOPICO_LABELS: Record<string, string> = {
  'interpretacao-textual': 'Interpretação Textual',
  'interpretacao-texto': 'Interpretação Textual',
  literatura: 'Literatura Brasileira',
  gramatica: 'Gramática e Norma Culta',
  'generos-textuais': 'Gêneros Textuais',
  'variacoes-linguisticas': 'Variações Linguísticas',
  'historia-brasil': 'História do Brasil',
  'geografia-politica': 'Geografia Política',
  filosofia: 'Filosofia',
  sociologia: 'Sociologia',
  'geografia-fisica': 'Geografia Física',
  genetica: 'Genética',
  ecologia: 'Ecologia',
  'quimica-organica': 'Química Orgânica',
  termodinamica: 'Termodinâmica',
  citologia: 'Citologia',
  funcoes: 'Funções',
  'geometria-plana': 'Geometria Plana',
  probabilidade: 'Probabilidade e Estatística',
  porcentagem: 'Porcentagem e Razão',
  combinatoria: 'Análise Combinatória',
  [`${AREA_ROLLUP_PREFIX}linguagens`]: 'Prática registrada nesta área',
  [`${AREA_ROLLUP_PREFIX}ciencias-humanas`]: 'Prática registrada nesta área',
  [`${AREA_ROLLUP_PREFIX}ciencias-natureza`]: 'Prática registrada nesta área',
  [`${AREA_ROLLUP_PREFIX}matematica`]: 'Prática registrada nesta área',
  __broto_sem_classificacao__: 'Respostas ainda não classificadas pelo catálogo',
}
