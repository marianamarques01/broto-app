export type AreaKey =
  | 'matematica'
  | 'linguagens'
  | 'ciencias-humanas'
  | 'ciencias-natureza'
  | string

export interface DailyMissionsState {
  date: string
  byArea: Record<AreaKey, { answered: number; correct: number }>
}
