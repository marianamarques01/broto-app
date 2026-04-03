import { useEffect, useState, useCallback, useRef } from 'react'
import type { Area, Topico, Exam, Question, QuestionsResponse } from '@broto/shared'
import { useClass } from '@/hooks/useClass'

const QUESTIONS_LIMIT = 10
const IDIOMAS_QUESTIONS_LIMIT = 5
const LINGUAGENS_AREA_VALUE = 'linguagens'
const IDIOMAS_TOPIC_ID = '__idiomas'
const EXAM_YEAR_MIN = 2015
const EXAM_YEAR_MAX = 2023

export const LANGUAGE_OPTIONS = [
  { value: '', label: 'Todos os idiomas' },
  { value: 'ingles', label: 'Ingles' },
  { value: 'espanhol', label: 'Espanhol' },
] as const

const IDIOMAS_TOPIC: Topico = { id: IDIOMAS_TOPIC_ID, value: 'idiomas', label: 'Idiomas' }

function getBaseUrl(orgSlug?: string | null): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return ''
  const base = `${supabaseUrl}/storage/v1/object/public/static`
  // Observacao: na instância atual do Storage, os arquivos estao no prefixo raiz
  // (ex.: `static/areas.json`). Por isso, nao anexamos `orgSlug`.
  return base
}

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

const examDetailsCache = new Map<string, { year: number; questions: Array<{ title: string; index: number; discipline: string; language?: string | null }> }>()

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

