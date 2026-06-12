import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Clock, Gauge, ListChecks } from 'lucide-react'
import { getQuestionId, parseEnemAreaKey, type Question } from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import { useQuestionsFilters } from '@/hooks/useQuestionsFilters'
import {
  estimateQuestionBankDifficulty,
  fetchQuestionDetailForBank,
  formatQuestionBankId,
  useQuestionBank,
  type QuestionBankRow,
} from '@/hooks/useQuestionBank'
import { AREA_CONFIG, getAreaColor } from '@/lib/area-config'

function QuestionAreaIcon({
  area,
  size,
  strokeWidth,
}: {
  area: string
  size: number
  strokeWidth: number
}) {
  const Icon = AREA_CONFIG[area]?.icon ?? BookOpen
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden />
}

type QuestionRouteParts = {
  year: number
  index: number
  language: string | null
}

type DifficultyFilter = '' | 'facil' | 'medio' | 'dificil'

type QuestionLoadResult = {
  key: string
  question: Question | null
  error: string | null
}

function parseQuestionRouteId(raw?: string): QuestionRouteParts | null {
  if (!raw) return null
  const decoded = decodeURIComponent(raw)
  const [yearRaw, indexRaw, ...languageParts] = decoded.split('-')
  const year = Number(yearRaw)
  const index = Number(indexRaw)

  if (!Number.isFinite(year) || !Number.isFinite(index)) return null

  return {
    year,
    index,
    language: languageParts.length > 0 ? languageParts.join('-') : null,
  }
}

function buildQuestionPath(areaKey: string, row: QuestionBankRow, search: string): string {
  const questionId = encodeURIComponent(getQuestionId(row))
  return `/study/${areaKey}/banco/${questionId}${search ? `?${search}` : ''}`
}

function buildCatalogPath(areaKey: string, search: string): string {
  return `/study/${areaKey}/banco${search ? `?${search}` : ''}`
}

function estimatedMinutes(index: number): number {
  return 2 + (index % 3)
}

function difficultyLabelPt(level: 'facil' | 'medio' | 'dificil'): string {
  if (level === 'facil') return 'Fácil'
  if (level === 'medio') return 'Médio'
  return 'Difícil'
}

