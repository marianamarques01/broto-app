import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IDIOMAS_TOPIC_ID,
  LANGUAGE_OPTIONS,
  useQuestionsFilters,
} from '@/hooks/useQuestionsFilters'
import {
  formatQuestionBankId,
  useQuestionBank,
  type QuestionBankRow,
} from '@/hooks/useQuestionBank'
import type { QuestionBankPriorityResult } from '@broto/shared'
import { getQuestionId } from '@broto/shared'
import { getAreaColor } from '@/lib/area-config'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { useRecentMistakes } from '@/hooks/useRecentMistakes'
import {
  useQuestionBankAnswerStatus,
  type QuestionAnswerOutcome,
} from '@/hooks/useQuestionBankAnswerStatus'
import { useQuestionBankPriority } from '@/hooks/useQuestionBankPriority'
import { StartPathsGrid } from '@/components/study/question-bank/StartPathsGrid'
import { QuestionBankFocusBand } from '@/components/study/question-bank/QuestionBankFocusBand'
import { TopicCarouselSection } from '@/components/study/question-bank/TopicCarouselSection'
import { PerformanceDonutCard } from '@/components/study/question-bank/PerformanceDonutCard'
import { WeakTopicsAside } from '@/components/study/question-bank/WeakTopicsAside'
import { MockExamConfigurator } from '@/components/mock-exam/MockExamConfigurator'
import { QuestionBankAnswerStatusBadge } from '@/components/study/question-bank/QuestionBankAnswerStatusBadge'
import { StudyAreaBankCard } from '@/components/study/StudyAreaBankCard'
import { StudyAreaSessionCard } from '@/components/study/StudyAreaSessionCard'
import { StudyAreaTopicsPanel } from '@/components/study/StudyAreaTopicsPanel'
import { StudyPackageSimuladoSessionCard } from '@/components/study/StudyPackageSimuladoSessionCard'
import type { TopicOption } from '@/lib/study-area-mock'
import { Link, useNavigate } from 'react-router-dom'

/** Oculto temporariamente — reativar quando os caminhos de início estiverem prontos. */
const SHOW_START_PATHS_GRID = false
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  SlidersHorizontal,
} from 'lucide-react'

const PAGE_SIZE = 8

const GUIDED_PRACTICE_MAX = 5

type QuestionBankInitialFilters = {
  year?: string
  topic?: string
  topicValues?: string[]
  language?: string
  difficulty?: '' | 'facil' | 'medio' | 'dificil'
  search?: string
  sortRecent?: boolean
}

function buildGuidedPracticeRowsForPrimary(
  primary: NonNullable<QuestionBankPriorityResult['primary']>,
  priorityResult: QuestionBankPriorityResult,
  allInArea: QuestionBankRow[],
  max: number,
): QuestionBankRow[] {
  const row = primary.targetRow
  if (!row) return []
  const track = priorityResult.tracks.find((t) => t.id === primary.trackId)
  const trackRows = track?.rows ?? []

  if (primary.trackId === 'mistakes') {
    const fromTrack = trackRows.slice(0, max)
    return fromTrack.length > 0 ? fromTrack : [row]
  }

  const sameTopic = trackRows.filter((r) => r.topicoValue === row.topicoValue)
  const keys = new Set(sameTopic.map((r) => getQuestionId(r)))
  const out: QuestionBankRow[] = [...sameTopic]
  if (out.length >= max) return out.slice(0, max)

  const pool = allInArea
    .filter((r) => r.topicoValue === row.topicoValue && !keys.has(getQuestionId(r)))
    .sort((a, b) => b.year - a.year || a.index - b.index)
  for (const p of pool) {
    if (out.length >= max) break
    out.push(p)
    keys.add(getQuestionId(p))
  }
  return out.length > 0 ? out : [row]
}

const AREA_HERO: Record<string, { kicker: string; blurb: string }> = {
  linguagens: {
    kicker: 'Linguagens, Códigos e suas Tecnologias',
    blurb:
      'Interpretação, gramática, literatura e língua estrangeira — pratica com o catálogo completo e sugestões por prioridade.',
  },
  'ciencias-humanas': {
    kicker: 'Ciências Humanas e suas Tecnologias',
    blurb:
      'História, geografia, filosofia e sociologia — organiza o estudo por temas e pelo teu desempenho.',
  },
  'ciencias-natureza': {
    kicker: 'Ciências da Natureza e suas Tecnologias',
    blurb:
      'Biologia, química e física no estilo ENEM — refina com erros recentes e tópicos que precisam de reforço.',
  },
  matematica: {
    kicker: 'Matemática e suas Tecnologias',
    blurb: 'Raciocínio, geometria, álgebra e dados — treina com foco no que ainda não dominaste.',
  },
}

function getAreaTabKey(areaValue: string): 'lang' | 'hum' | 'nat' | 'mat' {
  if (areaValue === 'linguagens') return 'lang'
  if (areaValue === 'ciencias-humanas') return 'hum'
  if (areaValue === 'ciencias-natureza') return 'nat'
  if (areaValue === 'matematica') return 'mat'
  return 'lang'
}

function difficultyDotsActive(level: 'facil' | 'medio' | 'dificil'): number {
  if (level === 'facil') return 1
  if (level === 'medio') return 2
  return 3
}

function estimatedMinutes(index: number): number {
  return 2 + (index % 3)
}

