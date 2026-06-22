export interface StudyTodayAreaCount {
  answered: number
  correct: number
}

export type StudyTodayByArea = Record<string, StudyTodayAreaCount>