export function QuestionBankQuestion() {
  const { areaKey: rawAreaKey, questionId: rawQuestionId } = useParams<{
    areaKey: string
    questionId: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const areaKey = rawAreaKey ? parseEnemAreaKey(rawAreaKey) : undefined
  const questionRoute = useMemo(() => parseQuestionRouteId(rawQuestionId), [rawQuestionId])
  const queryString = searchParams.toString()
  const selectedYearFilter = searchParams.get('year') ?? ''
  const selectedTopicoFilter = searchParams.get('topic') ?? ''
  const selectedLanguageFilter = searchParams.get('lang') ?? ''
  const difficultyFilter = (searchParams.get('difficulty') ?? '') as DifficultyFilter
  const searchFilter = searchParams.get('q') ?? ''
  const sortRecentFilter = searchParams.get('sort') === 'recent'

  const {
    areas,
    topicos,
    exams,
    loading: loadingFilters,
    error: filtersError,
    selectedArea,
    retry,
  } = useQuestionsFilters({
    enableQuestionFetch: false,
    preferredArea: areaKey ?? null,
    autoSelectFirstArea: false,
  })

  const catalogReady = !loadingFilters && exams.length > 0 && Boolean(selectedArea)
  const {
    baseUrl,
    loading: loadingBank,
    allInArea,
    filtered,
  } = useQuestionBank({
    selectedArea,
    selectedYear: selectedYearFilter,
    selectedTopico: selectedTopicoFilter,
    selectedLanguage: selectedLanguageFilter,
    topicos,
    exams,
    search: searchFilter,
    difficultyFilter,
    sortRecent: sortRecentFilter,
    catalogReady,
  })

  const [questionResult, setQuestionResult] = useState<QuestionLoadResult | null>(null)
  const fetchGen = useRef(0)

  const sequence = filtered.length > 0 ? filtered : allInArea
  const currentId = questionRoute
    ? getQuestionId({
        year: questionRoute.year,
        index: questionRoute.index,
        language: questionRoute.language,
      })
    : null
  const currentIndex = currentId
    ? sequence.findIndex((row) => getQuestionId(row) === currentId)
    : -1
  const currentRow = currentIndex >= 0 ? sequence[currentIndex] : null
  const previousRow = currentIndex > 0 ? sequence[currentIndex - 1] : null
  const nextRow =
    currentIndex >= 0 && currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null
  const areaLabel =
    AREA_CONFIG[selectedArea]?.label ?? areas.find((a) => a.value === selectedArea)?.label ?? 'Área'
  const catalogPath = selectedArea ? buildCatalogPath(selectedArea, queryString) : '/study'
  const areaAccent = getAreaColor(selectedArea)
  const difficultyLevel =
    currentRow?.difficulty ??
    (questionRoute
      ? estimateQuestionBankDifficulty(questionRoute.year, questionRoute.index)
      : 'medio')
  const loadedCurrentQuestion = questionResult?.key === currentId ? questionResult : null
  const question = loadedCurrentQuestion?.question ?? null
  const questionError = loadedCurrentQuestion?.error ?? null
  const loadingQuestion = Boolean(baseUrl && currentId && !loadedCurrentQuestion)

  useEffect(() => {
    if (!baseUrl || !questionRoute || !currentId) return

    fetchGen.current += 1
    const gen = fetchGen.current

    void fetchQuestionDetailForBank(
      baseUrl,
      questionRoute.year,
      questionRoute.index,
      questionRoute.language,
    )
      .then((nextQuestion) => {
        if (gen !== fetchGen.current) return
        setQuestionResult({
          key: currentId,
          question: nextQuestion,
          error: nextQuestion ? null : 'Não foi possível carregar esta questão.',
        })
      })
      .catch(() => {
        if (gen !== fetchGen.current) return
        setQuestionResult({
          key: currentId,
          question: null,
          error: 'Não foi possível carregar esta questão.',
        })
      })
  }, [baseUrl, currentId, questionRoute])

  function goToRow(row: QuestionBankRow | null) {
    if (!row || !selectedArea) return
    navigate(buildQuestionPath(selectedArea, row, queryString))
  }

  function handleNext() {
    if (nextRow) {
      goToRow(nextRow)
      return
    }
    navigate(catalogPath)
  }

  if (!areaKey || !questionRoute) {
    return <Navigate to="/study" replace />
  }

  return (
    <>
      <TopBar
        variant="study"
        title="Resolver questão"
        studyShortcut={{ label: 'Voltar ao banco', onClick: () => navigate(catalogPath) }}
        studyBreadcrumb={{ area: areaLabel, detail: 'Banco de questões' }}
      />
      <div className="broto-main-inner broto-main-inner--study">
        <main
          className="broto-qbank-question-page"
          style={{ '--broto-qbank-area-accent': areaAccent } as CSSProperties}
        >
          <section className="broto-qbank-question-hero">
            <div className="broto-qbank-question-hero__body">
              <div className="broto-qbank-question-hero__icon">
                <QuestionAreaIcon area={selectedArea} size={20} strokeWidth={1.8} />
              </div>
              <div className="broto-qbank-question-hero__copy">
                <p className="broto-qbank-question-kicker">{areaLabel}</p>
                <h1 className="broto-qbank-question-title">
                  {formatQuestionBankId(areaKey, questionRoute.year, questionRoute.index)}
                </h1>
                <p className="broto-qbank-question-subtitle">
                  Questão {questionRoute.index} do ENEM {questionRoute.year}
                  {questionRoute.language ? ` · ${questionRoute.language}` : ''}
                </p>
              </div>
            </div>
            <div className="broto-qbank-question-nav" aria-label="Navegação da sequência">
              <button
                type="button"
                className="broto-qbank-question-nav-btn"
                disabled={!previousRow}
                onClick={() => goToRow(previousRow)}
              >
                <ChevronLeft size={15} aria-hidden />
                Anterior
              </button>
              <button
                type="button"
                className="broto-qbank-question-nav-btn"
                disabled={!nextRow}
                onClick={() => goToRow(nextRow)}
              >
                Próxima
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
          </section>

          {filtersError ? (
            <div className="broto-error-banner broto-qbank-banner">
              <span>{filtersError}</span>
              <button type="button" onClick={retry}>
                Tentar novamente
              </button>
            </div>
          ) : null}

          <div className="broto-qbank-question-layout">
            <section className="broto-qbank-question-player">
              {loadingFilters || loadingBank || loadingQuestion ? (
                <div className="broto-skeleton broto-qbank-question-skeleton" />
              ) : questionError || !question ? (
                <div className="broto-qbank-empty">
                  <h2 className="broto-qbank-empty-title">Questão indisponível</h2>
                  <p className="broto-qbank-empty-desc">
                    {questionError ?? 'Esta questão não foi encontrada no catálogo.'}
                  </p>
                </div>
              ) : (
                <QuestionPlayer
                  key={getQuestionId(question)}
                  question={question}
                  areaKey={selectedArea}
                  onNext={handleNext}
                  nextCtaLabel={nextRow ? 'Próxima questão' : 'Voltar ao banco'}
                />
              )}
            </section>

            <aside className="broto-qbank-question-aside" aria-label="Contexto da questão">
              <div className="broto-qbank-question-aside-card">
                <span className="broto-qbank-question-aside-label">Sequência atual</span>
                <strong>
                  {currentIndex >= 0
                    ? `${currentIndex + 1} de ${sequence.length}`
                    : 'Questão avulsa'}
                </strong>
                <p>A navegação respeita os filtros e a busca usados no banco de questões.</p>
              </div>
              <div className="broto-qbank-question-aside-card">
                <span className="broto-qbank-question-aside-label">Detalhes</span>
                <p className="broto-qbank-question-meta">
                  <ListChecks size={14} aria-hidden />
                  {currentRow?.topicoLabel ?? 'Tópico geral'}
                </p>
                <p className="broto-qbank-question-meta">
                  <Clock size={14} aria-hidden />~{estimatedMinutes(questionRoute.index)} min
                </p>
                <p className="broto-qbank-question-meta">
                  <Gauge size={14} aria-hidden />
                  {difficultyLabelPt(difficultyLevel)}
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}