type QbankPagedListProps = {
  loadingBank: boolean
  totalFiltered: number
  filtered: QuestionBankRow[]
  selectedArea: string
  openRow: (row: QuestionBankRow) => void
  statusByQuestionId: ReadonlyMap<string, QuestionAnswerOutcome>
  loadingAnswerStatus: boolean
}

function QbankPagedList({
  loadingBank,
  totalFiltered,
  filtered,
  selectedArea,
  openRow,
  statusByQuestionId,
  loadingAnswerStatus,
}: QbankPagedListProps) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(() => {
    const p0 = safePage - 1
    return filtered.slice(p0 * PAGE_SIZE, p0 * PAGE_SIZE + PAGE_SIZE)
  }, [filtered, safePage])

  const pageNumbers = useMemo(() => {
    const total = pageCount
    const cur = safePage
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | '…')[]
    const uniq = new Set([1, total, cur, cur - 1, cur + 1])
    const sorted = [...uniq].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
    const out: (number | '…')[] = []
    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i]!
      if (i > 0 && n - sorted[i - 1]! > 1) out.push('…')
      out.push(n)
    }
    return out
  }, [pageCount, safePage])

  if (loadingBank) {
    return (
      <div className="broto-qbank-skeletons" style={{ marginTop: 12 }}>
        <div className="broto-skeleton broto-qbank-skel-card" />
        <div className="broto-skeleton broto-qbank-skel-card" />
      </div>
    )
  }

  if (totalFiltered === 0) {
    return (
      <div className="broto-qbank-empty">
        <div className="broto-qbank-empty-icon" aria-hidden>
          🔍
        </div>
        <h3 className="broto-qbank-empty-title">Nenhuma questão encontrada</h3>
        <p className="broto-qbank-empty-desc">
          Ajuste os filtros ou a busca por palavra-chave para ver mais resultados.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="broto-qbank-list">
        {pageRows.map((row) => {
          const dots = difficultyDotsActive(row.difficulty)
          const topicColor = getAreaColor(selectedArea)
          const qid = getQuestionId(row)
          const outcome = statusByQuestionId.get(qid)
          return (
            <li key={`${row.year}-${row.index}-${row.language ?? 'p'}`}>
              <button type="button" className="broto-qbank-card" onClick={() => openRow(row)}>
                <div className="broto-qbank-card-top">
                  <div className="broto-qbank-card-badges">
                    <span className="broto-qbank-badge broto-qbank-badge-year">
                      ENEM {row.year}
                    </span>
                    <span
                      className="broto-qbank-badge broto-qbank-badge-topic"
                      style={{
                        color: topicColor,
                        borderColor: `${topicColor}22`,
                        background: `${topicColor}0e`,
                      }}
                    >
                      {row.topicoLabel}
                    </span>
                    {row.isNova ? (
                      <span className="broto-qbank-badge broto-qbank-badge-new">Nova</span>
                    ) : null}
                    {row.language ? (
                      <span className="broto-qbank-badge broto-qbank-badge-year">
                        {row.language}
                      </span>
                    ) : null}
                    <QuestionBankAnswerStatusBadge
                      outcome={outcome}
                      loading={loadingAnswerStatus}
                    />
                  </div>
                  <span className="broto-qbank-card-id">
                    {formatQuestionBankId(selectedArea, row.year, row.index)}
                  </span>
                </div>
                <p className="broto-qbank-card-title">
                  Questão {row.index} — ENEM {row.year}
                </p>
                <p className="broto-qbank-card-preview">{row.preview}</p>
                <div className="broto-qbank-card-bottom">
                  <div className="broto-qbank-card-meta">
                    <span className="broto-qbank-meta-item">
                      <Clock size={12} aria-hidden />~{estimatedMinutes(row.index)} min
                    </span>
                    <span className="broto-qbank-meta-item">
                      Dificuldade
                      <span className="broto-qbank-diff-dots" aria-hidden>
                        <span
                          className={`broto-qbank-diff-dot${dots >= 1 ? ' broto-qbank-diff-dot--on' : ''}`}
                        />
                        <span
                          className={`broto-qbank-diff-dot${dots >= 2 ? ' broto-qbank-diff-dot--on' : ''}`}
                        />
                        <span
                          className={`broto-qbank-diff-dot${dots >= 3 ? ' broto-qbank-diff-dot--on' : ''}`}
                        />
                      </span>
                    </span>
                  </div>
                  <span className="broto-qbank-card-action">
                    Resolver
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {totalFiltered > PAGE_SIZE ? (
        <nav className="broto-qbank-pagination" aria-label="Paginação">
          <button
            type="button"
            className="broto-qbank-page-btn broto-qbank-page-btn--nav"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>
          {pageNumbers.map((item, idx) =>
            item === '…' ? (
              <span key={`e-${idx}`} className="broto-qbank-page-dots" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`broto-qbank-page-btn${item === safePage ? ' broto-qbank-page-btn--active' : ''}`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="broto-qbank-page-btn broto-qbank-page-btn--nav"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Próxima página"
          >
            <ChevronRight size={14} />
          </button>
        </nav>
      ) : null}
    </>
  )
}

type QbankExploreFiltersAndListProps = {
  searchInput: string
  setSearchInput: (v: string) => void
  yearOptions: { year: number }[]
  selectedYear: string
  setSelectedYear: (v: string) => void
  topicos: ReturnType<typeof useQuestionsFilters>['topicos']
  selectedTopico: string
  setSelectedTopico: (v: string) => void
  isLanguageFilterEnabled: boolean
  selectedLanguage: string
  setSelectedLanguage: (v: string) => void
  difficulty: '' | 'facil' | 'medio' | 'dificil'
  setDifficulty: (v: '' | 'facil' | 'medio' | 'dificil') => void
  isLinguagensArea: boolean
  hasFilterChips: boolean
  clearYear: () => void
  clearTopico: () => void
  clearLanguage: () => void
  totalFiltered: number
  areaLabel: string
  sortRecent: boolean
  setSortRecent: (v: boolean | ((b: boolean) => boolean)) => void
  listResetKey: string
  loadingBank: boolean
  filtered: QuestionBankRow[]
  selectedArea: string
  openRow: (row: QuestionBankRow) => void
  statusByQuestionId: ReadonlyMap<string, QuestionAnswerOutcome>
  loadingAnswerStatus: boolean
}

function QbankExploreFiltersAndList(props: QbankExploreFiltersAndListProps) {
  const {
    searchInput,
    setSearchInput,
    yearOptions,
    selectedYear,
    setSelectedYear,
    topicos,
    selectedTopico,
    setSelectedTopico,
    isLanguageFilterEnabled,
    selectedLanguage,
    setSelectedLanguage,
    difficulty,
    setDifficulty,
    isLinguagensArea,
    hasFilterChips,
    clearYear,
    clearTopico,
    clearLanguage,
    totalFiltered,
    areaLabel,
    sortRecent,
    setSortRecent,
    listResetKey,
    loadingBank,
    filtered,
    selectedArea,
    openRow,
    statusByQuestionId,
    loadingAnswerStatus,
  } = props

  return (
    <>
      <div className="broto-qbank-filter-bar">
        <div className="broto-qbank-search-wrap">
          <Search size={16} className="broto-qbank-search-icon" aria-hidden />
          <input
            className="broto-qbank-search-input"
            type="search"
            placeholder="Buscar por palavra-chave na questão..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />
        </div>
        <span className="broto-qbank-filter-sep" aria-hidden />
        <select
          className="broto-qbank-filter-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          aria-label="Filtrar por ano"
        >
          <option value="">Ano — Todos</option>
          {yearOptions.map((ex) => (
            <option key={ex.year} value={String(ex.year)}>
              {ex.year}
            </option>
          ))}
        </select>
        <select
          className="broto-qbank-filter-select"
          value={selectedTopico}
          onChange={(e) => setSelectedTopico(e.target.value)}
          aria-label="Filtrar por tópico"
          disabled={topicos.length === 0}
        >
          <option value="">Tópico — Todos</option>
          {topicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {isLanguageFilterEnabled ? (
          <select
            className="broto-qbank-filter-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            aria-label="Idioma"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label === 'Todos os idiomas' ? 'Idioma — Todos' : opt.label}
              </option>
            ))}
          </select>
        ) : null}
        <select
          className="broto-qbank-filter-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as '' | 'facil' | 'medio' | 'dificil')}
          aria-label="Dificuldade"
        >
          <option value="">Dificuldade — Todas</option>
          <option value="facil">Fácil</option>
          <option value="medio">Médio</option>
          <option value="dificil">Difícil</option>
        </select>
      </div>

      {hasFilterChips ? (
        <div className="broto-qbank-filter-chips">
          {selectedYear ? (
            <button type="button" className="broto-qbank-filter-chip" onClick={clearYear}>
              Ano {selectedYear}
              <span className="broto-qbank-chip-x" aria-hidden>
                ×
              </span>
            </button>
          ) : null}
          {selectedTopico ? (
            <button type="button" className="broto-qbank-filter-chip" onClick={clearTopico}>
              {topicos.find((t) => t.id === selectedTopico)?.label ?? 'Tópico'}
              <span className="broto-qbank-chip-x" aria-hidden>
                ×
              </span>
            </button>
          ) : null}
          {isLinguagensArea && selectedTopico === IDIOMAS_TOPIC_ID && selectedLanguage ? (
            <button type="button" className="broto-qbank-filter-chip" onClick={clearLanguage}>
              {LANGUAGE_OPTIONS.find((o) => o.value === selectedLanguage)?.label}
              <span className="broto-qbank-chip-x" aria-hidden>
                ×
              </span>
            </button>
          ) : null}
          {difficulty ? (
            <button
              type="button"
              className="broto-qbank-filter-chip"
              onClick={() => setDifficulty('')}
            >
              {difficulty === 'facil' ? 'Fácil' : difficulty === 'medio' ? 'Médio' : 'Difícil'}
              <span className="broto-qbank-chip-x" aria-hidden>
                ×
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="broto-qbank-list-head">
        <p className="broto-qbank-count">
          Exibindo <strong>{totalFiltered.toLocaleString('pt-BR')}</strong> questões de {areaLabel}
        </p>
        <button type="button" className="broto-qbank-sort" onClick={() => setSortRecent((v) => !v)}>
          <SlidersHorizontal size={12} aria-hidden />
          {sortRecent ? 'Mais recentes' : 'Mais antigas'}
        </button>
      </div>

      <QbankPagedList
        key={listResetKey}
        loadingBank={loadingBank}
        totalFiltered={totalFiltered}
        filtered={filtered}
        selectedArea={selectedArea}
        openRow={openRow}
        statusByQuestionId={statusByQuestionId}
        loadingAnswerStatus={loadingAnswerStatus}
      />
    </>
  )
}

export type QuestionBankViewProps = {
  /** Lista só com filtros + questões (rota `/study/:area/banco`). Requer `preferredArea`. */
  bankCatalogOnly?: boolean
  initialFilters?: QuestionBankInitialFilters
  /** When true, area tabs are hidden and area comes from `preferredArea`. */
  embedded?: boolean
  /** Lista de tópicos da área (hub) para o formato menu + lista vertical no modo embutido. */
  guidedTopics?: TopicOption[]
  /** Inicia pacote guiado ao escolher um tópico no painel (com `guidedTopics`). */
  onSelectGuidedTopic?: (topic: TopicOption) => void
  /** ENEM area slug; required when `embedded` is true. */
  preferredArea?: string
  onBackToHub?: () => void
  /**
   * Quando definido (ex.: hub do banco dentro de Estudo), o CTA “Continuar” do foco abre o pacote
   * guiado do tópico da sugestão em vez de abrir a questão em linha.
   * `practiceRows` são questões reais do catálogo para a aba “Questões” persistirem respostas.
   */
  onOpenStudyPackageForRow?: (row: QuestionBankRow, practiceRows: QuestionBankRow[]) => void
}

export function QuestionBankView({
  bankCatalogOnly = false,
  initialFilters,
  embedded = false,
  guidedTopics,
  onSelectGuidedTopic,
  preferredArea,
  onBackToHub,
  onOpenStudyPackageForRow,
}: QuestionBankViewProps) {
  const navigate = useNavigate()
  const initialTopicValues = useMemo(
    () => initialFilters?.topicValues?.filter(Boolean) ?? [],
    [initialFilters?.topicValues],
  )
  const {
    areas,
    topicos,
    exams,
    loading,
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
  } = useQuestionsFilters({
    enableQuestionFetch: false,
    preferredArea: embedded || bankCatalogOnly ? (preferredArea ?? null) : undefined,
    autoSelectFirstArea: !embedded && !bankCatalogOnly,
    initialYear: initialFilters?.year ?? '',
    initialTopico: initialTopicValues.length > 0 ? '' : (initialFilters?.topic ?? ''),
    initialLanguage: initialFilters?.language ?? '',
  })

  const { progress, loading: loadingProgress } = useProgress()
  const { pet } = usePet()
  const { mistakes: recentMistakes, loading: loadingRecentMistakes } = useRecentMistakes()

  const [searchInput, setSearchInput] = useState(initialFilters?.search ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters?.search ?? '')
  const [difficulty, setDifficulty] = useState<'' | 'facil' | 'medio' | 'dificil'>(
    initialFilters?.difficulty ?? '',
  )
  const [sortRecent, setSortRecent] = useState(initialFilters?.sortRecent ?? false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const exploreSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 320)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const catalogReady = !loading && exams.length > 0 && Boolean(selectedArea)

  const {
    loading: loadingBank,
    allInArea,
    filtered,
    totalInArea,
    totalFiltered,
    topicSummaries,
  } = useQuestionBank({
    selectedArea,
    selectedYear,
    selectedTopico,
    selectedTopicValues: initialTopicValues.length > 0 ? initialTopicValues : undefined,
    selectedLanguage,
    topicos,
    exams,
    search: debouncedSearch,
    difficultyFilter: difficulty,
    sortRecent,
    catalogReady,
  })

  const { statusByQuestionId, loading: loadingAnswerStatus } = useQuestionBankAnswerStatus(
    filtered,
    0,
  )

  const areaStat = useMemo(
    () => progress?.areas.find((a) => a.value === selectedArea),
    [progress?.areas, selectedArea],
  )

  const answered = areaStat?.totalAnswered ?? 0
  const correct = areaStat?.totalCorrect ?? 0
  const errors =
    areaStat && areaStat.totalAnswered > areaStat.totalCorrect
      ? areaStat.totalAnswered - areaStat.totalCorrect
      : 0
  const pendingApprox = Math.max(0, totalInArea - answered)

  const listResetKey = useMemo(
    () =>
      [
        selectedArea,
        selectedYear,
        selectedTopico,
        selectedLanguage,
        debouncedSearch,
        difficulty,
        String(sortRecent),
      ].join('|'),
    [
      selectedArea,
      selectedYear,
      selectedTopico,
      selectedLanguage,
      debouncedSearch,
      difficulty,
      sortRecent,
    ],
  )

  const areaLabel = areas.find((a) => a.value === selectedArea)?.label ?? 'Área'

  const yearOptions = useMemo(() => [...exams].sort((a, b) => b.year - a.year), [exams])

  const priorityResult = useQuestionBankPriority({
    areaKey: selectedArea,
    areaLabel,
    allInArea,
    areaStat,
    mistakes: recentMistakes,
    catalogLoading: loadingBank,
    mistakesLoading: loadingRecentMistakes,
  })

  const topicCarouselItems = useMemo(() => {
    return topicSummaries.slice(0, 20).map((t) => {
      const stat = areaStat?.topicos.find((s) => s.value === t.value)
      const done = stat?.totalAnswered ?? 0
      const pct = t.count > 0 ? Math.min(100, Math.round((done / t.count) * 100)) : 0
      return { value: t.value, label: t.label, count: t.count, progressPct: pct }
    })
  }, [topicSummaries, areaStat?.topicos])

  const pctCatalogAnswered =
    totalInArea > 0 ? Math.min(100, Math.round((answered / totalInArea) * 100)) : 0

  const handleAreaChange = useCallback(
    (area: string) => {
      setSelectedArea(area)
      setSelectedTopico('')
      setSelectedLanguage('')
    },
    [setSelectedArea, setSelectedTopico, setSelectedLanguage],
  )

  const clearYear = useCallback(() => setSelectedYear(''), [setSelectedYear])
  const clearTopico = useCallback(() => setSelectedTopico(''), [setSelectedTopico])
  const clearLanguage = useCallback(() => setSelectedLanguage(''), [setSelectedLanguage])

  const openRow = useCallback(
    (row: QuestionBankRow) => {
      const params = new URLSearchParams()
      if (selectedYear) params.set('year', selectedYear)
      if (selectedTopico) params.set('topic', selectedTopico)
      if (selectedLanguage) params.set('lang', selectedLanguage)
      if (difficulty) params.set('difficulty', difficulty)
      if (searchInput.trim()) params.set('q', searchInput.trim())
      if (sortRecent) params.set('sort', 'recent')

      const qs = params.toString()
      const questionId = encodeURIComponent(getQuestionId(row))
      navigate(`/study/${selectedArea}/banco/${questionId}${qs ? `?${qs}` : ''}`)
    },
    [
      difficulty,
      navigate,
      searchInput,
      selectedArea,
      selectedLanguage,
      selectedTopico,
      selectedYear,
      sortRecent,
    ],
  )

  const handleStartPrimary = useCallback(() => {
    const primary = priorityResult?.primary
    const row = primary?.targetRow
    if (!row || !priorityResult) return
    if (onOpenStudyPackageForRow && row.topicoValue) {
      const practiceRows = buildGuidedPracticeRowsForPrimary(
        primary,
        priorityResult,
        allInArea,
        GUIDED_PRACTICE_MAX,
      )
      onOpenStudyPackageForRow(row, practiceRows)
      return
    }
    openRow(row)
  }, [priorityResult, onOpenStudyPackageForRow, openRow, allInArea])

  const hasFilterChips =
    Boolean(selectedYear) ||
    Boolean(selectedTopico) ||
    (isLinguagensArea && selectedTopico === IDIOMAS_TOPIC_ID && Boolean(selectedLanguage)) ||
    Boolean(difficulty)

  const selectedTopicoCatalog = useMemo(() => {
    if (!selectedTopico) return null
    return topicos.find((t) => t.id === selectedTopico) ?? null
  }, [selectedTopico, topicos])

  const [simuladoModalOpen, setSimuladoModalOpen] = useState(false)

  useEffect(() => {
    if (!simuladoModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSimuladoModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [simuladoModalOpen])

  const useGuidedTopicPanel =
    embedded &&
    !bankCatalogOnly &&
    Array.isArray(guidedTopics) &&
    guidedTopics.length > 0 &&
    typeof onSelectGuidedTopic === 'function'

  const heroCompact = embedded || bankCatalogOnly
  const qbankListProps = {
    searchInput,
    setSearchInput,
    yearOptions,
    selectedYear,
    setSelectedYear,
    topicos,
    selectedTopico,
    setSelectedTopico,
    isLanguageFilterEnabled,
    selectedLanguage,
    setSelectedLanguage,
    difficulty,
    setDifficulty,
    isLinguagensArea,
    hasFilterChips,
    clearYear,
    clearTopico,
    clearLanguage,
    totalFiltered,
    areaLabel,
    sortRecent,
    setSortRecent,
    listResetKey,
    loadingBank,
    filtered,
    selectedArea,
    openRow,
    statusByQuestionId,
    loadingAnswerStatus,
  }

  useEffect(() => {
    if (!exploreOpen || !useGuidedTopicPanel) return
    const id = window.requestAnimationFrame(() => {
      exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [exploreOpen, useGuidedTopicPanel])

  const pageStyle = {
    '--broto-qbank-area-accent': getAreaColor(selectedArea),
  } as CSSProperties

  return (
    <div
      className={`broto-qbank-page${embedded || bankCatalogOnly ? ' broto-qbank-page--embedded' : ''}${bankCatalogOnly ? ' broto-qbank-page--catalog-only' : ''}`}
      style={pageStyle}
    >
      <div className="broto-qbank-shell">
        <div className="broto-qbank-inner">
          {(embedded || bankCatalogOnly) && onBackToHub ? (
            <button type="button" className="broto-qbank-embedded-back" onClick={onBackToHub}>
              <ArrowLeft size={14} aria-hidden />
              {bankCatalogOnly ? 'Voltar à área' : 'Outras áreas'}
            </button>
          ) : null}

          {loading ? (
            <div className="broto-qbank-skeletons">
              <div className="broto-skeleton broto-qbank-skel-line" />
              <div className="broto-skeleton broto-qbank-skel-line broto-qbank-skel-line--short" />
            </div>
          ) : (
            <>
              {!embedded && !bankCatalogOnly ? (
                <div className="broto-qbank-area-tabs" role="tablist" aria-label="Áreas do ENEM">
                  {areas.map((area) => {
                    const active = selectedArea === area.value
                    const key = getAreaTabKey(area.value)
                    return (
                      <button
                        key={area.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`broto-qbank-area-tab broto-qbank-area-tab--${key}${active ? ' broto-qbank-area-tab--active' : ''}`}
                        data-a={key}
                        onClick={() => handleAreaChange(area.value)}
                      >
                        <span className="broto-qbank-tab-dot" aria-hidden />
                        {area.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}

              {error ? (
                <div className="broto-error-banner broto-qbank-banner">
                  <span>{error}</span>
                  <button type="button" onClick={retry}>
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              <section
                className={`broto-qbank-hero-band${heroCompact ? ' broto-qbank-hero-band--embedded' : ''}`}
              >
                <div className="broto-qbank-hero-band__head">
                  <div className="broto-qbank-hero-band__text">
                    {bankCatalogOnly ? (
                      <>
                        <h2 className="broto-qbank-hero-band__title broto-qbank-hero-band__title--compact">
                          Banco de questões — <em>{areaLabel}</em>
                        </h2>
                        <p className="broto-qbank-hero-band__desc broto-qbank-hero-band__desc--below-head">
                          Filtros e lista completa do catálogo nesta área.
                        </p>
                      </>
                    ) : embedded ? (
                      <h2 className="broto-qbank-hero-band__title broto-qbank-hero-band__title--compact">
                        Prática guiada — <em>{areaLabel}</em>
                      </h2>
                    ) : (
                      <h2 className="broto-qbank-hero-band__title">
                        {AREA_HERO[selectedArea]?.kicker ?? areaLabel}
                      </h2>
                    )}
                    {embedded && !bankCatalogOnly ? (
                      <p className="broto-qbank-hero-band__desc broto-qbank-hero-band__desc--below-head">
                        O Broto sugere por onde começar. Explora o catálogo completo só quando
                        quiser.
                      </p>
                    ) : null}
                  </div>
                  <div className="broto-qbank-kpi-strip broto-qbank-kpi-strip--head" role="list">
                    <div className="broto-qbank-kpi broto-qbank-kpi--head" role="listitem">
                      <span className="broto-qbank-kpi__val broto-qbank-kpi__val--hero-primary">
                        {loadingBank || loadingProgress ? '…' : totalInArea.toLocaleString('pt-BR')}
                      </span>
                      <span className="broto-qbank-kpi__label">Questões</span>
                    </div>
                    <div className="broto-qbank-kpi broto-qbank-kpi--head" role="listitem">
                      <span className="broto-qbank-kpi__val broto-qbank-kpi__val--hero-sky">
                        {loadingProgress ? '…' : totalInArea > 0 ? `${pctCatalogAnswered}%` : '—'}
                      </span>
                      <span className="broto-qbank-kpi__label">Progresso</span>
                    </div>
                    <div className="broto-qbank-kpi broto-qbank-kpi--head" role="listitem">
                      <span className="broto-qbank-kpi__val broto-qbank-kpi__val--hero-gold">
                        {loadingProgress
                          ? '…'
                          : areaStat && areaStat.totalAnswered > 0
                            ? `~${areaStat.accuracyPct}%`
                            : '—'}
                      </span>
                      <span className="broto-qbank-kpi__label">Acerto</span>
                    </div>
                  </div>
                </div>
                {!embedded && !bankCatalogOnly ? (
                  <p className="broto-qbank-hero-band__desc">
                    {AREA_HERO[selectedArea]?.blurb ??
                      'Pratica com sugestões por prioridade e explora o catálogo quando quiser.'}
                  </p>
                ) : null}
              </section>

              {bankCatalogOnly ? (
                <div className="broto-qbank-start-with-performance broto-qbank-start-with-performance--catalog-only">
                  <div className="broto-qbank-start-with-performance__main">
                    <div className="broto-qbank-layout">
                      <div className="broto-qbank-main-stack">
                        <section
                          className="broto-qbank-explore broto-qbank-explore--catalog-page"
                          aria-labelledby="broto-qbank-catalog-heading"
                        >
                          <h2 id="broto-qbank-catalog-heading" className="broto-sr-only">
                            Lista de questões com filtros
                          </h2>
                          <div className="broto-qbank-explore-body">
                            <QbankExploreFiltersAndList {...qbankListProps} />
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="broto-qbank-start-with-performance">
                  <div className="broto-qbank-start-with-performance__main">
                    {SHOW_START_PATHS_GRID &&
                      (priorityResult ? (
                        <StartPathsGrid
                          tracks={priorityResult.tracks}
                          onOpenRow={openRow}
                          onExpandExplore={() => setExploreOpen(true)}
                        />
                      ) : (
                        <div className="broto-qbank-skeletons" aria-hidden>
                          <div className="broto-skeleton broto-qbank-skel-card" />
                          <div className="broto-skeleton broto-qbank-skel-card" />
                        </div>
                      ))}

                    {useGuidedTopicPanel ? (
                      <div className="broto-qbank-focus-banco-stack">
                        <QuestionBankFocusBand
                          primary={priorityResult?.primary ?? null}
                          loading={loadingBank || loadingRecentMistakes}
                          onStart={handleStartPrimary}
                          areaAccent={getAreaColor(selectedArea)}
                          selectedArea={selectedArea}
                          areaLabel={areaLabel}
                          areas={progress?.areas}
                          studyTodayByArea={pet?.studyTodayByArea}
                        />
                        <div className="broto-qbank-focus-banco-row">
                          <StudyAreaBankCard
                            areaKey={selectedArea}
                            onBankClick={() => navigate(`/study/${selectedArea}/banco`)}
                            className="broto-qbank-focus-banco-row__bank"
                          />
                          <StudyAreaSessionCard
                            areaKey={selectedArea}
                            className="broto-qbank-focus-banco-row__session"
                          />
                        </div>
                      </div>
                    ) : (
                      <QuestionBankFocusBand
                        primary={priorityResult?.primary ?? null}
                        loading={loadingBank || loadingRecentMistakes}
                        onStart={handleStartPrimary}
                        areaAccent={getAreaColor(selectedArea)}
                        selectedArea={selectedArea}
                        areaLabel={areaLabel}
                        areas={progress?.areas}
                        studyTodayByArea={pet?.studyTodayByArea}
                      />
                    )}

                    {embedded && selectedTopicoCatalog?.value ? (
                      <div style={{ marginTop: 14 }}>
                        <StudyPackageSimuladoSessionCard
                          areaKey={selectedArea}
                          topicoValue={selectedTopicoCatalog.value}
                          topicoLabel={selectedTopicoCatalog.label}
                          areaColor={getAreaColor(selectedArea)}
                          onOpenModal={() => setSimuladoModalOpen(true)}
                        />
                      </div>
                    ) : null}

                    {!embedded ? (
                      <Link
                        className="broto-qbank-destaque broto-qbank-destaque--link"
                        to="/study/mock-exam"
                        aria-labelledby="broto-qbank-destaque-mock-title"
                      >
                        <div className="broto-qbank-destaque__icon" aria-hidden>
                          <Brain size={22} strokeWidth={1.75} />
                        </div>
                        <div className="broto-qbank-destaque__main">
                          <h3
                            id="broto-qbank-destaque-mock-title"
                            className="broto-qbank-destaque__title"
                          >
                            Sessão ENEM
                          </h3>
                          <p className="broto-qbank-destaque__desc">
                            Monte um bloco no <strong>estilo de um simulado</strong>: várias
                            questões em sequência, com correção e resumo ao final. Você define
                            quantidade, anos, áreas e tópicos — ou usa o modo aleatório — sem
                            precisar cobrir as 90 questões da prova inteira.
                          </p>
                        </div>
                        <ChevronRight
                          className="broto-qbank-destaque__chev"
                          size={22}
                          strokeWidth={2}
                          aria-hidden
                        />
                      </Link>
                    ) : null}

                    <div className="broto-qbank-layout">
                      <div className="broto-qbank-main-stack">
                        {useGuidedTopicPanel ? (
                          <>
                            <StudyAreaTopicsPanel
                              areaKey={selectedArea}
                              topics={guidedTopics}
                              compactTop
                              showAiRecommendation={false}
                              showBankInSidebar={false}
                              onStartTopic={(_ak, topic) => {
                                onSelectGuidedTopic!(topic)
                              }}
                              onBankClick={() => navigate(`/study/${selectedArea}/banco`)}
                            />
                            {exploreOpen ? (
                              <section
                                ref={exploreSectionRef}
                                className="broto-qbank-explore broto-qbank-explore--guided-inline"
                                aria-labelledby="broto-qbank-explore-guided-title"
                              >
                                <div className="broto-qbank-explore-guided-head">
                                  <div>
                                    <h2
                                      id="broto-qbank-explore-guided-title"
                                      className="broto-qbank-explore-guided-title"
                                    >
                                      Explorar o banco — filtros e lista completa
                                    </h2>
                                    <p className="broto-qbank-explore-hint broto-qbank-explore-hint--block">
                                      Opcional · para quem quer pesquisar
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="broto-btn-ghost broto-qbank-explore-collapse"
                                    onClick={() => setExploreOpen(false)}
                                  >
                                    Recolher
                                  </button>
                                </div>
                                <div className="broto-qbank-explore-body">
                                  <QbankExploreFiltersAndList
                                    searchInput={searchInput}
                                    setSearchInput={setSearchInput}
                                    yearOptions={yearOptions}
                                    selectedYear={selectedYear}
                                    setSelectedYear={setSelectedYear}
                                    topicos={topicos}
                                    selectedTopico={selectedTopico}
                                    setSelectedTopico={setSelectedTopico}
                                    isLanguageFilterEnabled={isLanguageFilterEnabled}
                                    selectedLanguage={selectedLanguage}
                                    setSelectedLanguage={setSelectedLanguage}
                                    difficulty={difficulty}
                                    setDifficulty={setDifficulty}
                                    isLinguagensArea={isLinguagensArea}
                                    hasFilterChips={hasFilterChips}
                                    clearYear={clearYear}
                                    clearTopico={clearTopico}
                                    clearLanguage={clearLanguage}
                                    totalFiltered={totalFiltered}
                                    areaLabel={areaLabel}
                                    sortRecent={sortRecent}
                                    setSortRecent={setSortRecent}
                                    listResetKey={listResetKey}
                                    loadingBank={loadingBank}
                                    filtered={filtered}
                                    selectedArea={selectedArea}
                                    openRow={openRow}
                                    statusByQuestionId={statusByQuestionId}
                                    loadingAnswerStatus={loadingAnswerStatus}
                                  />
                                </div>
                              </section>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <TopicCarouselSection
                              items={topicCarouselItems}
                              loading={loadingBank}
                              onSelect={(value) => {
                                const id = topicos.find((x) => x.value === value)?.id
                                if (id) {
                                  setSelectedTopico(id)
                                  setExploreOpen(true)
                                }
                              }}
                            />

                            <details
                              className="broto-qbank-explore"
                              open={exploreOpen}
                              onToggle={(e) =>
                                setExploreOpen((e.target as HTMLDetailsElement).open)
                              }
                            >
                              <summary className="broto-qbank-explore-summary">
                                Explorar o banco — filtros e lista completa
                                <span className="broto-qbank-explore-hint">
                                  Opcional · para quem quer pesquisar
                                </span>
                              </summary>
                              <div className="broto-qbank-explore-body">
                                <QbankExploreFiltersAndList
                                  searchInput={searchInput}
                                  setSearchInput={setSearchInput}
                                  yearOptions={yearOptions}
                                  selectedYear={selectedYear}
                                  setSelectedYear={setSelectedYear}
                                  topicos={topicos}
                                  selectedTopico={selectedTopico}
                                  setSelectedTopico={setSelectedTopico}
                                  isLanguageFilterEnabled={isLanguageFilterEnabled}
                                  selectedLanguage={selectedLanguage}
                                  setSelectedLanguage={setSelectedLanguage}
                                  difficulty={difficulty}
                                  setDifficulty={setDifficulty}
                                  isLinguagensArea={isLinguagensArea}
                                  hasFilterChips={hasFilterChips}
                                  clearYear={clearYear}
                                  clearTopico={clearTopico}
                                  clearLanguage={clearLanguage}
                                  totalFiltered={totalFiltered}
                                  areaLabel={areaLabel}
                                  sortRecent={sortRecent}
                                  setSortRecent={setSortRecent}
                                  listResetKey={listResetKey}
                                  loadingBank={loadingBank}
                                  filtered={filtered}
                                  selectedArea={selectedArea}
                                  openRow={openRow}
                                  statusByQuestionId={statusByQuestionId}
                                  loadingAnswerStatus={loadingAnswerStatus}
                                />
                              </div>
                            </details>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="broto-qbank-start-with-performance__rail">
                    <PerformanceDonutCard
                      accuracyPct={areaStat?.accuracyPct ?? 0}
                      totalAnswered={areaStat?.totalAnswered ?? 0}
                      totalInArea={totalInArea}
                      loading={loadingProgress || loadingBank}
                      correct={correct}
                      errors={errors}
                      pendingApprox={pendingApprox}
                    />
                    <WeakTopicsAside topicos={areaStat?.topicos} loading={loadingProgress} />
                    <div className="broto-qbank-side-card">
                      <h3 className="broto-qbank-side-title">Resumo nesta área</h3>
                      <ul className="broto-qbank-breakdown">
                        <li className="broto-qbank-bk-row">
                          <span className="broto-qbank-bk-dot broto-qbank-bk-dot--teal" />
                          <span className="broto-qbank-bk-label">Prática</span>
                          <span className="broto-qbank-bk-val">
                            {loadingProgress
                              ? '…'
                              : answered > 0
                                ? `${answered} questões feitas`
                                : 'Ainda não iniciaste'}
                          </span>
                        </li>
                        <li className="broto-qbank-bk-row">
                          <span className="broto-qbank-bk-dot broto-qbank-bk-dot--lime" />
                          <span className="broto-qbank-bk-label">Acertos</span>
                          <span className="broto-qbank-bk-val">
                            {loadingProgress
                              ? '…'
                              : areaStat && areaStat.totalAnswered > 0
                                ? `${correct} certas`
                                : '—'}
                          </span>
                        </li>
                        <li className="broto-qbank-bk-row">
                          <span className="broto-qbank-bk-dot broto-qbank-bk-dot--coral" />
                          <span className="broto-qbank-bk-label">A corrigir</span>
                          <span className="broto-qbank-bk-val">
                            {loadingProgress
                              ? '…'
                              : areaStat && areaStat.totalAnswered > 0
                                ? errors > 0
                                  ? `${errors} para rever`
                                  : 'Nada pendente'
                                : '—'}
                          </span>
                        </li>
                        <li className="broto-qbank-bk-row">
                          <span className="broto-qbank-bk-dot broto-qbank-bk-dot--muted" />
                          <span className="broto-qbank-bk-label">Catálogo</span>
                          <span className="broto-qbank-bk-val">
                            {loadingBank ? '…' : `${pendingApprox} sem fazer (aprox.)`}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {simuladoModalOpen && embedded && selectedTopicoCatalog?.value ? (
        <div
          role="presentation"
          className="broto-study-simulado-modal-backdrop"
          onClick={() => setSimuladoModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qbank-simulado-modal-title"
            className="broto-study-simulado-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="qbank-simulado-modal-title" className="broto-sr-only">
              Configurar sessão ENEM (estilo simulado)
            </h2>
            <MockExamConfigurator
              variant="modal"
              presetArea={selectedArea}
              presetTopicoValue={selectedTopicoCatalog.value}
              presetTopicoLabelHint={selectedTopicoCatalog.label}
              onClose={() => setSimuladoModalOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
