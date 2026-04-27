export interface QuestionBankRow {
  year: number
  index: number
  language: string | null
  title: string
  preview: string
  discipline: string
  topicoValue: string | null
  topicoLabel: string
  difficulty: 'facil' | 'medio' | 'dificil'
  isNova: boolean
}
