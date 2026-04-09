import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import {
  IDIOMAS_TOPIC_ID,
  LANGUAGE_OPTIONS,
  useQuestionsFilters,
} from '@/hooks/useQuestionsFilters'
import {
  fetchQuestionDetailForBank,
  formatQuestionBankId,
  useQuestionBank,
  type QuestionBankRow,
} from '@/hooks/useQuestionBank'
import type { Question } from '@broto/shared'
import { getQuestionId } from '@broto/shared'
import { getAreaColor } from '@/lib/area-config'
import { useProgress } from '@/hooks/useProgress'
import { Link } from 'react-router-dom'
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
}

function QbankPagedList({
  loadingBank,
  totalFiltered,
  filtered,
  selectedArea,
  openRow,
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
          return (
            <li key={`${row.year}-${row.index}-${row.language ?? 'p'}`}>
              <button type="button" className="broto-qbank-card" onClick={() => openRow(row)}>
                <div className="broto-qbank-card-top">
                  <div className="broto-qbank-card-badges">
                    <span className="broto-qbank-badge broto-qbank-badge-year">ENEM {row.year}</span>
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
                      <span className="broto-qbank-badge broto-qbank-badge-year">{row.language}</span>
                    ) : null}
                  </div>
                  <span className="broto-qbank-card-id">
                    {formatQuestionBankId(selectedArea, row.year, row.index)}
                  </span>
                </div>
                <p className="broto-qbank-card-preview">{row.preview}</p>
                <div className="broto-qbank-card-bottom">
                  <div className="broto-qbank-card-meta">
                    <span className="broto-qbank-meta-item">
                      <Clock size={12} aria-hidden />
                      ~{estimatedMinutes(row.index)} min
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

export type QuestionBankViewProps = {
  /** When true, area tabs are hidden and area comes from `preferredArea`. */
  embedded?: boolean
  /** ENEM area slug; required when `embedded` is true. */
  preferredArea?: string
  onBackToHub?: () => void
}

export function QuestionBankView({
  embedded = false,
  preferredArea,
  onBackToHub,
}: QuestionBankViewProps) {
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
    preferredArea: embedded ? preferredArea ?? null : undefined,
    autoSelectFirstArea: !embedded,
  })

  const { progress, loading: loadingProgress } = useProgress()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [difficulty, setDifficulty] = useState<'' | 'facil' | 'medio' | 'dificil'>('')
  const [sortRecent, setSortRecent] = useState(true)

  const [activeRow, setActiveRow] = useState<QuestionBankRow | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const questionFetchGen = useRef(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 320)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const catalogReady = !loading && exams.length > 0 && Boolean(selectedArea)

  const {
    baseUrl,
    loading: loadingBank,
    filtered,
    totalInArea,
    totalFiltered,
    yearHistogram,
    topicSummaries,
  } = useQuestionBank({
    selectedArea,
    selectedYear,
    selectedTopico,
    selectedLanguage,
    topicos,
    exams,
    search: debouncedSearch,
    difficultyFilter: difficulty,
    sortRecent,
    catalogReady,
  })

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
  const accuracyLabel =
    areaStat && areaStat.totalAnswered > 0 ? `${areaStat.accuracyPct}%` : '—'
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

  const miniBarYears = useMemo(() => {
    const ys = Object.keys(yearHistogram)
      .map(Number)
      .filter((y) => (yearHistogram[y] ?? 0) > 0)
      .sort((a, b) => a - b)
    return ys.length > 0 ? ys : yearOptions.map((e) => e.year).slice(0, 5)
  }, [yearHistogram, yearOptions])

  const maxBar = useMemo(() => {
    let m = 1
    for (const y of miniBarYears) {
      m = Math.max(m, yearHistogram[y] ?? 0)
    }
    return m
  }, [miniBarYears, yearHistogram])

  const clearPlayer = useCallback(() => {
    questionFetchGen.current += 1
    setActiveRow(null)
    setActiveQuestion(null)
    setLoadingQuestion(false)
  }, [])

  const handleAreaChange = useCallback(
    (area: string) => {
      setSelectedArea(area)
      clearPlayer()
      setSelectedTopico('')
      setSelectedLanguage('')
    },
    [setSelectedArea, setSelectedTopico, setSelectedLanguage, clearPlayer],
  )

  const clearYear = useCallback(() => setSelectedYear(''), [setSelectedYear])
  const clearTopico = useCallback(() => setSelectedTopico(''), [setSelectedTopico])
  const clearLanguage = useCallback(() => setSelectedLanguage(''), [setSelectedLanguage])

  const openRow = useCallback(
    (row: QuestionBankRow) => {
      if (!baseUrl) return
      questionFetchGen.current += 1
      const gen = questionFetchGen.current
      setActiveQuestion(null)
      setLoadingQuestion(true)
      setActiveRow(row)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      void fetchQuestionDetailForBank(baseUrl, row.year, row.index, row.language)
        .then((q) => {
          if (gen !== questionFetchGen.current) return
          setActiveQuestion(q)
        })
        .finally(() => {
          if (gen !== questionFetchGen.current) return
          setLoadingQuestion(false)
        })
    },
    [baseUrl],
  )

  const hasFilterChips =
    Boolean(selectedYear) ||
    Boolean(selectedTopico) ||
    (isLinguagensArea && selectedTopico === IDIOMAS_TOPIC_ID && Boolean(selectedLanguage)) ||
    Boolean(difficulty)

  return (
    <div className={embedded ? 'broto-qbank-embedded' : ''}>
      <div className="broto-qbank-shell">
        <div className="broto-qbank-inner">
          {embedded && onBackToHub ? (
            <button
              type="button"
              className="broto-qbank-embedded-back"
              onClick={onBackToHub}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
                padding: '6px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}
            >
              <ArrowLeft size={14} aria-hidden />
              Voltar ao menu da área
            </button>
          ) : null}

          {loading ? (
            <div className="broto-qbank-skeletons">
              <div className="broto-skeleton broto-qbank-skel-line" />
              <div className="broto-skeleton broto-qbank-skel-line broto-qbank-skel-line--short" />
            </div>
          ) : (
            <>
              <section className={`broto-qbank-intro${embedded ? ' broto-qbank-intro--compact' : ''}`}>
                <div className="broto-qbank-intro-text">
                  {embedded ? (
                    <>
                      <h2 className="broto-qbank-intro-title broto-qbank-intro-title--compact">
                        Banco de questões — <em>{areaLabel}</em>
                      </h2>
                      <p className="broto-qbank-intro-desc">
                        Filtre por ano e tópico. Pratique no seu ritmo, fora do pacote guiado.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="broto-qbank-intro-title">
                        Pratique com questões
                        <br />
                        do <em>ENEM</em>
                      </h2>
                      <p className="broto-qbank-intro-desc">
                        Filtre por área, ano e tópico. Treine no seu ritmo, fora do pacote guiado.
                      </p>
                    </>
                  )}
                </div>
                <div className="broto-qbank-intro-stats">
                  <div className="broto-qbank-istat">
                    <div className="broto-qbank-istat-val">
                      {loadingBank || loadingProgress ? '…' : totalInArea.toLocaleString('pt-BR')}
                    </div>
                    <div className="broto-qbank-istat-label">Questões</div>
                  </div>
                  <div className="broto-qbank-istat">
                    <div
                      className="broto-qbank-istat-val broto-qbank-istat-val--accent"
                      style={{ color: answered > 0 ? 'var(--broto-qbank-t4)' : undefined }}
                    >
                      {loadingProgress ? '…' : answered.toLocaleString('pt-BR')}
                    </div>
                    <div className="broto-qbank-istat-label">Respondidas</div>
                  </div>
                  <div className="broto-qbank-istat">
                    <div
                      className="broto-qbank-istat-val broto-qbank-istat-val--muted"
                      style={{
                        color:
                          areaStat && areaStat.totalAnswered > 0
                            ? 'var(--broto-qbank-tx1)'
                            : 'var(--broto-qbank-tx3)',
                      }}
                    >
                      {loadingProgress ? '…' : accuracyLabel}
                    </div>
                    <div className="broto-qbank-istat-label">Acerto</div>
                  </div>
                </div>
              </section>

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
                    <h3 id="broto-qbank-destaque-mock-title" className="broto-qbank-destaque__title">
                      Simulado ENEM
                    </h3>
                    <p className="broto-qbank-destaque__desc">
                      Resolva várias questões em sequência, com correção e resumo ao final. Defina
                      quantidade, anos, áreas e tópicos — ou ative o modo aleatório para treinar com
                      sorteio do banco, no espírito da prova.
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

              {!embedded ? (
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
                  onChange={(e) =>
                    setDifficulty(e.target.value as '' | 'facil' | 'medio' | 'dificil')
                  }
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

              {error ? (
                <div className="broto-error-banner broto-qbank-banner">
                  <span>{error}</span>
                  <button type="button" onClick={retry}>
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              <div className="broto-qbank-layout">
                <div>
                  {activeRow ? (
                    <section className="broto-qbank-player-wrap">
                      <div className="broto-qbank-player-head">
                        <button
                          type="button"
                          className="broto-qbank-player-back"
                          onClick={clearPlayer}
                        >
                          Voltar à lista
                        </button>
                        <span className="broto-qbank-player-id">
                          {formatQuestionBankId(selectedArea, activeRow.year, activeRow.index)}
                        </span>
                      </div>
                      {loadingQuestion || !activeQuestion ? (
                        <div className="broto-skeleton" style={{ height: 220, borderRadius: 20 }} />
                      ) : (
                        <QuestionPlayer
                          key={getQuestionId(activeQuestion)}
                          question={activeQuestion}
                          areaKey={selectedArea}
                          onNext={clearPlayer}
                        />
                      )}
                    </section>
                  ) : null}

                  <div className="broto-qbank-list-head">
                    <p className="broto-qbank-count">
                      Exibindo <strong>{totalFiltered.toLocaleString('pt-BR')}</strong> questões de{' '}
                      {areaLabel}
                    </p>
                    <button
                      type="button"
                      className="broto-qbank-sort"
                      onClick={() => setSortRecent((v) => !v)}
                    >
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
                  />
                </div>

                <aside className="broto-qbank-side">
                  <div className="broto-qbank-side-card">
                    <h3 className="broto-qbank-side-title">Seu progresso em {areaLabel}</h3>
                    <ul className="broto-qbank-breakdown">
                      <li className="broto-qbank-bk-row">
                        <span className="broto-qbank-bk-dot broto-qbank-bk-dot--teal" />
                        <span className="broto-qbank-bk-label">Respondidas</span>
                        <span className="broto-qbank-bk-val">
                          {loadingProgress ? '…' : answered.toLocaleString('pt-BR')}
                        </span>
                      </li>
                      <li className="broto-qbank-bk-row">
                        <span className="broto-qbank-bk-dot broto-qbank-bk-dot--lime" />
                        <span className="broto-qbank-bk-label">Acertos</span>
                        <span className="broto-qbank-bk-val">
                          {loadingProgress
                            ? '…'
                            : areaStat && areaStat.totalAnswered > 0
                              ? correct.toLocaleString('pt-BR')
                              : '—'}
                        </span>
                      </li>
                      <li className="broto-qbank-bk-row">
                        <span className="broto-qbank-bk-dot broto-qbank-bk-dot--coral" />
                        <span className="broto-qbank-bk-label">Erros</span>
                        <span className="broto-qbank-bk-val">
                          {loadingProgress
                            ? '…'
                            : areaStat && areaStat.totalAnswered > 0
                              ? errors.toLocaleString('pt-BR')
                              : '—'}
                        </span>
                      </li>
                      <li className="broto-qbank-bk-row">
                        <span className="broto-qbank-bk-dot broto-qbank-bk-dot--muted" />
                        <span className="broto-qbank-bk-label">Pendentes</span>
                        <span className="broto-qbank-bk-val">
                          {loadingBank ? '…' : pendingApprox.toLocaleString('pt-BR')}
                        </span>
                      </li>
                    </ul>
                    <div className="broto-qbank-mini-bars">
                      {miniBarYears.map((y) => {
                        const c = yearHistogram[y] ?? 0
                        const h = maxBar > 0 ? Math.round((c / maxBar) * 100) : 8
                        return (
                          <div
                            key={y}
                            className="broto-qbank-mini-bar"
                            style={{ height: `${Math.max(12, h)}%` }}
                            title={`${y}: ${c} questões`}
                          />
                        )
                      })}
                    </div>
                    <div className="broto-qbank-mini-labels">
                      {miniBarYears.map((y) => (
                        <span key={y}>{y}</span>
                      ))}
                    </div>
                  </div>

                  <div className="broto-qbank-side-card">
                    <h3 className="broto-qbank-side-title">Tópicos disponíveis</h3>
                    {topicSummaries.length === 0 ? (
                      <p className="broto-qbank-side-empty">
                        {loadingBank
                          ? 'Carregando tópicos…'
                          : 'Não há tópicos mapeados para os filtros atuais.'}
                      </p>
                    ) : (
                      <ul className="broto-qbank-topic-list">
                        {topicSummaries.map((t) => (
                          <li key={t.value}>
                            <button
                              type="button"
                              className="broto-qbank-topic-chip"
                              onClick={() => {
                                const id = topicos.find((x) => x.value === t.value)?.id
                                if (id) setSelectedTopico(id)
                              }}
                            >
                              <span className="broto-qbank-topic-chip-left">
                                <span className={`broto-qbank-topic-dot ${t.dotClass}`} />
                                <span className="broto-qbank-topic-name">{t.label}</span>
                              </span>
                              <span className="broto-qbank-topic-count">
                                {t.count.toLocaleString('pt-BR')}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