async function fetchAreas(baseUrl: string): Promise<Area[]> {
  const res = await fetch(`${baseUrl}/areas.json`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function fetchExams(baseUrl: string): Promise<Exam[]> {
  const res = await fetch(`${baseUrl}/exams.json`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((e: { year?: number; title?: string }) => ({ year: Number(e?.year), title: String(e?.title ?? '') }))
    .filter((e: Exam) => e.year >= EXAM_YEAR_MIN && e.year <= EXAM_YEAR_MAX)
}

async function fetchTopics(baseUrl: string, areaValue: string): Promise<Topico[]> {
  const res = await fetch(`${baseUrl}/topics/${areaValue}.json`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function fetchQuestionDetail(baseUrl: string, year: number, index: number, language?: string | null): Promise<Question | null> {
  const paths = language
    ? [`${baseUrl}/${year}/questions/${index}-${language}/details.json`, `${baseUrl}/${year}/questions/${index}/details.json`]
    : [`${baseUrl}/${year}/questions/${index}/details.json`]

  for (const path of paths) {
    const res = await fetch(path)
    if (res.ok) {
      const q = await res.json()
      return {
        title: q.title, index: q.index, year: q.year ?? year,
        discipline: q.discipline ?? null, language: q.language ?? language ?? null,
        context: q.context ?? null,
        alternatives: (q.alternatives ?? []).map((a: { letter: string; text?: string | null; isCorrect?: boolean }) => ({
          letter: a.letter, text: a.text ?? null, isCorrect: a.isCorrect ?? false,
        })),
      }
    }
  }
  return null
}

interface SearchParams {
  baseUrl: string; area: string; year?: string; topicoId?: string; topicoValue?: string; language?: string; limit?: number
}

async function searchQuestions(params: SearchParams): Promise<QuestionsResponse> {
  const { baseUrl, area, year, topicoId, language, limit = QUESTIONS_LIMIT } = params
  const [exams, topicMapping] = await Promise.all([
    fetchExams(baseUrl),
    topicoId && topicoId !== IDIOMAS_TOPIC_ID ? loadTopicMapping(baseUrl) : Promise.resolve(null),
  ])
  const yearsToSearch = year
    ? exams.filter(e => String(e.year) === year).map(e => e.year)
    : exams.map(e => e.year).sort((a, b) => b - a)

  let topicQuestionSet: Set<string> | null = null
  if (topicoId && topicoId !== IDIOMAS_TOPIC_ID && topicMapping) {
    const topicoValue = params.topicoValue
    if (topicoValue) {
      topicQuestionSet = new Set(Object.entries(topicMapping).filter(([, v]) => v === topicoValue).map(([k]) => k))
    }
  }

  type QuestionRef = { year: number; index: number; language: string | null }
  const allRefs: QuestionRef[] = []

  const allDetails = await Promise.all(
    yearsToSearch.map(y => loadExamDetails(baseUrl, y).then(d => ({ y, d }))),
  )

  for (const { y, d: examDetails } of allDetails) {
    if (!examDetails) continue
    for (const q of examDetails.questions) {
      if (q.discipline !== area) continue
      const hasLanguage = !!q.language
      const matchLanguage = !language || q.language === language || !hasLanguage
      if (!matchLanguage) continue
      if (topicQuestionSet) {
        const key = q.language ? `${y}-${q.index}-${q.language}` : `${y}-${q.index}`
        const keyAlt = `${y}-${q.index}`
        if (!topicQuestionSet.has(key) && !topicQuestionSet.has(keyAlt)) continue
      }
      allRefs.push({ year: y, index: q.index, language: q.language ?? null })
    }
  }

  const total = allRefs.length
  const slice = allRefs.slice(0, limit)
  const questions = await Promise.all(slice.map(ref => fetchQuestionDetail(baseUrl, ref.year, ref.index, ref.language)))
  return {
    questions: questions.filter((q): q is Question => q !== null),
    metadata: { limit, offset: 0, total, hasMore: total > limit },
  }
}

export function useQuestionsFilters() {
  const { organization } = useClass()
  const baseUrl = getBaseUrl(organization?.slug ?? null)
  const [areas, setAreas] = useState<Area[]>([])
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedTopico, setSelectedTopico] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const topicosRef = useRef<Topico[]>([])

  const loadInitialData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [areasData, examsData] = await Promise.all([fetchAreas(baseUrl), fetchExams(baseUrl)])
      setAreas(areasData); setExams(examsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally { setLoading(false) }
  }, [baseUrl])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  useEffect(() => {
    if (!selectedArea) { setTopicos([]); topicosRef.current = []; setSelectedTopico(''); setSelectedLanguage(''); return }
    fetchTopics(baseUrl, selectedArea).then(data => {
      const list = selectedArea === LINGUAGENS_AREA_VALUE ? [IDIOMAS_TOPIC, ...data] : data
      setTopicos(list); topicosRef.current = list
    }).catch(() => { setTopicos([]); topicosRef.current = [] })
    setSelectedTopico(''); setSelectedLanguage('')
  }, [selectedArea, baseUrl])

  const isIdiomasTopicSelected = selectedTopico === IDIOMAS_TOPIC_ID

  useEffect(() => {
    if (!selectedArea) { setQuestions([]); return }
    setLoadingQuestions(true); setError(null)
    const topicoValue = topicosRef.current.find(t => t.id === selectedTopico)?.value

    const run = async () => {
      if (isIdiomasTopicSelected) {
        const langs = selectedLanguage ? [selectedLanguage] : ['ingles', 'espanhol']
        const results = await Promise.all(langs.map(lang => searchQuestions({ baseUrl, area: selectedArea, year: selectedYear || undefined, language: lang, limit: IDIOMAS_QUESTIONS_LIMIT })))
        setQuestions(results.flatMap(r => r.questions))
      } else {
        const result = await searchQuestions({ baseUrl, area: selectedArea, year: selectedYear || undefined, topicoId: selectedTopico || undefined, topicoValue, limit: QUESTIONS_LIMIT })
        setQuestions(result.questions)
      }
    }

    run().catch(err => { setError(err instanceof Error ? err.message : 'Erro ao buscar questoes'); setQuestions([]) }).finally(() => setLoadingQuestions(false))
  }, [baseUrl, selectedArea, selectedYear, selectedTopico, selectedLanguage, isIdiomasTopicSelected])

  const retry = useCallback(() => {
    if (areas.length === 0) { loadInitialData() } else {
      setLoadingQuestions(true); setError(null)
      const topicoValue = topicosRef.current.find(t => t.id === selectedTopico)?.value
      const run = isIdiomasTopicSelected
        ? Promise.all((selectedLanguage ? [selectedLanguage] : ['ingles', 'espanhol']).map(lang => searchQuestions({ baseUrl, area: selectedArea, year: selectedYear || undefined, language: lang, limit: IDIOMAS_QUESTIONS_LIMIT }))).then(results => setQuestions(results.flatMap(r => r.questions)))
        : searchQuestions({ baseUrl, area: selectedArea, year: selectedYear || undefined, topicoId: selectedTopico || undefined, topicoValue, limit: QUESTIONS_LIMIT }).then(r => setQuestions(r.questions))
      run.catch(err => { setError(err instanceof Error ? err.message : 'Erro ao buscar questoes'); setQuestions([]) }).finally(() => setLoadingQuestions(false))
    }
  }, [baseUrl, areas.length, loadInitialData, selectedArea, selectedYear, selectedTopico, selectedLanguage, isIdiomasTopicSelected])

  return {
    areas, topicos, exams, questions, loading, loadingQuestions, error,
    selectedArea, selectedYear, selectedTopico, selectedLanguage,
    setSelectedArea, setSelectedYear, setSelectedTopico, setSelectedLanguage,
    retry, isLinguagensArea: selectedArea === LINGUAGENS_AREA_VALUE,
    isLanguageFilterEnabled: selectedArea === LINGUAGENS_AREA_VALUE && isIdiomasTopicSelected,
  }
}
