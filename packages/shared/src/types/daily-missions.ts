import type { EnemAreaKey } from '../enem-area-key'

export type AreaKey = EnemAreaKey | string

export interface StudyTodayAreaCount {
  answered: number
  correct: number
}

export type StudyTodayByArea = Record<string, StudyTodayAreaCount>

export interface DailyMissionsState {
  date: string
  byArea: Record<AreaKey, StudyTodayAreaCount>
}
