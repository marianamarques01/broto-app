import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  IDIOMAS_TOPIC_ID,
  LANGUAGE_OPTIONS,
  LINGUAGENS_AREA_VALUE,
  useQuestionsFilters,
} from '@/hooks/useQuestionsFilters'
import { formatMockExamFlowError } from '@/lib/mock-exam-flow-error'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import {
  buildMockExamPayload,
  fetchMockExamQuestions,
  isValidMockExamN,
  loadMockExamPool,
  MOCK_EXAM_ANSWER_FEEDBACK_MODE_DEFAULT,
  MOCK_EXAM_N_MAX,
  MOCK_EXAM_N_MIN,
  MOCK_EXAM_TIME_LIMIT_MINUTES_MAX,
  MOCK_EXAM_TIME_LIMIT_MINUTES_MIN,
  MOCK_EXAM_YEAR_MAX,
  MOCK_EXAM_YEAR_MIN,
  clampMockExamTimeLimitMinutes,
  type MockExamAnswerFeedbackMode,
  type StudentMockExamConfig,
} from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Eye,
  History,
  Lightbulb,
  ListOrdered,
  Loader2,
  Lock,
  Minus,
  Plus,
  Share2,
  Shuffle,
  Target,
  Timer,
  Trophy,
  Users,
  AlertTriangle,
  X,
} from 'lucide-react'

const ALL_YEARS_VALUE = ''

const AREA_OR_RANDOM_WARNING =
  'Selecione ao menos uma área ou ative o modo aleatório.'

type MockExamInfoModal = 'tips' | 'group' | null

function clampMockExamN(n: number): number {
  return Math.min(
    MOCK_EXAM_N_MAX,
    Math.max(MOCK_EXAM_N_MIN, Math.floor(Number.isFinite(n) ? n : MOCK_EXAM_N_MIN)),
  )
}

export type MockExamConfiguratorProps = {
  variant: 'page' | 'modal'
  /** Slug da área ENEM (ex.: linguagens) */
  presetArea?: string | null
  /** Slug do tópico no catálogo (ex.: interpretacao-texto) */
  presetTopicoValue?: string | null
  /** Rótulo amigável (ex.: do pacote) quando o catálogo ainda não carregou */
  presetTopicoLabelHint?: string | null
  onClose?: () => void
}

