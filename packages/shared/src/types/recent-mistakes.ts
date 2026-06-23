import type { MistakeType } from '../ai/student-model/mistake-classifier'

export interface RecentMistakeItem {
  questionId: string
  createdAt: string
  topicoValue: string | null
  mistakeType: MistakeType | null
}

export interface RecentMistakesResponse {
  mistakes: RecentMistakeItem[]
}
