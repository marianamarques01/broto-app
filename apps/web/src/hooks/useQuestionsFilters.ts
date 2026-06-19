import { useEffect, useState, useCallback, useRef } from 'react'
import {
  fetchAreas,
  fetchExams,
  fetchTopics,
  searchQuestions,
  searchIdiomasQuestions,
  enrichTopicosForArea,
  resolveSelectedAreaAfterCatalogLoad,
  deriveFilterFlags,
  LANGUAGE_OPTIONS,
  LINGUAGENS_AREA_VALUE,
  IDIOMAS_TOPIC_ID,
  QUESTIONS_LIMIT,
  IDIOMAS_QUESTIONS_LIMIT,
} from '@broto/shared'
import { useClass } from '@/hooks/useClass'
import { getStaticStorageBaseUrl } from '@/lib/static-storage-url'

export {
  LANGUAGE_OPTIONS,
  LINGUAGENS_AREA_VALUE,
  IDIOMAS_TOPIC_ID,
  QUESTIONS_LIMIT,
  IDIOMAS_QUESTIONS_LIMIT,
}

export function useQuestionsFilters(options?: {
  enableQuestionFetch?: boolean
  preferredArea?: string | null
  autoSelectFirstArea?: boolean
  initialYear?: string
  initialTopico?: string
  initialLanguage?: string
}) {
  const enableQuestionFetch = options?.enableQuestionFetch !== false
  const preferredArea = options?.preferredArea
  const autoSelectFirstArea = options?.autoSelectFirstArea !== false
  const { organization } = useClass()
  const baseUrl = getStaticStorageBaseUrl(organization?.slug ?? null)

  const [areas, setAreas] = useState<Awaited<ReturnType<typeof fetchAreas>>>([])
  const [topicos, setTopicos] = useState<Awaited<ReturnType<typeof fetchTopics>>>([])
  const [exams, setExams] = useState<Awaited<ReturnType<typeof fetchExams>>>([])
  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof searchQuestions>>['questions']>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedYear, setSelectedYear] = useState(options?.initialYear ?? '')
  const [selectedTopico, setSelectedTopico] = useState(options?.initialTopico ?? '')
  const [selectedLanguage, setSelectedLanguage] = useState(options?.initialLanguage ?? '')
  const topicosRef = useRef<Awaited<ReturnType<typeof fetchTopics>>>([])
  const preserveInitialTopicFiltersRef = useRef(
    Boolean(options?.initialTopico || options?.initialLanguage),
  )

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [areasData, examsData] = await Promise.all([fetchAreas(baseUrl), fetchExams(baseUrl)])
      setAreas(areasData)
      setExams(examsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

  const [prevAreasLength, setPrevAreasLength] = useState(0)
  if (areas.length > 0 && areas.length !== prevAreasLength) {
    setPrevAreasLength(areas.length)
    setSelectedArea((cur) =>
      resolveSelectedAreaAfterCatalogLoad(areas, {
        preferredArea,
        autoSelectFirstArea,
        currentSelectedArea: cur,
      }),
    )
  }

  useEffect(() => {
    async function loadTopics() {
      if (!selectedArea) {
        setTopicos([])
        topicosRef.current = []
        setSelectedTopico('')
        setSelectedLanguage('')
        return
      }

      try {
        const data = await fetchTopics(baseUrl, selectedArea)
        const list = enrichTopicosForArea(selectedArea, data)
        setTopicos(list)
        topicosRef.current = list
      } catch (err) {
        setTopicos([])
        topicosRef.current = []
        setError(err instanceof Error ? err.message : 'Erro ao carregar tópicos')
      }

      if (preserveInitialTopicFiltersRef.current) {
        preserveInitialTopicFiltersRef.current = false
        return
      }
      setSelectedTopico('')
      setSelectedLanguage('')
    }

    void loadTopics()
  }, [selectedArea, baseUrl])

  const { isIdiomasTopicSelected, isLinguagensArea, isLanguageFilterEnabled } = deriveFilterFlags(
    selectedArea,
    selectedTopico,
  )

  const fetchQuestionsForFilters = useCallback(async () => {
    const topicoValue = topicosRef.current.find((t) => t.id === selectedTopico)?.value

    if (isIdiomasTopicSelected) {
      return searchIdiomasQuestions({
        baseUrl,
        area: selectedArea,
        year: selectedYear || undefined,
        selectedLanguage,
        limitPerLanguage: IDIOMAS_QUESTIONS_LIMIT,
      })
    }

    const result = await searchQuestions({
      baseUrl,
      area: selectedArea,
      year: selectedYear || undefined,
      topicoId: selectedTopico || undefined,
      topicoValue,
      limit: QUESTIONS_LIMIT,
    })
    return result.questions
  }, [
    baseUrl,
    selectedArea,
    selectedYear,
    selectedTopico,
    selectedLanguage,
    isIdiomasTopicSelected,
  ])

  useEffect(() => {
    async function loadQuestions() {
      if (!enableQuestionFetch || !selectedArea) {
        setQuestions([])
        setLoadingQuestions(false)
        return
      }

      setLoadingQuestions(true)
      setError(null)

      try {
        setQuestions(await fetchQuestionsForFilters())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar questoes')
        setQuestions([])
      } finally {
        setLoadingQuestions(false)
      }
    }

    void loadQuestions()
  }, [enableQuestionFetch, selectedArea, fetchQuestionsForFilters])

  const retry = useCallback(() => {
    if (areas.length === 0) {
      void loadInitialData()
      return
    }
    setLoadingQuestions(true)
    setError(null)
    void fetchQuestionsForFilters()
      .then(setQuestions)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao buscar questoes')
        setQuestions([])
      })
      .finally(() => setLoadingQuestions(false))
  }, [areas.length, loadInitialData, fetchQuestionsForFilters])

  return {
    areas,
    topicos,
    exams,
    questions,
    loading,
    loadingQuestions,
    error,
    selectedArea,
    selectedYear,
    selectedTopico,
    selectedLanguage,
    setSelectedArea,
    setSelectedYear,
    setSelectedTopico,
    setSelectedLanguage,
    retry,
    isLinguagensArea,
    isLanguageFilterEnabled,
  }
}