export function MockExamConfigurator({
  variant,
  presetArea,
  presetTopicoValue,
  presetTopicoLabelHint,
  onClose,
}: MockExamConfiguratorProps) {
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
  const [refineDetailsOpen, setRefineDetailsOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [infoModal, setInfoModal] = useState<MockExamInfoModal>(null)
  const [selectionWarningOpen, setSelectionWarningOpen] = useState(false)
  const selectionWarningModalRef = useRef<HTMLDivElement | null>(null)
  const selectionWarningBtnRef = useRef<HTMLButtonElement | null>(null)
  const suggestedTimeLimit = useMemo(
    () => clampMockExamTimeLimitMinutes(Math.max(30, Math.round(clampMockExamN(nQuestoes) * 1.5))),
    [nQuestoes],
  )
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(() =>
    clampMockExamTimeLimitMinutes(Math.max(30, Math.round(20 * 1.5))),
  )
  const [answerFeedbackMode, setAnswerFeedbackMode] = useState<MockExamAnswerFeedbackMode>(
    MOCK_EXAM_ANSWER_FEEDBACK_MODE_DEFAULT,
  )

  const presetAppliedRef = useRef(false)
  const pendingPresetTopicoRef = useRef<string | null>(null)
  const tipsQuickLinkRef = useRef<HTMLButtonElement | null>(null)
  const groupQuickLinkRef = useRef<HTMLButtonElement | null>(null)
  const infoModalRef = useRef<HTMLDivElement | null>(null)
  const infoModalCloseRef = useRef<HTMLButtonElement | null>(null)

  const toggleArea = (value: string) => {
    setSelectedAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const toggleTopico = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
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

  useEffect(() => {
    if (loading || areas.length === 0 || presetAppliedRef.current) return
    const pa = presetArea?.trim() ?? ''
    const pt = presetTopicoValue?.trim() ?? ''
    if (!pa || !areas.some((a) => a.value === pa)) return
    presetAppliedRef.current = true
    setRandomMode(false)
    setSelectedAreas([pa])
    pendingPresetTopicoRef.current = pt || null
  }, [loading, presetArea, presetTopicoValue, areas])

  useEffect(() => {
    const pending = pendingPresetTopicoRef.current
    if (!pending || !singleAreaForTopics || topicos.length === 0) return
    const t = topicos.find((x) => x.value === pending)
    if (t) {
      setSelectedTopicIds([t.id])
      if (variant === 'page') setRefineDetailsOpen(true)
    }
    pendingPresetTopicoRef.current = null
  }, [topicos, singleAreaForTopics, variant])

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
      setSelectionWarningOpen(true)
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
      answerFeedbackMode,
      ...(timeLimitEnabled
        ? { timeLimitMinutes: clampMockExamTimeLimitMinutes(timeLimitMinutes) }
        : {}),
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
    answerFeedbackMode,
    timeLimitEnabled,
    timeLimitMinutes,
  ])

  const handleStart = async () => {
    setSubmitError(null)
    setSelectionWarningOpen(false)
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

      const built = buildMockExamPayload(cfg.nQuestoes, cfg.randomMode, cfg.areaValues, pool)

      if (!built.ok) {
        if (built.error.code === 'POOL_EMPTY') {
          setSubmitError(
            'Nenhuma questão encontrada com esses filtros. Tente afrouxar ano, tópico ou área.',
          )
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

      onClose?.()

      navigate(`/study/mock-exam/play/${created.sessionId}`, {
        state: {
          questions,
          sessionId: created.sessionId,
          questionIds: built.questionIds,
          config: cfg,
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
    yearSelect === ALL_YEARS_VALUE ? `Todos (${yearBounds.min}–${yearBounds.max})` : yearSelect
  const asideModeLabel = randomMode ? 'Aleatório (todas as áreas)' : 'Por área selecionada'
  const asideTimeLabel = timeLimitEnabled
    ? `${clampMockExamTimeLimitMinutes(timeLimitMinutes)} min`
    : 'Sem limite'
  const asideFeedbackLabel = answerFeedbackMode === 'immediate' ? 'Durante a sessão' : 'Só no final'
  const tLim = clampMockExamTimeLimitMinutes(timeLimitMinutes)

  const presetAreaLabel = useMemo(() => {
    const pa = presetArea?.trim()
    if (!pa) return null
    return areas.find((a) => a.value === pa)?.label ?? null
  }, [areas, presetArea])

  const presetTopicLabel = useMemo(() => {
    const pt = presetTopicoValue?.trim()
    if (!pt) return null
    return topicos.find((t) => t.value === pt)?.label ?? presetTopicoLabelHint ?? pt
  }, [topicos, presetTopicoValue, presetTopicoLabelHint])

  const modalTopicStillLoading = useMemo(() => {
    if (variant !== 'modal') return false
    if (!presetArea?.trim()) return true
    if (!singleAreaForTopics) return true
    if (topicos.length === 0) return true
    return false
  }, [variant, presetArea, singleAreaForTopics, topicos.length])

  const closeInfoModal = useCallback(() => {
    const modalToClose = infoModal
    setInfoModal(null)
    window.setTimeout(() => {
      const trigger = modalToClose === 'tips' ? tipsQuickLinkRef.current : groupQuickLinkRef.current
      trigger?.focus()
    }, 0)
  }, [infoModal])

  useEffect(() => {
    if (!infoModal) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeInfoModal()
        return
      }

      if (event.key !== 'Tab') return

      const modal = infoModalRef.current
      if (!modal) return
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (!active || !modal.contains(active)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.setTimeout(() => infoModalCloseRef.current?.focus(), 0)
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeInfoModal, infoModal])

  const closeSelectionWarning = useCallback(() => {
    setSelectionWarningOpen(false)
  }, [])

  useEffect(() => {
    if (!selectionWarningOpen) return
    const t = window.setTimeout(() => selectionWarningBtnRef.current?.focus(), 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSelectionWarning()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectionWarningOpen, closeSelectionWarning])

  return (
    <div
      className={
        'broto-mock-exam-config broto-fade-in' +
        (variant === 'modal' ? ' broto-mock-exam-config--modal-shell' : '')
      }
    >
      <div className="broto-mock-exam-config__toolbar">
        <nav className="broto-mock-exam-config__nav" aria-label="Navegação da sessão ENEM">
          {variant === 'modal' ? (
            <button
              type="button"
              className="broto-mock-exam-config__nav-link"
              onClick={onClose}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={15} strokeWidth={2} aria-hidden />
              Fechar
            </button>
          ) : (
            <Link to="/study" className="broto-mock-exam-config__nav-link">
              <ArrowLeft size={15} strokeWidth={2} aria-hidden />
              Área de estudo
            </Link>
          )}
          {variant === 'page' ? (
            <>
              <span className="broto-mock-exam-config__nav-dot" aria-hidden>
                ·
              </span>
              <Link to="/study/mock-exam/history" className="broto-mock-exam-config__nav-link">
                <History size={15} strokeWidth={2} aria-hidden />
                Histórico
              </Link>
            </>
          ) : null}
        </nav>

        {variant === 'page' ? (
          <div className="broto-mock-exam-config__quick-links" aria-label="Atalhos da sessão">
            <button
              type="button"
              className="broto-mock-exam-config__quick-link"
              ref={tipsQuickLinkRef}
              onClick={() => setInfoModal('tips')}
            >
              <Lightbulb size={13} strokeWidth={2} aria-hidden />
              Dicas
            </button>
            <button
              type="button"
              className="broto-mock-exam-config__quick-link"
              ref={groupQuickLinkRef}
              onClick={() => setInfoModal('group')}
            >
              <Users size={13} strokeWidth={2} aria-hidden />
              Sessão em grupo
              <span className="broto-mock-exam-config__quick-link-badge">Em breve</span>
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={
          variant === 'modal'
            ? 'broto-mock-exam-hero broto-mock-exam-hero--modal'
            : 'broto-mock-exam-hero'
        }
      >
        <div className="broto-mock-exam-hero__icon" aria-hidden>
          <ClipboardList size={26} strokeWidth={1.8} />
        </div>
        <div className="broto-mock-exam-hero__copy">
          <h1 className="broto-mock-exam-hero__title">
            {variant === 'modal' ? 'Sua sessão' : 'Monte sua sessão ENEM'}
          </h1>
          <p className="broto-mock-exam-hero__subtitle">
            {variant === 'modal' ? (
              <>
                Conteúdo definido pelo pacote. Ajuste <strong>quantidade</strong> e{' '}
                <strong>tempo</strong>; em seguida você entra na sessão.
              </>
            ) : presetAreaLabel && presetTopicLabel ? (
              <>
                Área <strong>{presetAreaLabel}</strong> · Conteúdo{' '}
                <strong>{presetTopicLabel}</strong>. Ajuste a quantidade e o ano, depois inicie.
              </>
            ) : (
              <>
                <strong>No estilo de um simulado</strong>, com a quantidade e o tempo que você
                quiser — não é obrigatório cobrir as 90 questões da prova. Suas respostas seguem
                contando no desempenho por tópico.
              </>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="broto-mock-exam-panel broto-mock-exam-panel--minimal">
          <p className="broto-muted" style={{ margin: 0 }}>
            Carregando opções…
          </p>
        </div>
      ) : variant === 'modal' ? (
        <div className="broto-mock-exam-config__layout broto-mock-exam-config__layout--modal-quick">
          <div className="broto-mock-exam-config__primary broto-mock-exam-config__primary--modal-full">
            {error ? (
              <div className="broto-mock-exam-alert" role="alert">
                {error}
              </div>
            ) : null}

            <div
              className="broto-mock-exam-panel broto-mock-exam-panel--unified broto-mock-exam-panel--modal-focus"
              aria-label="Quantidade e tempo da sessão"
            >
              <div className="broto-mock-exam-card-head">
                <span
                  className="broto-mock-exam-card-head__dot"
                  style={{ background: 'var(--green-400)' }}
                  aria-hidden
                />
                <h2 className="broto-mock-exam-card-head__title">Antes da sessão</h2>
              </div>

              <div className="broto-mock-exam-modal-package" title="Conteúdo fixo pelo pacote">
                <span className="broto-mock-exam-modal-package__badge" aria-hidden>
                  <Lock size={13} strokeWidth={2.2} />
                  Pacote
                </span>
                <p className="broto-mock-exam-modal-package__line">
                  <span className="broto-mock-exam-modal-package__area">
                    {presetAreaLabel ?? 'Área'}
                  </span>
                  <span className="broto-mock-exam-modal-package__sep" aria-hidden>
                    ·
                  </span>
                  <span className="broto-mock-exam-modal-package__topic">
                    {presetTopicLabel ?? presetTopicoLabelHint ?? 'Conteúdo'}
                  </span>
                </p>
              </div>
              <p className="broto-mock-exam-modal-lead">
                Filtros não mudam aqui. Ajuste só o tamanho da sessão e, se quiser, o cronômetro.
              </p>

              <div className="broto-mock-exam-modal-metric-strip" aria-live="polite">
                <div className="broto-mock-exam-modal-metric broto-mock-exam-modal-metric--accent">
                  <span className="broto-mock-exam-modal-metric__value">{nQ}</span>
                  <span className="broto-mock-exam-modal-metric__label">questões</span>
                </div>
                <div className="broto-mock-exam-modal-metric">
                  <span className="broto-mock-exam-modal-metric__value">~{estMinutes}</span>
                  <span className="broto-mock-exam-modal-metric__label">min estimados</span>
                </div>
                <div
                  className={`broto-mock-exam-modal-metric${timeLimitEnabled ? ' broto-mock-exam-modal-metric--live' : ''}`}
                >
                  <span className="broto-mock-exam-modal-metric__value">
                    {timeLimitEnabled ? tLim : '—'}
                  </span>
                  <span className="broto-mock-exam-modal-metric__label">
                    {timeLimitEnabled ? 'min no cronômetro' : 'livre'}
                  </span>
                </div>
              </div>

              <div className="broto-mock-exam-modal-section">
                <div className="broto-mock-exam-modal-section__head">
                  <ListOrdered
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className="broto-mock-exam-modal-section__icon"
                  />
                  <span className="broto-mock-exam-modal-section__title">Quantidade</span>
                </div>
                <div
                  className="broto-mock-exam-slider-block broto-mock-exam-slider-block--modal"
                  style={{ marginBottom: 0 }}
                >
                  <div className="broto-mock-exam-slider-head">
                    <label
                      className="broto-mock-exam-slider-head__label"
                      htmlFor="mock-n-range-modal"
                    >
                      Questões na sessão
                    </label>
                    <span className="broto-mock-exam-slider-head__meta">
                      {MOCK_EXAM_N_MIN}–{MOCK_EXAM_N_MAX}
                    </span>
                  </div>
                  <div className="broto-mock-exam-qty-row broto-mock-exam-qty-row--modal">
                    <input
                      id="mock-n-range-modal"
                      className="broto-mock-exam-range broto-mock-exam-range--grow"
                      type="range"
                      min={MOCK_EXAM_N_MIN}
                      max={MOCK_EXAM_N_MAX}
                      step={1}
                      value={nQ}
                      onChange={(e) => setNQuestoes(clampMockExamN(Number(e.target.value)))}
                      aria-valuemin={MOCK_EXAM_N_MIN}
                      aria-valuemax={MOCK_EXAM_N_MAX}
                      aria-valuenow={nQ}
                      aria-label="Quantidade de questões na sessão"
                      style={
                        {
                          ['--mock-range-pct' as string]: `${((nQ - MOCK_EXAM_N_MIN) / (MOCK_EXAM_N_MAX - MOCK_EXAM_N_MIN)) * 100}%`,
                        } as CSSProperties
                      }
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      className="broto-mock-exam-num-input"
                      min={MOCK_EXAM_N_MIN}
                      max={MOCK_EXAM_N_MAX}
                      value={nQ}
                      aria-label="Número exato de questões"
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') return
                        const v = Number.parseInt(raw, 10)
                        if (Number.isNaN(v)) return
                        setNQuestoes(clampMockExamN(v))
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') setNQuestoes(MOCK_EXAM_N_MIN)
                      }}
                    />
                  </div>
                  <p className="broto-mock-exam-microcopy broto-mock-exam-microcopy--tight broto-mock-exam-microcopy--modal-qty">
                    Use o campo ao lado para digitar o número exato. Estimativa de leitura: ~
                    {estMinutes} min (sem cronômetro).
                  </p>
                </div>
              </div>

              <div className="broto-mock-exam-modal-section">
                <div className="broto-mock-exam-modal-section__head">
                  <Eye
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className="broto-mock-exam-modal-section__icon"
                  />
                  <span className="broto-mock-exam-modal-section__title">Correção</span>
                </div>
              </div>

              <label className="broto-mock-exam-switch broto-mock-exam-switch--rich broto-mock-exam-switch--modal-timer">
                <span className="broto-mock-exam-switch__icon-wrap" aria-hidden>
                  <ClipboardCheck size={18} strokeWidth={2} />
                </span>
                <span className="broto-mock-exam-switch__lead">
                  <span className="broto-mock-exam-switch__title">
                    {answerFeedbackMode === 'immediate'
                      ? 'Acompanhar respostas'
                      : 'Ver respostas no final'}
                  </span>
                  <span className="broto-mock-exam-switch__subtitle">
                    {answerFeedbackMode === 'immediate'
                      ? 'Mostra se acertou logo após responder.'
                      : 'Guarda as correções para o resultado da sessão.'}
                  </span>
                </span>
                <span className="broto-mock-exam-switch__control">
                  <input
                    type="checkbox"
                    className="broto-mock-exam-switch__input"
                    checked={answerFeedbackMode === 'immediate'}
                    onChange={(e) =>
                      setAnswerFeedbackMode(e.target.checked ? 'immediate' : 'final')
                    }
                    aria-label="Acompanhar respostas durante a sessão"
                  />
                  <span className="broto-mock-exam-switch__track" aria-hidden>
                    <span className="broto-mock-exam-switch__thumb" />
                  </span>
                </span>
              </label>

              <div
                className="broto-mock-exam-divider broto-mock-exam-divider--modal-spaced"
                role="presentation"
              />

              <div className="broto-mock-exam-modal-section">
                <div className="broto-mock-exam-modal-section__head">
                  <Clock
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className="broto-mock-exam-modal-section__icon"
                  />
                  <span className="broto-mock-exam-modal-section__title">Cronômetro</span>
                  <span className="broto-mock-exam-modal-section__optional">opcional</span>
                </div>
              </div>

              <label className="broto-mock-exam-switch broto-mock-exam-switch--rich broto-mock-exam-switch--modal-timer">
                <span className="broto-mock-exam-switch__icon-wrap" aria-hidden>
                  <Timer size={18} strokeWidth={2} />
                </span>
                <span className="broto-mock-exam-switch__lead">
                  <span className="broto-mock-exam-switch__title">Limite de tempo</span>
                  <span className="broto-mock-exam-switch__subtitle">
                    Ao zerar o cronômetro, a sessão encerra com o que você já respondeu.
                  </span>
                </span>
                <span className="broto-mock-exam-switch__control">
                  <input
                    type="checkbox"
                    className="broto-mock-exam-switch__input"
                    checked={timeLimitEnabled}
                    onChange={(e) => {
                      const on = e.target.checked
                      setTimeLimitEnabled(on)
                      if (on) setTimeLimitMinutes(suggestedTimeLimit)
                    }}
                  />
                  <span className="broto-mock-exam-switch__track" aria-hidden>
                    <span className="broto-mock-exam-switch__thumb" />
                  </span>
                </span>
              </label>

              {!timeLimitEnabled ? (
                <p className="broto-mock-exam-modal-time-hint" role="note">
                  Ative o limite acima para escolher os minutos — você verá o campo e o ajuste fino.
                </p>
              ) : null}

              {timeLimitEnabled ? (
                <div className="broto-mock-exam-time-limit-controls broto-mock-exam-time-limit-controls--modal">
                  <span
                    className="broto-mock-exam-field-label broto-mock-exam-time-limit-controls__area-minutos"
                    id="mock-time-label-modal"
                  >
                    Minutos totais
                  </span>
                  <div className="broto-mock-exam-time-limit-controls__fine-head">
                    <label
                      className="broto-mock-exam-field-label broto-mock-exam-field-label--inline"
                      htmlFor="mock-time-range-modal"
                    >
                      Ajuste fino
                    </label>
                    <span className="broto-mock-exam-time-limit-controls__fine-meta">
                      {MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}–{MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                    </span>
                  </div>
                  <div className="broto-mock-exam-time-limit-controls__stepper-cell">
                    <div
                      className="broto-mock-exam-stepper"
                      role="group"
                      aria-labelledby="mock-time-label-modal"
                    >
                      <button
                        type="button"
                        className="broto-mock-exam-stepper__btn"
                        aria-label="Diminuir limite de tempo em 5 minutos"
                        disabled={tLim <= MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                        onClick={() =>
                          setTimeLimitMinutes((m) => clampMockExamTimeLimitMinutes(m - 5))
                        }
                      >
                        <Minus size={18} strokeWidth={2.2} aria-hidden />
                      </button>
                      <span className="broto-mock-exam-stepper__value" aria-live="polite">
                        {tLim}
                      </span>
                      <button
                        type="button"
                        className="broto-mock-exam-stepper__btn"
                        aria-label="Aumentar limite de tempo em 5 minutos"
                        disabled={tLim >= MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                        onClick={() =>
                          setTimeLimitMinutes((m) => clampMockExamTimeLimitMinutes(m + 5))
                        }
                      >
                        <Plus size={18} strokeWidth={2.2} aria-hidden />
                      </button>
                    </div>
                    <p className="broto-mock-exam-microcopy broto-mock-exam-microcopy--tight">
                      Entre {MOCK_EXAM_TIME_LIMIT_MINUTES_MIN} e {MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}{' '}
                      minutos.
                    </p>
                  </div>
                  <div className="broto-mock-exam-time-limit-controls__slider-cell">
                    <input
                      id="mock-time-range-modal"
                      className="broto-mock-exam-range"
                      type="range"
                      min={MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                      max={MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                      step={5}
                      value={tLim}
                      onChange={(e) =>
                        setTimeLimitMinutes(clampMockExamTimeLimitMinutes(Number(e.target.value)))
                      }
                      aria-valuemin={MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                      aria-valuemax={MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                      aria-valuenow={tLim}
                      aria-label="Limite de tempo total em minutos"
                      style={
                        {
                          ['--mock-range-pct' as string]: `${((tLim - MOCK_EXAM_TIME_LIMIT_MINUTES_MIN) / (MOCK_EXAM_TIME_LIMIT_MINUTES_MAX - MOCK_EXAM_TIME_LIMIT_MINUTES_MIN)) * 100}%`,
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
              ) : null}

              {submitError ? (
                <div className="broto-mock-exam-alert" role="alert" style={{ marginTop: 16 }}>
                  {submitError}
                </div>
              ) : null}

              <button
                type="button"
                className="broto-btn-primary broto-mock-exam-modal-cta"
                style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
                disabled={submitting || !baseUrl || modalTopicStillLoading}
                onClick={() => void handleStart()}
              >
                {submitting ? (
                  <Loader2 size={18} className="broto-loader-spin" aria-hidden />
                ) : (
                  <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
                )}
                Ir para a sessão
              </button>
            </div>
          </div>
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
              aria-label="Configuração da sessão (tipo simulado)"
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
                    <option value={ALL_YEARS_VALUE}>
                      Todos os anos ({yearBounds.min}–{yearBounds.max})
                    </option>
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <p
                    id="mock-year-hint"
                    className="broto-mock-exam-microcopy broto-mock-exam-microcopy--tight"
                  >
                    Opcional — limite o banco a um ano da prova.
                  </p>
                </div>

                <div className="broto-mock-exam-slider-block">
                  <div className="broto-mock-exam-slider-head">
                    <label className="broto-mock-exam-slider-head__label" htmlFor="mock-n-range">
                      Quantidade de questões
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
                    aria-label="Quantidade de questões na sessão"
                    style={
                      {
                        ['--mock-range-pct' as string]: `${((nQ - MOCK_EXAM_N_MIN) / (MOCK_EXAM_N_MAX - MOCK_EXAM_N_MIN)) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </div>

              <label className="broto-mock-exam-switch broto-mock-exam-switch--rich broto-mock-exam-switch--full-row">
                <span className="broto-mock-exam-switch__icon-wrap" aria-hidden>
                  <Eye size={18} strokeWidth={2} />
                </span>
                <span className="broto-mock-exam-switch__lead">
                  <span className="broto-mock-exam-switch__title">
                    {answerFeedbackMode === 'immediate'
                      ? 'Acompanhar respostas'
                      : 'Ver respostas no final'}
                  </span>
                  <span className="broto-mock-exam-switch__subtitle">
                    {answerFeedbackMode === 'immediate'
                      ? 'Mostra a correção depois de cada questão.'
                      : 'Sem revelar certo/errado até o resultado.'}
                  </span>
                </span>
                <span className="broto-mock-exam-switch__control">
                  <input
                    type="checkbox"
                    className="broto-mock-exam-switch__input"
                    checked={answerFeedbackMode === 'immediate'}
                    onChange={(e) =>
                      setAnswerFeedbackMode(e.target.checked ? 'immediate' : 'final')
                    }
                    aria-label="Acompanhar respostas durante a sessão"
                  />
                  <span className="broto-mock-exam-switch__track" aria-hidden>
                    <span className="broto-mock-exam-switch__thumb" />
                  </span>
                </span>
              </label>

              <div className="broto-mock-exam-divider" role="presentation" />

              <label className="broto-mock-exam-switch broto-mock-exam-switch--rich">
                <span className="broto-mock-exam-switch__icon-wrap" aria-hidden>
                  <Timer size={18} strokeWidth={2} />
                </span>
                <span className="broto-mock-exam-switch__lead">
                  <span className="broto-mock-exam-switch__title">Limite de tempo</span>
                  <span className="broto-mock-exam-switch__subtitle">
                    Ao zerar o cronômetro, a sessão encerra e você vê o resultado com o que já
                    respondeu.
                  </span>
                </span>
                <span className="broto-mock-exam-switch__control">
                  <input
                    type="checkbox"
                    className="broto-mock-exam-switch__input"
                    checked={timeLimitEnabled}
                    onChange={(e) => {
                      const on = e.target.checked
                      setTimeLimitEnabled(on)
                      if (on) setTimeLimitMinutes(suggestedTimeLimit)
                    }}
                  />
                  <span className="broto-mock-exam-switch__track" aria-hidden>
                    <span className="broto-mock-exam-switch__thumb" />
                  </span>
                </span>
              </label>

              {timeLimitEnabled ? (
                <div className="broto-mock-exam-time-limit-controls">
                  <span
                    className="broto-mock-exam-field-label broto-mock-exam-time-limit-controls__area-minutos"
                    id="mock-time-label"
                  >
                    Minutos totais
                  </span>
                  <div className="broto-mock-exam-time-limit-controls__fine-head">
                    <label
                      className="broto-mock-exam-field-label broto-mock-exam-field-label--inline"
                      htmlFor="mock-time-range"
                    >
                      Ajuste fino
                    </label>
                    <span className="broto-mock-exam-time-limit-controls__fine-meta">
                      {MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}–{MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                    </span>
                  </div>
                  <div className="broto-mock-exam-time-limit-controls__stepper-cell">
                    <div
                      className="broto-mock-exam-stepper"
                      role="group"
                      aria-labelledby="mock-time-label"
                    >
                      <button
                        type="button"
                        className="broto-mock-exam-stepper__btn"
                        aria-label="Diminuir limite de tempo em 5 minutos"
                        disabled={tLim <= MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                        onClick={() =>
                          setTimeLimitMinutes((m) => clampMockExamTimeLimitMinutes(m - 5))
                        }
                      >
                        <Minus size={18} strokeWidth={2.2} aria-hidden />
                      </button>
                      <span className="broto-mock-exam-stepper__value" aria-live="polite">
                        {tLim}
                      </span>
                      <button
                        type="button"
                        className="broto-mock-exam-stepper__btn"
                        aria-label="Aumentar limite de tempo em 5 minutos"
                        disabled={tLim >= MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                        onClick={() =>
                          setTimeLimitMinutes((m) => clampMockExamTimeLimitMinutes(m + 5))
                        }
                      >
                        <Plus size={18} strokeWidth={2.2} aria-hidden />
                      </button>
                    </div>
                    <p className="broto-mock-exam-microcopy broto-mock-exam-microcopy--tight">
                      Entre {MOCK_EXAM_TIME_LIMIT_MINUTES_MIN} e {MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}{' '}
                      minutos.
                    </p>
                  </div>
                  <div className="broto-mock-exam-time-limit-controls__slider-cell">
                    <input
                      id="mock-time-range"
                      className="broto-mock-exam-range"
                      type="range"
                      min={MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                      max={MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                      step={5}
                      value={tLim}
                      onChange={(e) =>
                        setTimeLimitMinutes(clampMockExamTimeLimitMinutes(Number(e.target.value)))
                      }
                      aria-valuemin={MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                      aria-valuemax={MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                      aria-valuenow={tLim}
                      aria-label="Limite de tempo total da sessão em minutos"
                      style={
                        {
                          ['--mock-range-pct' as string]: `${((tLim - MOCK_EXAM_TIME_LIMIT_MINUTES_MIN) / (MOCK_EXAM_TIME_LIMIT_MINUTES_MAX - MOCK_EXAM_TIME_LIMIT_MINUTES_MIN)) * 100}%`,
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
              ) : null}
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
              <details
                className="broto-mock-exam-details"
                open={refineDetailsOpen}
                onToggle={(e) => setRefineDetailsOpen((e.target as HTMLDetailsElement).open)}
              >
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
                <h2 className="broto-mock-exam-card-head__title">Resumo da sessão</h2>
              </div>

              <div className="broto-mock-exam-preview-ring-wrap">
                <div className="broto-mock-exam-preview-ring" aria-hidden>
                  <svg viewBox="0 0 120 120" className="broto-mock-exam-preview-ring__svg">
                    <circle
                      className="broto-mock-exam-preview-ring__bg"
                      cx="60"
                      cy="60"
                      r={ringR}
                    />
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
                <li className="broto-mock-exam-aside-list__item">
                  <span
                    className="broto-mock-exam-aside-list__dot"
                    style={{ background: 'var(--status-violet)' }}
                    aria-hidden
                  />
                  <span className="broto-mock-exam-aside-list__text">
                    <span className="broto-mock-exam-aside-list__k">Prazo</span>
                    {asideTimeLabel}
                  </span>
                </li>
                <li className="broto-mock-exam-aside-list__item">
                  <span
                    className="broto-mock-exam-aside-list__dot"
                    style={{ background: 'var(--green-400)' }}
                    aria-hidden
                  />
                  <span className="broto-mock-exam-aside-list__text">
                    <span className="broto-mock-exam-aside-list__k">Correção</span>
                    {asideFeedbackLabel}
                  </span>
                </li>
              </ul>

              <p className="broto-mock-exam-aside-estimate">
                <Clock size={16} strokeWidth={2} aria-hidden />
                <span>
                  Tempo estimado: ~{estMinutes} min
                  {timeLimitEnabled ? ` · Limite: ${tLim} min` : ''}
                </span>
              </p>

              <button
                type="button"
                className="broto-btn-primary"
                disabled={submitting || !baseUrl}
                onClick={() => void handleStart()}
              >
                {submitting ? (
                  <Loader2 size={18} className="broto-loader-spin" aria-hidden />
                ) : (
                  <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
                )}
                Iniciar sessão
              </button>
            </div>
          </aside>
        </div>
      )}

      {variant === 'page' && infoModal
        ? createPortal(
            <div
              role="presentation"
              className="broto-mock-exam-info-modal-backdrop"
              onClick={closeInfoModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mock-exam-info-modal-title"
                ref={infoModalRef}
                className={
                  'broto-mock-exam-info-modal' +
                  (infoModal === 'group' ? ' broto-mock-exam-info-modal--group' : '')
                }
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="broto-mock-exam-info-modal__close"
                  ref={infoModalCloseRef}
                  aria-label="Fechar modal"
                  onClick={closeInfoModal}
                >
                  <X size={17} strokeWidth={2.2} aria-hidden />
                </button>

                {infoModal === 'tips' ? (
                  <div className="broto-mock-exam-tips-card broto-mock-exam-tips-card--modal">
                    <div className="broto-mock-exam-card-head broto-mock-exam-card-head--in-card">
                      <span
                        className="broto-mock-exam-card-head__dot"
                        style={{ background: 'var(--gold-400)' }}
                        aria-hidden
                      />
                      <h2
                        id="mock-exam-info-modal-title"
                        className="broto-mock-exam-card-head__title"
                      >
                        Dicas
                      </h2>
                    </div>
                    <ul className="broto-mock-exam-tips">
                      <li className="broto-mock-exam-tips__item">
                        <Lightbulb
                          size={16}
                          strokeWidth={2}
                          className="broto-mock-exam-tips__icon"
                          aria-hidden
                        />
                        <span>Reserve um bloco contínuo, como no dia da prova.</span>
                      </li>
                      <li className="broto-mock-exam-tips__item">
                        <Target
                          size={16}
                          strokeWidth={2}
                          className="broto-mock-exam-tips__icon"
                          aria-hidden
                        />
                        <span>Leia o enunciado inteiro antes de marcar a alternativa.</span>
                      </li>
                      <li className="broto-mock-exam-tips__item">
                        <BarChart3
                          size={16}
                          strokeWidth={2}
                          className="broto-mock-exam-tips__icon"
                          aria-hidden
                        />
                        <span>Depois, confira o resultado por área no seu progresso.</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div
                    className="broto-mock-exam-group-teaser broto-mock-exam-group-teaser--modal"
                    aria-label="Prévia visual de sessão em grupo no estilo prova. Recurso ainda não disponível."
                  >
                    <div className="broto-mock-exam-group-teaser__head">
                      <div className="broto-mock-exam-card-head broto-mock-exam-card-head--in-card broto-mock-exam-group-teaser__card-head">
                        <span
                          className="broto-mock-exam-card-head__dot"
                          style={{ background: 'var(--status-sky)' }}
                          aria-hidden
                        />
                        <h2
                          id="mock-exam-info-modal-title"
                          className="broto-mock-exam-card-head__title"
                        >
                          Sessão em grupo
                        </h2>
                      </div>
                      <span className="broto-mock-exam-group-teaser__badge">Em breve</span>
                    </div>

                    <p className="broto-mock-exam-group-teaser__lead">
                      Convide amigos, todos respondem ao mesmo conjunto de questões e, ao final,
                      aparece quantos acertos cada um teve — ideal para estudar junto e comparar o
                      desempenho.
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
                          Mesmas questões para todos — com limite de tempo opcional ou ritmo livre.
                        </span>
                      </li>
                      <li className="broto-mock-exam-group-teaser__flow-item">
                        <span className="broto-mock-exam-group-teaser__flow-icon" aria-hidden>
                          <Trophy size={15} strokeWidth={2} />
                        </span>
                        <span>
                          <strong className="broto-mock-exam-group-teaser__flow-k">Ranking</strong>{' '}
                          O painel mostra acertos por pessoa (ex.: 14 acertos em 20 questões).
                        </span>
                      </li>
                    </ul>

                    <div className="broto-mock-exam-group-teaser__board" aria-hidden>
                      <p className="broto-mock-exam-group-teaser__board-label">
                        Exemplo de painel ao final
                      </p>
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
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {selectionWarningOpen
        ? createPortal(
            <div
              role="presentation"
              className="broto-mock-exam-info-modal-backdrop"
              onClick={closeSelectionWarning}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="mock-exam-selection-warning-title"
                aria-describedby="mock-exam-selection-warning-desc"
                ref={selectionWarningModalRef}
                className="broto-mock-exam-info-modal broto-mock-exam-warning-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="broto-mock-exam-info-modal__close"
                  aria-label="Fechar aviso"
                  onClick={closeSelectionWarning}
                >
                  <X size={17} strokeWidth={2.2} aria-hidden />
                </button>
                <div className="broto-mock-exam-warning-modal__head">
                  <span className="broto-mock-exam-warning-modal__icon-wrap" aria-hidden>
                    <AlertTriangle size={22} strokeWidth={2.2} />
                  </span>
                  <h2 id="mock-exam-selection-warning-title" className="broto-mock-exam-warning-modal__title">
                    Atenção
                  </h2>
                </div>
                <p id="mock-exam-selection-warning-desc" className="broto-mock-exam-warning-modal__body">
                  {AREA_OR_RANDOM_WARNING}
                </p>
                <button
                  type="button"
                  ref={selectionWarningBtnRef}
                  className="broto-btn-primary broto-mock-exam-warning-modal__ok"
                  onClick={closeSelectionWarning}
                >
                  Entendi
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
