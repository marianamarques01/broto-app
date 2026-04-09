import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IDIOMAS_TOPIC_ID,
  LANGUAGE_OPTIONS,
  LINGUAGENS_AREA_VALUE,
  useQuestionsFilters,
} from '@/hooks/useQuestionsFilters'
import { TopBar } from '@/components/layout/TopBar'
import { formatMockExamFlowError } from '@/lib/mock-exam-flow-error'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import {
  buildMockExamPayload,
  fetchMockExamQuestions,
  isValidMockExamN,
  loadMockExamPool,
  MOCK_EXAM_N_MAX,
  MOCK_EXAM_N_MIN,
  MOCK_EXAM_YEAR_MAX,
  MOCK_EXAM_YEAR_MIN,
  type StudentMockExamConfig,
} from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Clock,
  History,
  Lightbulb,
  Loader2,
  Minus,
  Plus,
  Share2,
  Shuffle,
  Target,
  Trophy,
  Users,
} from 'lucide-react'

const ALL_YEARS_VALUE = ''

function clampMockExamN(n: number): number {
  return Math.min(MOCK_EXAM_N_MAX, Math.max(MOCK_EXAM_N_MIN, Math.floor(Number.isFinite(n) ? n : MOCK_EXAM_N_MIN)))
}

export function MockExamConfig() {
  const navigate = useNavigate()
  const { organization } = useClass()
  const baseUrl = getQuestionsStaticBaseUrl(organization?.slug ?? null)

  const {
    areas,
    exams,
    topicos,
    loading,
    error,
    selectedArea,
    selectedLanguage,
    setSelectedArea,
    setSelectedLanguage,
    isLanguageFilterEnabled,
  } = useQuestionsFilters({ enableQuestionFetch: false })

  const [randomMode, setRandomMode] = useState(false)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [nQuestoes, setNQuestoes] = useState(20)
  const [yearSelect, setYearSelect] = useState<string>(ALL_YEARS_VALUE)
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleArea = (value: string) => {
    setSelectedAreas((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const toggleTopico = (id: string) => {
    setSelectedTopicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const singleAreaForTopics = !randomMode && selectedAreas.length === 1 ? selectedAreas[0] : null

  useEffect(() => {
    if (singleAreaForTopics && singleAreaForTopics !== selectedArea) {
      setSelectedArea(singleAreaForTopics)
    }
  }, [singleAreaForTopics, selectedArea, setSelectedArea])

  useEffect(() => {
    if (selectedAreas.length !== 1) {
      setSelectedTopicIds([])
    }
  }, [selectedAreas])

  const topicoValues = useMemo(() => {
    if (!singleAreaForTopics || selectedTopicIds.length === 0) return []
    return topicos.filter((t) => selectedTopicIds.includes(t.id)).map((t) => t.value)
  }, [topicos, singleAreaForTopics, selectedTopicIds])

  const expandLinguagensIdiomas = useMemo(() => {
    if (!singleAreaForTopics || singleAreaForTopics !== LINGUAGENS_AREA_VALUE) return false
    if (!selectedTopicIds.includes(IDIOMAS_TOPIC_ID)) return false
    return !selectedLanguage
  }, [singleAreaForTopics, selectedTopicIds, selectedLanguage])

  const yearOptions = useMemo(() => {
    if (exams.length > 0) {
      return [...new Set(exams.map((e) => e.year))].sort((a, b) => a - b)
    }
    const ys: number[] = []
    for (let y = MOCK_EXAM_YEAR_MIN; y <= MOCK_EXAM_YEAR_MAX; y++) ys.push(y)
    return ys
  }, [exams])

  const selectedYears = useMemo(
    () => (yearSelect === ALL_YEARS_VALUE ? [] : [Number(yearSelect)]),
    [yearSelect],
  )

  const yearBounds = useMemo(() => {
    if (yearOptions.length === 0) return { min: MOCK_EXAM_YEAR_MIN, max: MOCK_EXAM_YEAR_MAX }
    return { min: yearOptions[0], max: yearOptions[yearOptions.length - 1] }
  }, [yearOptions])

  const buildConfig = useCallback((): StudentMockExamConfig | null => {
    const nQCfg = clampMockExamN(nQuestoes)
    if (!isValidMockExamN(nQCfg)) {
      setSubmitError(`Escolha entre ${MOCK_EXAM_N_MIN} e ${MOCK_EXAM_N_MAX} questões.`)
      return null
    }
    if (!randomMode && selectedAreas.length === 0) {
      setSubmitError('Selecione ao menos uma área ou ative o modo aleatório.')
      return null
    }
    return {
      nQuestoes: nQCfg,
      randomMode,
      areaValues: randomMode ? [] : [...selectedAreas],
      topicoValues: randomMode || !singleAreaForTopics ? [] : topicoValues,
      years: selectedYears,
      language: selectedLanguage,
      expandLinguagensIdiomas: randomMode ? false : expandLinguagensIdiomas,
    }
  }, [
    nQuestoes,
    randomMode,
    selectedAreas,
    singleAreaForTopics,
    topicoValues,
    selectedYears,
    selectedLanguage,
    expandLinguagensIdiomas,
  ])

  const handleStart = async () => {
    setSubmitError(null)
    const cfg = buildConfig()
    if (!cfg || !baseUrl) return

    setSubmitting(true)
    try {
      const pool = await loadMockExamPool({
        baseUrl,
        randomMode: cfg.randomMode,
        areaValues: cfg.areaValues,
        topicoValues: cfg.topicoValues,
        years: cfg.years,
        language: cfg.language,
        expandLinguagensIdiomas: cfg.expandLinguagensIdiomas,
      })

      const built = buildMockExamPayload(
        cfg.nQuestoes,
        cfg.randomMode,
        cfg.areaValues,
        pool,
      )

      if (!built.ok) {
        if (built.error.code === 'POOL_EMPTY') {
          setSubmitError('Nenhuma questão encontrada com esses filtros. Tente afrouxar ano, tópico ou área.')
        } else {
          setSubmitError(
            `Não há questões suficientes: você pediu ${built.error.requested}, mas só existem ${built.error.poolSize} no recorte. Reduza a quantidade ou os filtros.`,
          )
        }
        return
      }

      const questions = await fetchMockExamQuestions(baseUrl, built.questionIds)
      if (questions.length === 0) {
        setSubmitError('Não foi possível carregar o conteúdo das questões. Tente novamente.')
        return
      }
      if (questions.length < built.questionIds.length) {
        setSubmitError(
          'Algumas questões não puderam ser carregadas. Reduza filtros ou tente de novo.',
        )
        return
      }

      type CreateRes = { sessionId?: string; questionIds?: string[] }
      const created = await api.post<CreateRes>('/api/practice-session/create', {
        config: cfg,
        questionIds: built.questionIds,
      })

      if (!created.sessionId) {
        setSubmitError('Erro ao criar sessão no servidor.')
        return
      }

      navigate(`/study/mock-exam/play/${created.sessionId}`, {
        state: {
          questions,
          sessionId: created.sessionId,
          questionIds: built.questionIds,
        },
      })
    } catch (e) {
      setSubmitError(formatMockExamFlowError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const nQ = clampMockExamN(nQuestoes)
  const ringR = 52
  const ringCirc = 2 * Math.PI * ringR
  const ringArc = ringCirc * (nQ / MOCK_EXAM_N_MAX)
  const estMinutes = Math.max(5, Math.round(nQ * 1.5))

  const asideAreasLabel = randomMode
    ? 'Todas as áreas'
    : `${selectedAreas.length} de ${areas.length}`
  const asideYearsLabel =
    yearSelect === ALL_YEARS_VALUE
      ? `Todos (${yearBounds.min}–${yearBounds.max})`
      : yearSelect
  const asideModeLabel = randomMode ? 'Aleatório (todas as áreas)' : 'Por área selecionada'

  return (
    <div className="broto-page broto-page--study">
      <TopBar title="Simulado ENEM" variant="study" />
      <div className="broto-main-inner broto-main-inner--mock-exam">
        <div className="broto-mock-exam-config broto-fade-in">
          <nav className="broto-mock-exam-config__nav" aria-label="Navegação do simulado">
            <Link to="/study" className="broto-mock-exam-config__nav-link">
              <ArrowLeft size={15} strokeWidth={2} aria-hidden />
              Área de estudo
            </Link>
            <span className="broto-mock-exam-config__nav-dot" aria-hidden>
              ·
            </span>
            <Link to="/study/mock-exam/history" className="broto-mock-exam-config__nav-link">
              <History size={15} strokeWidth={2} aria-hidden />
              Histórico
            </Link>
          </nav>

          <div className="broto-mock-exam-hero">
            <div className="broto-mock-exam-hero__icon" aria-hidden>
              <ClipboardList size={26} strokeWidth={1.8} />
            </div>
            <div className="broto-mock-exam-hero__copy">
              <h1 className="broto-mock-exam-hero__title">Monte seu simulado</h1>
              <p className="broto-mock-exam-hero__subtitle">
                Ajuste quantidade e recorte por ano. Suas respostas seguem contando no desempenho por
                tópico.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="broto-mock-exam-panel broto-mock-exam-panel--minimal">
              <p className="broto-muted" style={{ margin: 0 }}>
                Carregando opções…
              </p>
            </div>
          ) : (
            <div className="broto-mock-exam-config__layout">
              <div className="broto-mock-exam-config__primary">
                {error ? (
                  <div className="broto-mock-exam-alert" role="alert">
                    {error}
                  </div>
                ) : null}

                <section
                  className="broto-mock-exam-panel broto-mock-exam-panel--unified"
                  aria-label="Configuração do simulado"
                >
                  <div className="broto-mock-exam-card-head">
                    <span
                      className="broto-mock-exam-card-head__dot"
                      style={{ background: 'var(--green-400)' }}
                      aria-hidden
                    />
                    <h2 className="broto-mock-exam-card-head__title">Configuração</h2>
                  </div>

                  <label className="broto-mock-exam-switch broto-mock-exam-switch--rich">
                    <span className="broto-mock-exam-switch__icon-wrap" aria-hidden>
                      <Shuffle size={18} strokeWidth={2} />
                    </span>
                    <span className="broto-mock-exam-switch__lead">
                      <span className="broto-mock-exam-switch__title">Modo aleatório</span>
                      <span className="broto-mock-exam-switch__subtitle">
                        Mistura questões de todas as áreas; você só define quantidade e ano.
                      </span>
                      <span className="broto-sr-only">
                        Quando ativo, ignora a seleção manual de áreas abaixo.
                      </span>
                    </span>
                    <span className="broto-mock-exam-switch__control">
                      <input
                        type="checkbox"
                        className="broto-mock-exam-switch__input"
                        checked={randomMode}
                        onChange={(e) => setRandomMode(e.target.checked)}
                      />
                      <span className="broto-mock-exam-switch__track" aria-hidden>
                        <span className="broto-mock-exam-switch__thumb" />
                      </span>
                    </span>
                  </label>

                  <div className="broto-mock-exam-divider" role="presentation" />

                  <div className="broto-mock-exam-qty-years-row">
                    <div className="broto-mock-exam-qty-block">
                      <span className="broto-mock-exam-field-label" id="mock-qty-label">
                        Questões
                      </span>
                      <div
                        className="broto-mock-exam-stepper"
                        role="group"
                        aria-labelledby="mock-qty-label"
                      >
                        <button
                          type="button"
                          className="broto-mock-exam-stepper__btn"
                          aria-label="Diminuir quantidade de questões"
                          disabled={nQ <= MOCK_EXAM_N_MIN}
                          onClick={() => setNQuestoes((n) => clampMockExamN(n - 1))}
                        >
                          <Minus size={18} strokeWidth={2.2} aria-hidden />
                        </button>
                        <span className="broto-mock-exam-stepper__value" aria-live="polite">
                          {nQ}
                        </span>
                        <button
                          type="button"
                          className="broto-mock-exam-stepper__btn"
                          aria-label="Aumentar quantidade de questões"
                          disabled={nQ >= MOCK_EXAM_N_MAX}
                          onClick={() => setNQuestoes((n) => clampMockExamN(n + 1))}
                        >
                          <Plus size={18} strokeWidth={2.2} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="broto-mock-exam-year-select-block">
                      <label className="broto-mock-exam-field-label" htmlFor="mock-year-select">
                        Anos
                      </label>
                      <select
                        id="mock-year-select"
                        className="broto-select broto-mock-exam-year-select"
                        value={yearSelect}
                        onChange={(e) => setYearSelect(e.target.value)}
                        aria-describedby="mock-year-hint"
                      >
                        <option value={ALL_YEARS_VALUE}>Todos os anos ({yearBounds.min}–{yearBounds.max})</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <p id="mock-year-hint" className="broto-mock-exam-microcopy broto-mock-exam-microcopy--tight">
                        Opcional — limite o banco a um ano da prova.
                      </p>
                    </div>

                    <div className="broto-mock-exam-slider-block">
                      <div className="broto-mock-exam-slider-head">
                        <label className="broto-mock-exam-slider-head__label" htmlFor="mock-n-range">
                          Quantidade
                        </label>
                        <span className="broto-mock-exam-slider-head__meta">
                          {MOCK_EXAM_N_MIN}–{MOCK_EXAM_N_MAX}
                        </span>
                      </div>
                      <input
                        id="mock-n-range"
                        className="broto-mock-exam-range"
                        type="range"
                        min={MOCK_EXAM_N_MIN}
                        max={MOCK_EXAM_N_MAX}
                        step={1}
                        value={nQ}
                        onChange={(e) => setNQuestoes(clampMockExamN(Number(e.target.value)))}
                        aria-valuemin={MOCK_EXAM_N_MIN}
                        aria-valuemax={MOCK_EXAM_N_MAX}
                        aria-valuenow={nQ}
                        aria-label="Quantidade de questões no simulado"
                        style={
                          {
                            ['--mock-range-pct' as string]: `${((nQ - MOCK_EXAM_N_MIN) / (MOCK_EXAM_N_MAX - MOCK_EXAM_N_MIN)) * 100}%`,
                          } as CSSProperties
                        }
                      />
                    </div>
                  </div>
                </section>

                {!randomMode ? (
                  <section
                    className="broto-mock-exam-panel broto-mock-exam-panel--areas"
                    aria-labelledby="mock-areas-heading"
                  >
                    <div className="broto-mock-exam-card-head">
                      <span
                        className="broto-mock-exam-card-head__dot"
                        style={{ background: 'var(--status-violet)' }}
                        aria-hidden
                      />
                      <h2 id="mock-areas-heading" className="broto-mock-exam-card-head__title">
                        Áreas
                      </h2>
                    </div>
                    <span className="broto-sr-only">
                      Selecione uma ou mais áreas do ENEM. Toque para marcar ou desmarcar.
                    </span>
                    <div className="broto-mock-exam-areas">
                      {areas.map((a) => {
                        const config = AREA_CONFIG[a.value] ?? AREA_CONFIG.sem_area
                        const Icon = config.icon
                        const av = AREA_ACCENT_VARS[a.value] ?? AREA_ACCENT_VARS.linguagens
                        const sel = selectedAreas.includes(a.value)
                        return (
                          <button
                            key={a.value}
                            type="button"
                            className={`broto-mock-exam-area${sel ? ' broto-mock-exam-area--selected' : ''}`}
                            style={
                              {
                                '--study-area-accent': config.color,
                                '--ac-dim': av.dim,
                                '--ac-glow': av.glow,
                              } as CSSProperties
                            }
                            onClick={() => toggleArea(a.value)}
                          >
                            <StudyAreaCardPattern areaKey={a.value} />
                            <span className="broto-mock-exam-area__icon" aria-hidden>
                              <Icon size={20} color="currentColor" strokeWidth={1.85} />
                            </span>
                            <span className="broto-mock-exam-area__copy">
                              <span className="broto-mock-exam-area__label">{a.label}</span>
                            </span>
                            <span className="broto-mock-exam-area__check" aria-hidden>
                              {sel ? <Check size={14} strokeWidth={2.8} /> : null}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ) : null}

                {!randomMode && singleAreaForTopics ? (
                  <details className="broto-mock-exam-details">
                    <summary className="broto-mock-exam-details__summary">
                      Refinar por tópicos ou idioma
                    </summary>
                    <div className="broto-mock-exam-details__body">
                      <p className="broto-mock-exam-microcopy broto-mock-exam-microcopy--block">
                        Deixe vazio para usar todos os tópicos da área. Idioma vale para Linguagens.
                      </p>
                      <div className="broto-mock-exam-topics">
                        {topicos.map((t) => (
                          <label key={t.id} className="broto-mock-exam-topic">
                            <input
                              type="checkbox"
                              checked={selectedTopicIds.includes(t.id)}
                              onChange={() => toggleTopico(t.id)}
                            />
                            <span>{t.label}</span>
                          </label>
                        ))}
                      </div>
                      {isLanguageFilterEnabled ? (
                        <div className="broto-mock-exam-lang">
                          <label className="broto-label" htmlFor="mock-lang">
                            Idioma (Linguagens)
                          </label>
                          <select
                            id="mock-lang"
                            className="broto-select broto-mock-exam-lang__select"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                          >
                            {LANGUAGE_OPTIONS.map((o) => (
                              <option key={o.value || 'all'} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ) : null}

                {submitError ? (
                  <div className="broto-mock-exam-alert" role="alert">
                    {submitError}
                  </div>
                ) : null}
              </div>

              <aside className="broto-mock-exam-config__aside" aria-label="Resumo e ação">
                <div className="broto-mock-exam-aside-card">
                  <div className="broto-mock-exam-card-head broto-mock-exam-card-head--in-card">
                    <span
                      className="broto-mock-exam-card-head__dot"
                      style={{ background: 'var(--teal-400)' }}
                      aria-hidden
                    />
                    <h2 className="broto-mock-exam-card-head__title">Seu simulado</h2>
                  </div>

                  <div className="broto-mock-exam-preview-ring-wrap">
                    <div className="broto-mock-exam-preview-ring" aria-hidden>
                      <svg viewBox="0 0 120 120" className="broto-mock-exam-preview-ring__svg">
                        <circle className="broto-mock-exam-preview-ring__bg" cx="60" cy="60" r={ringR} />
                        <circle
                          className="broto-mock-exam-preview-ring__fill"
                          cx="60"
                          cy="60"
                          r={ringR}
                          strokeDasharray={`${ringArc} ${ringCirc}`}
                        />
                      </svg>
                      <div className="broto-mock-exam-preview-ring__center">
                        <span className="broto-mock-exam-preview-ring__n">{nQ}</span>
                        <span className="broto-mock-exam-preview-ring__unit">questões</span>
                      </div>
                    </div>
                  </div>

                  <ul className="broto-mock-exam-aside-list">
                    <li className="broto-mock-exam-aside-list__item">
                      <span
                        className="broto-mock-exam-aside-list__dot"
                        style={{ background: 'var(--area-linguagens)' }}
                        aria-hidden
                      />
                      <span className="broto-mock-exam-aside-list__text">
                        <span className="broto-mock-exam-aside-list__k">Áreas</span>
                        {asideAreasLabel}
                      </span>
                    </li>
                    <li className="broto-mock-exam-aside-list__item">
                      <span
                        className="broto-mock-exam-aside-list__dot"
                        style={{ background: 'var(--status-sky)' }}
                        aria-hidden
                      />
                      <span className="broto-mock-exam-aside-list__text">
                        <span className="broto-mock-exam-aside-list__k">Anos</span>
                        {asideYearsLabel}
                      </span>
                    </li>
                    <li className="broto-mock-exam-aside-list__item">
                      <span
                        className="broto-mock-exam-aside-list__dot"
                        style={{ background: 'var(--gold-400)' }}
                        aria-hidden
                      />
                      <span className="broto-mock-exam-aside-list__text">
                        <span className="broto-mock-exam-aside-list__k">Modo</span>
                        {asideModeLabel}
                      </span>
                    </li>
                  </ul>

                  <p className="broto-mock-exam-aside-estimate">
                    <Clock size={16} strokeWidth={2} aria-hidden />
                    <span>Tempo estimado: ~{estMinutes} min</span>
                  </p>

                  <button
                    type="button"
                    className="broto-btn-primary broto-mock-exam-aside-cta"
                    disabled={submitting || !baseUrl}
                    onClick={() => void handleStart()}
                  >
                    {submitting ? (
                      <Loader2
                        size={18}
                        className="broto-mock-exam-aside-cta__spin"
                        aria-hidden
                      />
                    ) : (
                      <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
                    )}
                    Iniciar simulado
                  </button>
                </div>

                <div className="broto-mock-exam-tips-card">
                  <div className="broto-mock-exam-card-head broto-mock-exam-card-head--in-card">
                    <span
                      className="broto-mock-exam-card-head__dot"
                      style={{ background: 'var(--gold-400)' }}
                      aria-hidden
                    />
                    <h2 className="broto-mock-exam-card-head__title">Dicas</h2>
                  </div>
                  <ul className="broto-mock-exam-tips">
                    <li className="broto-mock-exam-tips__item">
                      <Lightbulb size={16} strokeWidth={2} className="broto-mock-exam-tips__icon" aria-hidden />
                      <span>Reserve um bloco contínuo, como no dia da prova.</span>
                    </li>
                    <li className="broto-mock-exam-tips__item">
                      <Target size={16} strokeWidth={2} className="broto-mock-exam-tips__icon" aria-hidden />
                      <span>Leia o enunciado inteiro antes de marcar a alternativa.</span>
                    </li>
                    <li className="broto-mock-exam-tips__item">
                      <BarChart3 size={16} strokeWidth={2} className="broto-mock-exam-tips__icon" aria-hidden />
                      <span>Depois, confira o resultado por área no seu progresso.</span>
                    </li>
                  </ul>
                </div>

                <div
                  className="broto-mock-exam-group-teaser"
                  aria-label="Prévia visual do simulado em grupo. Recurso ainda não disponível."
                >
                  <div className="broto-mock-exam-group-teaser__head">
                    <div className="broto-mock-exam-card-head broto-mock-exam-card-head--in-card broto-mock-exam-group-teaser__card-head">
                      <span
                        className="broto-mock-exam-card-head__dot"
                        style={{ background: 'var(--status-sky)' }}
                        aria-hidden
                      />
                      <h2 className="broto-mock-exam-card-head__title">Simulado em grupo</h2>
                    </div>
                    <span className="broto-mock-exam-group-teaser__badge">Em breve</span>
                  </div>

                  <p className="broto-mock-exam-group-teaser__lead">
                    Convide amigos, todos respondem ao mesmo conjunto de questões e, ao final, aparece quantos
                    acertos cada um teve — ideal para estudar junto e comparar o desempenho.
                  </p>

                  <ul className="broto-mock-exam-group-teaser__flow">
                    <li className="broto-mock-exam-group-teaser__flow-item">
                      <span className="broto-mock-exam-group-teaser__flow-icon" aria-hidden>
                        <Share2 size={15} strokeWidth={2} />
                      </span>
                      <span>
                        <strong className="broto-mock-exam-group-teaser__flow-k">Convite</strong>
                        Você gera um link e manda para a turma.
                      </span>
                    </li>
                    <li className="broto-mock-exam-group-teaser__flow-item">
                      <span className="broto-mock-exam-group-teaser__flow-icon" aria-hidden>
                        <Users size={15} strokeWidth={2} />
                      </span>
                      <span>
                        <strong className="broto-mock-exam-group-teaser__flow-k">Juntos</strong>
                        Cada um faz no próprio tempo, com as mesmas questões.
                      </span>
                    </li>
                    <li className="broto-mock-exam-group-teaser__flow-item">
                      <span className="broto-mock-exam-group-teaser__flow-icon" aria-hidden>
                        <Trophy size={15} strokeWidth={2} />
                      </span>
                      <span>
                        <strong className="broto-mock-exam-group-teaser__flow-k">Ranking</strong>
                        O painel mostra acertos por pessoa (ex.: 14/20, 12/20).
                      </span>
                    </li>
                  </ul>

                  <div className="broto-mock-exam-group-teaser__board" aria-hidden>
                    <p className="broto-mock-exam-group-teaser__board-label">Exemplo de painel ao final</p>
                    <ul className="broto-mock-exam-group-teaser__rows">
                      <li className="broto-mock-exam-group-teaser__row broto-mock-exam-group-teaser__row--you">
                        <span className="broto-mock-exam-group-teaser__who">
                          <span className="broto-mock-exam-group-teaser__avatar" aria-hidden>
                            VC
                          </span>
                          Você
                        </span>
                        <span className="broto-mock-exam-group-teaser__score">14/20</span>
                      </li>
                      <li className="broto-mock-exam-group-teaser__row">
                        <span className="broto-mock-exam-group-teaser__who">
                          <span className="broto-mock-exam-group-teaser__avatar" aria-hidden>
                            AM
                          </span>
                          Amiga
                        </span>
                        <span className="broto-mock-exam-group-teaser__score">12/20</span>
                      </li>
                      <li className="broto-mock-exam-group-teaser__row">
                        <span className="broto-mock-exam-group-teaser__who">
                          <span className="broto-mock-exam-group-teaser__avatar" aria-hidden>
                            JP
                          </span>
                          João
                        </span>
                        <span className="broto-mock-exam-group-teaser__score">11/20</span>
                      </li>
                    </ul>
                  </div>

                  <p className="broto-mock-exam-group-teaser__footnote">
                    Ilustração apenas — convites e ranking em grupo ainda não estão ativos no app.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
