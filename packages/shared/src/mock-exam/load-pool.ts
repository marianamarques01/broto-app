import { getQuestionId } from '../types/question'
import { MOCK_EXAM_AREA_LINGUAGENS, MOCK_EXAM_YEAR_MAX, MOCK_EXAM_YEAR_MIN } from './constants'
import type { MockExamPoolEntry } from './types'
import { loadExamDetails, loadTopicMapping, fetchExams } from '../question-bank/static-storage'

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
 * Core de filtros em `@broto/shared/question-bank/filters-core`.
 */
export async function loadMockExamPool(
  params: LoadMockExamPoolParams,
): Promise<MockExamPoolEntry[]> {
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

  const exams = await fetchExams(baseUrl)
  const examsYears = exams.map((e) => e.year)
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

  const areaSet = !randomMode && areaValues.length > 0 ? new Set(areaValues) : null

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
