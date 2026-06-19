import type { Area, Exam, Question, QuestionsResponse, Topico } from '../types/question'
import {
  IDIOMAS_TOPIC,
  IDIOMAS_TOPIC_ID,
  IDIOMAS_QUESTIONS_LIMIT,
  LINGUAGENS_AREA_VALUE,
  QUESTIONS_LIMIT,
} from './constants'
import {
  fetchExams,
  fetchQuestionDetail,
  loadExamDetails,
  loadTopicMapping,
  type ExamDetails,
} from './static-storage'

export type QuestionRef = { year: number; index: number; language: string | null }

export function buildTopicQuestionSet(
  topicMapping: Record<string, string>,
  topicoValue: string,
): Set<string> {
  return new Set(
    Object.entries(topicMapping)
      .filter(([, v]) => v === topicoValue)
      .map(([k]) => k),
  )
}

export function resolveYearsToSearch(exams: Exam[], yearFilter?: string): number[] {
  if (yearFilter) {
    return exams.filter((e) => String(e.year) === yearFilter).map((e) => e.year)
  }
  return exams.map((e) => e.year).sort((a, b) => b - a)
}

export function questionRefKeys(year: number, index: number, language?: string | null): {
  full: string
  alt: string
} {
  const lang = language ?? null
  return {
    full: lang ? `${year}-${index}-${lang}` : `${year}-${index}`,
    alt: `${year}-${index}`,
  }
}

export function matchesTopicFilter(
  topicQuestionSet: Set<string> | null | undefined,
  year: number,
  index: number,
  language?: string | null,
): boolean {
  if (!topicQuestionSet) return true
  const { full, alt } = questionRefKeys(year, index, language)
  return topicQuestionSet.has(full) || topicQuestionSet.has(alt)
}

export function matchesLanguageFilter(
  questionLanguage: string | null | undefined,
  filterLanguage?: string,
): boolean {
  const hasLanguage = !!questionLanguage
  return !filterLanguage || questionLanguage === filterLanguage || !hasLanguage
}

export function collectQuestionRefs(params: {
  examDetailsByYear: Array<{ year: number; details: ExamDetails | null }>
  area: string
  language?: string
  topicQuestionSet?: Set<string> | null
}): QuestionRef[] {
  const { examDetailsByYear, area, language, topicQuestionSet } = params
  const refs: QuestionRef[] = []

  for (const { year, details } of examDetailsByYear) {
    if (!details) continue
    for (const q of details.questions) {
      if (q.discipline !== area) continue
      if (!matchesLanguageFilter(q.language ?? null, language)) continue
      if (!matchesTopicFilter(topicQuestionSet, year, q.index, q.language ?? null)) continue
      refs.push({ year, index: q.index, language: q.language ?? null })
    }
  }

  return refs
}

export function enrichTopicosForArea(area: string, topicos: Topico[]): Topico[] {
  return area === LINGUAGENS_AREA_VALUE ? [IDIOMAS_TOPIC, ...topicos] : topicos
}

export function resolveSelectedAreaAfterCatalogLoad(
  areas: Area[],
  options: {
    preferredArea?: string | null
    autoSelectFirstArea: boolean
    currentSelectedArea: string
  },
): string {
  const { preferredArea, autoSelectFirstArea, currentSelectedArea } = options
  if (preferredArea != null && preferredArea !== '') {
    if (areas.some((a) => a.value === preferredArea)) return preferredArea
  }
  if (autoSelectFirstArea) {
    return currentSelectedArea || areas[0]?.value || ''
  }
  return currentSelectedArea
}

export function deriveFilterFlags(selectedArea: string, selectedTopico: string) {
  const isIdiomasTopicSelected = selectedTopico === IDIOMAS_TOPIC_ID
  return {
    isLinguagensArea: selectedArea === LINGUAGENS_AREA_VALUE,
    isIdiomasTopicSelected,
    isLanguageFilterEnabled:
      selectedArea === LINGUAGENS_AREA_VALUE && isIdiomasTopicSelected,
  }
}

export function idiomasLanguagesForFetch(selectedLanguage: string): string[] {
  return selectedLanguage ? [selectedLanguage] : ['ingles', 'espanhol']
}

export interface SearchQuestionsParams {
  baseUrl: string
  area: string
  year?: string
  topicoId?: string
  topicoValue?: string
  language?: string
  limit?: number
}

export async function searchQuestions(params: SearchQuestionsParams): Promise<QuestionsResponse> {
  const { baseUrl, area, year, topicoId, topicoValue, language, limit = QUESTIONS_LIMIT } = params

  const [exams, topicMapping] = await Promise.all([
    fetchExams(baseUrl),
    topicoId && topicoId !== IDIOMAS_TOPIC_ID ? loadTopicMapping(baseUrl) : Promise.resolve(null),
  ])

  const yearsToSearch = resolveYearsToSearch(exams, year)

  let topicQuestionSet: Set<string> | null = null
  if (topicoId && topicoId !== IDIOMAS_TOPIC_ID && topicMapping && topicoValue) {
    topicQuestionSet = buildTopicQuestionSet(topicMapping, topicoValue)
  }

  const examDetailsByYear = await Promise.all(
    yearsToSearch.map((y) => loadExamDetails(baseUrl, y).then((d) => ({ year: y, details: d }))),
  )

  const allRefs = collectQuestionRefs({
    examDetailsByYear,
    area,
    language,
    topicQuestionSet,
  })

  const total = allRefs.length
  const slice = allRefs.slice(0, limit)
  const questions = await Promise.all(
    slice.map((ref) => fetchQuestionDetail(baseUrl, ref.year, ref.index, ref.language)),
  )

  return {
    questions: questions.filter((q): q is Question => q !== null),
    metadata: { limit, offset: 0, total, hasMore: total > limit },
  }
}

export async function searchIdiomasQuestions(params: {
  baseUrl: string
  area: string
  year?: string
  selectedLanguage: string
  limitPerLanguage?: number
}): Promise<Question[]> {
  const { baseUrl, area, year, selectedLanguage, limitPerLanguage = IDIOMAS_QUESTIONS_LIMIT } =
    params
  const langs = idiomasLanguagesForFetch(selectedLanguage)
  const results = await Promise.all(
    langs.map((lang) =>
      searchQuestions({
        baseUrl,
        area,
        year,
        language: lang,
        limit: limitPerLanguage,
      }),
    ),
  )
  return results.flatMap((r) => r.questions)
}
