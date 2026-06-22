export interface FlashcardDueItem {
  card_id: string
  topic_key: string
  area_key: string
  due: string
  state: number
  reps: number
  scheduled_days: number
}

// Rating simplificado para o aluno (3 opções vs 4 do FSRS)
export const FLASHCARD_RATING = {
  AGAIN: 1, // Não lembrei
  GOOD: 3, // Lembrei com esforço
  EASY: 4, // Fácil
} as const
