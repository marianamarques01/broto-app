import type { Exam, Question, Topico } from '@broto/shared'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClass } from '@/hooks/useClass'
import { IDIOMAS_TOPIC_ID, LINGUAGENS_AREA_VALUE } from '@/hooks/useQuestionsFilters'

const EXAM_YEAR_MIN = 2015
const EXAM_YEAR_MAX = 2023

export type QuestionBankRow = {
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

function getBaseUrl(_orgSlug?: string | null): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return ''
  const base = `${supabaseUrl}/storage/v1/object/public/static`
  return base
}

const topicMappingCache = new Map<string, Record<string, string>>()
const examDetailsCache = new Map<
  string,
  {
    year: number
    questions: Array<{ title: string; index: number; discipline: string; language?: string | null }>
  }
>()

async function loadTopicMapping(baseUrl: string): Promise<Record<string, string>> {
  if (topicMappingCache.has(baseUrl)) return topicMappingCache.get(baseUrl)!
  const res = await fetch(`${baseUrl}/data/question-topic-mapping.json`)
  if (!res.ok) return {}
  const data = (await res.json()) as { mapping?: Record<string, string> }
  const mapping = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {}
  topicMappingCache.set(baseUrl, mapping)
  return mapping
}

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

async function fetchExams(baseUrl: string): Promise<Exam[]> {
  const res = await fetch(`${baseUrl}/exams.json`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((e: { year?: number; title?: string }) => ({
      year: Number(e?.year),
      title: String(e?.title ?? ''),
    }))
    .filter((e: Exam) => e.year >= EXAM_YEAR_MIN && e.year <= EXAM_YEAR_MAX)
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
    topicQuestionSet = new Set(
      Object.entries(topicMapping)
        .filter(([, v]) => v === topicoValue)
        .map(([k]) => k),
    )
  }

  const isIdiomas = area === LINGUAGENS_AREA_VALUE && topicoId === IDIOMAS_TOPIC_ID
  const maxYear = yearsToScan.length > 0 ? Math.max(...yearsToScan) : EXAM_YEAR_MAX

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
  const baseUrl = getBaseUrl(organization?.slug ?? null)

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
    void runBuild()
  }, [runBuild])

  const totalInArea = allInArea.length

  return {
    baseUrl,
    loading,
    filtered,
    totalInArea,
    totalFiltered: filtered.length,
    yearHistogram,
    topicSummaries,
  }
}
