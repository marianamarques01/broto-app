export interface TopicoStat {
  value: string
  label: string
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  /** P(Know) BKT (0–1), opcional até backfill / respostas com migration aplicada. */
  pKnow?: number
}

export interface AreaStat {
  value: string
  label: string
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  topicos: TopicoStat[]
}

export interface ProgressData {
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
  areas: AreaStat[]
}
