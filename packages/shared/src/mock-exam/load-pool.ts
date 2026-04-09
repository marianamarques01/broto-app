import { getQuestionId } from '../types/question'
import {
  MOCK_EXAM_AREA_LINGUAGENS,
  MOCK_EXAM_YEAR_MAX,
  MOCK_EXAM_YEAR_MIN,
} from './constants'
import type { MockExamPoolEntry } from './types'

const topicMappingCache = new Map<string, Record<string, string>>()

async function loadTopicMapping(baseUrl: string): Promise<Record<string, string>> {
  if (topicMappingCache.has(baseUrl)) return topicMappingCache.get(baseUrl)!
  const res = await fetch(`${baseUrl}/data/question-topic-mapping.json`)
  if (!res.ok) return {}
  const data = (await res.json()) as { mapping?: Record<string, string> }
  const mapping = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {}
  topicMappingCache.set(baseUrl, mapping)
  return mapping
}

const examDetailsCache = new Map<
  string,
  {
    year: number
    questions: Array<{ title: string; index: number; discipline: string; language?: string | null }>
  }
>()

async function loadExamDetails(baseUrl: string, year: number) {
  const key = `${baseUrl}::${year}`
  if (examDetailsCache.has(key)) return examDetailsCache.get(key)!
  const res = await fetch(`${baseUrl}/${year}/details.json`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data || !Array.isArray(data.questions)) return null
  examDetailsCache.set(key, data)
  return data
}

async function fetchExamsYears(baseUrl: string): Promise<number[]> {
  const res = await fetch(`${baseUrl}/exams.json`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((e: { year?: number }) => Number(e?.year))
    .filter(
      (y: number) =>
        Number.isFinite(y) && y >= MOCK_EXAM_YEAR_MIN && y <= MOCK_EXAM_YEAR_MAX,
    )
}

export interface LoadMockExamPoolParams {
  baseUrl: string
  randomMode: boolean
  areaValues: string[]
  topicoValues: string[]
  years: number[]
  language: string
  expandLinguagensIdiomas: boolean
}

function yearsToSearch(allYears: number[], filterYears: number[]): number[] {
  const set = filterYears.length
    ? new Set(filterYears.filter((y) => y >= MOCK_EXAM_YEAR_MIN && y <= MOCK_EXAM_YEAR_MAX))
    : null
  const list = set ? allYears.filter((y) => set.has(y)) : [...allYears]
  return list.sort((a, b) => b - a)
}

/**
 * Carrega referências de todas as questões do storage que obedecem aos filtros.
 * Espelha a lógica de `searchQuestions` em `apps/web/src/hooks/useQuestionsFilters.ts`.
 */
export async function loadMockExamPool(params: LoadMockExamPoolParams): Promise<MockExamPoolEntry[]> {
  const {
    baseUrl,
    randomMode,
    areaValues,
    topicoValues,
    years,
    language,
    expandLinguagensIdiomas,
  } = params

  if (!baseUrl) return []

  const examsYears = await fetchExamsYears(baseUrl)
  const yearsFiltered = yearsToSearch(examsYears, years)

  const needTopic = !randomMode && topicoValues.length > 0
  const topicMapping = needTopic ? await loadTopicMapping(baseUrl) : null

  let topicQuestionSet: Set<string> | null = null
  if (topicMapping && topicoValues.length > 0) {
    const tv = new Set(topicoValues)
    topicQuestionSet = new Set(
      Object.entries(topicMapping)
        .filter(([, v]) => tv.has(v))
        .map(([k]) => k),
    )
  }

  const areaSet =
    !randomMode && areaValues.length > 0 ? new Set(areaValues) : null

  const allRefs: MockExamPoolEntry[] = []

  const allDetails = await Promise.all(
    yearsFiltered.map((y) => loadExamDetails(baseUrl, y).then((d) => ({ y, d }))),
  )

  for (const { y, d: examDetails } of allDetails) {
    if (!examDetails) continue
    for (const q of examDetails.questions) {
      const discipline = q.discipline ?? null

      if (areaSet && discipline && !areaSet.has(discipline)) continue
      if (areaSet && !discipline) continue

      const hasLanguage = !!q.language
      const isLinguagens = discipline === MOCK_EXAM_AREA_LINGUAGENS

      let matchLanguage = !language || q.language === language || !hasLanguage
      if (expandLinguagensIdiomas && isLinguagens && hasLanguage) {
        matchLanguage = q.language === 'ingles' || q.language === 'espanhol'
      }
      if (!matchLanguage) continue

      if (topicQuestionSet) {
        const key = q.language ? `${y}-${q.index}-${q.language}` : `${y}-${q.index}`
        const keyAlt = `${y}-${q.index}`
        if (!topicQuestionSet.has(key) && !topicQuestionSet.has(keyAlt)) continue
      }

      const lang = q.language ?? null
      allRefs.push({
        questionId: getQuestionId({ year: y, index: q.index, language: lang }),
        year: y,
        index: q.index,
        language: lang,
        discipline,
      })
    }
  }

  return allRefs
}
