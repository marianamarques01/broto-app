import type { Topico } from '../types/question'
import {
  MOCK_EXAM_AREA_LINGUAGENS,
  MOCK_EXAM_YEAR_MAX,
  MOCK_EXAM_YEAR_MIN,
} from '../mock-exam/constants'

export {
  MOCK_EXAM_YEAR_MIN as QUESTION_BANK_YEAR_MIN,
  MOCK_EXAM_YEAR_MAX as QUESTION_BANK_YEAR_MAX,
}
export { MOCK_EXAM_AREA_LINGUAGENS as LINGUAGENS_AREA_VALUE }

export const QUESTIONS_LIMIT = 10
export const IDIOMAS_QUESTIONS_LIMIT = 5
export const IDIOMAS_TOPIC_ID = '__idiomas'

export const LANGUAGE_OPTIONS = [
  { value: '', label: 'Todos os idiomas' },
  { value: 'ingles', label: 'Ingles' },
  { value: 'espanhol', label: 'Espanhol' },
] as const

export const IDIOMAS_TOPIC: Topico = {
  id: IDIOMAS_TOPIC_ID,
  value: 'idiomas',
  label: 'Idiomas',
}

export function isExamYearInCorpus(year: number): boolean {
  return year >= MOCK_EXAM_YEAR_MIN && year <= MOCK_EXAM_YEAR_MAX
}
