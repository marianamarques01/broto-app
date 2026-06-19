import type { Question } from '../types/question'
import { fetchQuestionDetail } from '../question-bank/static-storage'
import { parseQuestionId } from './parse-question-id'

/** Hidrata questões completas para o player a partir dos IDs (storage público). */
export async function fetchMockExamQuestions(
  baseUrl: string,
  questionIds: string[],
): Promise<Question[]> {
  const out: Question[] = []
  for (const id of questionIds) {
    const parsed = parseQuestionId(id)
    if (!parsed) continue
    const q = await fetchQuestionDetail(baseUrl, parsed.year, parsed.index, parsed.language)
    if (q) out.push(q)
  }
  return out
}
