import type { Area, Exam, Question, Topico } from '../types/question'
import { isExamYearInCorpus } from './constants'

/** Base URL dos JSON estáticos do banco ENEM no Supabase Storage. */
export function resolveStaticStorageBaseUrl(supabaseUrl: string, _orgSlug?: string | null): string {
  const base = supabaseUrl.trim().replace(/\/+$/, '')
  if (!base) return ''
  return `${base}/storage/v1/object/public/static`
}

export type ExamQuestionMeta = {
  title: string
  index: number
  discipline: string
  language?: string | null
}

export type ExamDetails = {
  year: number
  questions: ExamQuestionMeta[]
}

const topicMappingCache = new Map<string, Record<string, string>>()
const examDetailsCache = new Map<string, ExamDetails>()

export async function loadTopicMapping(baseUrl: string): Promise<Record<string, string>> {
  if (topicMappingCache.has(baseUrl)) return topicMappingCache.get(baseUrl)!
  const res = await fetch(`${baseUrl}/data/question-topic-mapping.json`)
  if (!res.ok) return {}
  const data = (await res.json()) as { mapping?: Record<string, string> }
  const mapping = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {}
  topicMappingCache.set(baseUrl, mapping)
  return mapping
}

export async function loadExamDetails(baseUrl: string, year: number): Promise<ExamDetails | null> {
  const key = `${baseUrl}::${year}`
  if (examDetailsCache.has(key)) return examDetailsCache.get(key)!
  const res = await fetch(`${baseUrl}/${year}/details.json`)
  if (!res.ok) return null
  const data = (await res.json()) as ExamDetails
  if (!data || !Array.isArray(data.questions)) return null
  examDetailsCache.set(key, data)
  return data
}

export async function fetchAreas(baseUrl: string): Promise<Area[]> {
  const res = await fetch(`${baseUrl}/areas.json`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchExams(baseUrl: string): Promise<Exam[]> {
  const res = await fetch(`${baseUrl}/exams.json`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((e: { year?: number; title?: string }) => ({
      year: Number(e?.year),
      title: String(e?.title ?? ''),
    }))
    .filter((e: Exam) => isExamYearInCorpus(e.year))
}

export async function fetchTopics(baseUrl: string, areaValue: string): Promise<Topico[]> {
  const res = await fetch(`${baseUrl}/topics/${areaValue}.json`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchQuestionDetail(
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
        statement: q.alternativesIntroduction ?? null,
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
