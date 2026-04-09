import type { Question } from '../types/question'
import { parseQuestionId } from './parse-question-id'

async function fetchOneDetail(
  baseUrl: string,
  year: number,
  index: number,
  language?: string | null,
): Promise<Question | null> {
  const paths = language
    ? [
        `${baseUrl}/${year}/questions/${index}-${language}/details.json`,
        `${baseUrl}/${year}/questions/${index}/details.json`,
      ]
    : [`${baseUrl}/${year}/questions/${index}/details.json`]

  for (const path of paths) {
    const res = await fetch(path)
    if (res.ok) {
      const q = await res.json()
      return {
        title: q.title,
        index: q.index,
        year: q.year ?? year,
        discipline: q.discipline ?? null,
        language: q.language ?? language ?? null,
        context: q.context ?? null,
        alternatives: (q.alternatives ?? []).map(
          (a: { letter: string; text?: string | null; isCorrect?: boolean }) => ({
            letter: a.letter,
            text: a.text ?? null,
            isCorrect: a.isCorrect ?? false,
          }),
        ),
      }
    }
  }
  return null
}

/** Hidrata questões completas para o player a partir dos IDs (storage público). */
export async function fetchMockExamQuestions(
  baseUrl: string,
  questionIds: string[],
): Promise<Question[]> {
  const out: Question[] = []
  for (const id of questionIds) {
    const parsed = parseQuestionId(id)
    if (!parsed) continue
    const q = await fetchOneDetail(baseUrl, parsed.year, parsed.index, parsed.language)
    if (q) out.push(q)
  }
  return out
}
