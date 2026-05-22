export interface Area {
  id: string
  value: string
  label: string
  disciplinas?: Array<{ id: string; value: string; label: string }>
}

export interface Topico {
  id: string
  value: string
  label: string
  disciplina?: { id: string; value: string; label: string }
}

export interface Exam {
  year: number
  title: string
}

export interface Question {
  title: string
  statement: string | null
  index: number
  year: number
  discipline: string | null
  language?: string | null
  context: string | null
  alternatives: Array<{
    letter: string
    text: string | null
    isCorrect: boolean
  }>
}

export function getQuestionId(q: Pick<Question, 'year' | 'index' | 'language'>): string {
  return q.language ? `${q.year}-${q.index}-${q.language}` : `${q.year}-${q.index}`
}

export interface QuestionsResponse {
  questions: Question[]
  metadata: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}
