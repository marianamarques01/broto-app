export type PerformancePeriod = 'week' | 'month' | 'all'

export interface PerformanceBucket {
  key: string
  label: string
  answered: number
  correct: number
  /** null quando não houve questões no bucket */
  accuracyPct: number | null
}

export interface PerformanceSeriesResponse {
  period: PerformancePeriod
  buckets: PerformanceBucket[]
}
