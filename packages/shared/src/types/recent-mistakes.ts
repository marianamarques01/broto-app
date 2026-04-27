export interface RecentMistakeItem {
  questionId: string
  createdAt: string
  topicoValue: string | null
}

export interface RecentMistakesResponse {
  mistakes: RecentMistakeItem[]
}
