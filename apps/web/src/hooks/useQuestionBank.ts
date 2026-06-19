import type { Exam, Question, QuestionBankRow, Topico } from '@broto/shared'
import {
  fetchExams,
  fetchQuestionDetail,
  loadExamDetails,
  loadTopicMapping,
  buildTopicQuestionSet,
  IDIOMAS_TOPIC_ID,
  LINGUAGENS_AREA_VALUE,
  QUESTION_BANK_YEAR_MAX,
} from '@broto/shared'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClass } from '@/hooks/useClass'
import { getStaticStorageBaseUrl } from '@/lib/static-storage-url'

export type { QuestionBankRow }

export type QuestionBankTopicSummary = {
  value: string
  label: string
  count: number
  dotClass: string
}

const TOPIC_DOT_CLASSES = [
  'broto-qbank-topic-dot--coral',
  'broto-qbank-topic-dot--gold',
  'broto-qbank-topic-dot--sky',
  'broto-qbank-topic-dot--teal',
  'broto-qbank-topic-dot--violet',
]

/** Base URL dos JSON estáticos do banco (detalhes das questões). */
export function getQuestionBankStaticBaseUrl(): string {
  return getStaticStorageBaseUrl(null)
}

function simplifyTitle(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function difficultyOf(year: number, index: number): 'facil' | 'medio' | 'dificil' {
  const h = Math.abs(year * 31 + index) % 3
  return h === 0 ? 'facil' : h === 1 ? 'medio' : 'dificil'
}

/** Mesma heurística usada nas linhas do banco (ano + índice), para telas onde a linha não está na sequência. */
export function estimateQuestionBankDifficulty(
  year: number,
  index: number,
): 'facil' | 'medio' | 'dificil' {
  return difficultyOf(year, index)
}

function areaPrefix(area: string): string {
  if (area === 'linguagens') return 'LNG'
  if (area === 'ciencias-humanas') return 'CH'
  if (area === 'ciencias-natureza') return 'CN'
  if (area === 'matematica') return 'MAT'
  return 'Q'
}

export function formatQuestionBankId(area: string, year: number, index: number): string {
  return `#${areaPrefix(area)}-${year}-${String(index).padStart(3, '0')}`
}

export async function fetchQuestionDetailForBank(
  baseUrl: string,
  year: number,
  index: number,
  language?: string | null,
): Promise<Question | null> {
  return fetchQuestionDetail(baseUrl, year, index, language)
}

type BuildParams = {
  baseUrl: string
  area: string
  yearFilter: string
  topicoId: string
  topicoValue: string | undefined
  language: string
  search: string
  difficultyFilter: '' | 'facil' | 'medio' | 'dificil'
  topicLabelByValue: Map<string, string>
  exams: Exam[]
}

async function buildQuestionBankRows(p: BuildParams): Promise<{
  allInArea: QuestionBankRow[]
  filtered: QuestionBankRow[]
  yearHistogram: Record<number, number>
  topicSummaries: QuestionBankTopicSummary[]
}> {
  const {
    baseUrl,
    area,
    yearFilter,
    topicoId,
    topicoValue,
    language,
    search,
    difficultyFilter,
    topicLabelByValue,
    exams,
  } = p

  const yearsToScan = yearFilter
    ? exams.filter((e) => String(e.year) === yearFilter).map((e) => e.year)
    : exams.map((e) => e.year).sort((a, b) => b - a)

  const topicMapping = await loadTopicMapping(baseUrl)

  let topicQuestionSet: Set<string> | null = null
  if (topicoId && topicoId !== IDIOMAS_TOPIC_ID && topicoValue) {
    topicQuestionSet = buildTopicQuestionSet(topicMapping, topicoValue)
  }

  const isIdiomas = area === LINGUAGENS_AREA_VALUE && topicoId === IDIOMAS_TOPIC_ID
  const maxYear = yearsToScan.length > 0 ? Math.max(...yearsToScan) : QUESTION_BANK_YEAR_MAX

  const allDetails = await Promise.all(
    yearsToScan.map((y) => loadExamDetails(baseUrl, y).then((d) => ({ y, d }))),
  )

  const scanned: QuestionBankRow[] = []
  const yearHistogram: Record<number, number> = {}

  for (const { y, d: examDetails } of allDetails) {
    if (!examDetails) continue
    yearHistogram[y] = 0
    for (const q of examDetails.questions) {
      if (q.discipline !== area) continue
      const hasLanguage = !!q.language
      const langVal = q.language ?? null
      if (isIdiomas) {
        if (!hasLanguage) continue
        if (language && langVal !== language) continue
      }
      const keyFull = langVal ? `${y}-${q.index}-${langVal}` : `${y}-${q.index}`
      const keyAlt = `${y}-${q.index}`
      const topicoValueFromMap = topicMapping[keyFull] ?? topicMapping[keyAlt] ?? null
      const topicoLabel =
        (topicoValueFromMap && topicLabelByValue.get(topicoValueFromMap)) ||
        (topicoValueFromMap ? humanizeSlug(topicoValueFromMap) : 'Geral')

      const row: QuestionBankRow = {
        year: y,
        index: q.index,
        language: langVal,
        title: q.title,
        preview: simplifyTitle(q.title).slice(0, 220),
        discipline: area,
        topicoValue: topicoValueFromMap,
        topicoLabel,
        difficulty: difficultyOf(y, q.index),
        isNova: y >= maxYear - 1,
      }

      scanned.push(row)
      yearHistogram[y] = (yearHistogram[y] ?? 0) + 1
    }
  }

  const allInArea = [...scanned].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.index - a.index,
  )

  const searchLc = search.trim().toLowerCase()
  let narrowed = scanned
  if (searchLc) {
    narrowed = narrowed.filter((r) => {
      const t = simplifyTitle(r.title).toLowerCase()
      return t.includes(searchLc)
    })
  }
  if (difficultyFilter) {
    narrowed = narrowed.filter((r) => r.difficulty === difficultyFilter)
  }

  const topicCountMap = new Map<string, { label: string; count: number }>()
  for (const r of narrowed) {
    if (!r.topicoValue) continue
    const cur = topicCountMap.get(r.topicoValue) ?? { label: r.topicoLabel, count: 0 }
    cur.count += 1
    cur.label = r.topicoLabel
    topicCountMap.set(r.topicoValue, cur)
  }

  let filtered = narrowed
  if (topicQuestionSet) {
    filtered = filtered.filter((r) => {
      const kf = r.language ? `${r.year}-${r.index}-${r.language}` : `${r.year}-${r.index}`
      const ka = `${r.year}-${r.index}`
      return topicQuestionSet.has(kf) || topicQuestionSet.has(ka)
    })
  }
  filtered.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.index - a.index))

  const topicSummaries: QuestionBankTopicSummary[] = [...topicCountMap.entries()]
    .map(([value, { label, count }], i) => ({
      value,
      label,
      count,
      dotClass: TOPIC_DOT_CLASSES[i % TOPIC_DOT_CLASSES.length] ?? 'broto-qbank-topic-dot--teal',
    }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 8)

  return { allInArea, filtered, yearHistogram, topicSummaries }
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function useQuestionBank(params: {
  selectedArea: string
  selectedYear: string
  selectedTopico: string
  selectedLanguage: string
  topicos: Topico[]
  exams: Exam[]
  search: string
  difficultyFilter: '' | 'facil' | 'medio' | 'dificil'
  sortRecent: boolean
  catalogReady: boolean
}) {
  const { organization } = useClass()
  const baseUrl = getStaticStorageBaseUrl(organization?.slug ?? null)

  const {
    selectedArea,
    selectedYear,
    selectedTopico,
    selectedLanguage,
    topicos,
    exams,
    search,
    difficultyFilter,
    sortRecent,
    catalogReady,
  } = params

  const topicLabelByValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of topicos) {
      m.set(t.value, t.label)
    }
    return m
  }, [topicos])

  const topicoValue = useMemo(
    () => topicos.find((t) => t.id === selectedTopico)?.value,
    [topicos, selectedTopico],
  )

  const [loading, setLoading] = useState(false)
  const [allInArea, setAllInArea] = useState<QuestionBankRow[]>([])
  const [filtered, setFiltered] = useState<QuestionBankRow[]>([])
  const [yearHistogram, setYearHistogram] = useState<Record<number, number>>({})
  const [topicSummaries, setTopicSummaries] = useState<QuestionBankTopicSummary[]>([])

  const runBuild = useCallback(async () => {
    if (!catalogReady || !selectedArea || !baseUrl) {
      setAllInArea([])
      setFiltered([])
      setYearHistogram({})
      setTopicSummaries([])
      return
    }
    setLoading(true)
    try {
      const examsData = exams.length > 0 ? exams : await fetchExams(baseUrl)
      const result = await buildQuestionBankRows({
        baseUrl,
        area: selectedArea,
        yearFilter: selectedYear,
        topicoId: selectedTopico,
        topicoValue,
        language: selectedLanguage,
        search,
        difficultyFilter,
        topicLabelByValue,
        exams: examsData,
      })
      let nextFiltered = result.filtered
      if (!sortRecent) {
        nextFiltered = [...nextFiltered].sort((a, b) =>
          a.year !== b.year ? a.year - b.year : a.index - b.index,
        )
      }
      setAllInArea(result.allInArea)
      setFiltered(nextFiltered)
      setYearHistogram(result.yearHistogram)
      setTopicSummaries(result.topicSummaries)
    } finally {
      setLoading(false)
    }
  }, [
    baseUrl,
    catalogReady,
    selectedArea,
    selectedYear,
    selectedTopico,
    topicoValue,
    selectedLanguage,
    search,
    difficultyFilter,
    topicLabelByValue,
    exams,
    sortRecent,
  ])

  useEffect(() => {
    async function load() {
      await runBuild()
    }

    void load()
  }, [runBuild])

  const totalInArea = allInArea.length

  return {
    baseUrl,
    loading,
    allInArea,
    filtered,
    totalInArea,
    totalFiltered: filtered.length,
    yearHistogram,
    topicSummaries,
  }
}
