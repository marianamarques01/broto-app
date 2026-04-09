export interface PetData {
  nivel: number
  xp: number
  xpNextLevel: number
  fase: 'semente' | 'muda' | 'planta' | 'flor' | 'especial'
  humor: number
  streak: number
  questoesHoje: number
  acertosHoje: number
  /** Soma dos `tempo_resposta` (segundos) das respostas de hoje (UTC), quando o backend envia. */
  tempoEstudoSegHoje?: number
  /** Contagens do dia (UTC) por área derivadas do banco — alinha missões ao servidor. */
  studyTodayByArea?: Record<string, { answered: number; correct: number }>
}

export const FASE_EMOJI: Record<PetData['fase'], string> = {
  semente: '\u{1F331}',
  muda: '\u{1F33F}',
  planta: '\u{1FAB4}',
  flor: '\u{1F338}',
  especial: '\u{1F333}',
}

export const FASE_LABEL: Record<PetData['fase'], string> = {
  semente: 'Semente',
  muda: 'Muda',
  planta: 'Planta',
  flor: 'Florindo',
  especial: 'Especial',
}
