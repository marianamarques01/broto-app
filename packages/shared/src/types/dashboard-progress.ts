export interface TopicoStat {
  value: string
  label: string
  totalAnswered: number
  totalCorrect: number
  accuracyPct: number
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
