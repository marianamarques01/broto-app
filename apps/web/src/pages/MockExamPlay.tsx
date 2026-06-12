import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import { MockExamSessionExitModal } from '@/components/mock-exam/MockExamSessionExitModal'
import { MockExamSessionProgressPanel } from '@/components/mock-exam/MockExamSessionProgressPanel'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import {
  answerFeedbackModeFromPracticeConfig,
  areaKeyFromTopico,
  buildPracticeSessionSummary,
  fetchMockExamQuestions,
  getQuestionId,
  mockExamResultsFromSessionAnswers,
  parseEnemAreaKey,
  parsePracticeSessionProgress,
  timeLimitMinutesFromPracticeConfig,
  type MockExamAnswerResult,
  type PracticeSessionAnswerReviewItem,
  type Question,
} from '@broto/shared'
import { Clock } from 'lucide-react'
import { trackMvpFunnelStep } from '@/lib/mvp-funnel'

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function formatTimerClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type SessionGetRes = {
  sessionId?: string
  questionIds?: string[]
  config?: unknown
  progress?: unknown
  sessionAnswers?: { questionId?: string; isCorrect?: boolean }[]
}

function initialQuestionIds(
  state: { questions?: Question[]; questionIds?: string[] } | undefined,
): string[] {
  if (state?.questionIds?.length) return state.questionIds
  if (state?.questions?.length) return state.questions.map((q) => getQuestionId(q))
  return []
}

export function MockExamPlay() {
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { organization } = useClass()
  const baseUrl = getQuestionsStaticBaseUrl(organization?.slug ?? null)

  const state = location.state as
    | {
        questions?: Question[]
        sessionId?: string
        questionIds?: string[]
        config?: unknown
        isDiagnostic?: boolean
      }
    | undefined

  const skipQuestionFetchRef = useRef(!!state?.questions?.length)
  const didHydrateSessionRef = useRef(false)

  const [questions, setQuestions] = useState<Question[] | null>(state?.questions ?? null)
  const [sessionId, setSessionId] = useState<string | null>(
    state?.sessionId ?? routeSessionId ?? null,
  )
  const [questionIds, setQuestionIds] = useState<string[]>(() => initialQuestionIds(state))
  const questionIdsRef = useRef(questionIds)

  useEffect(() => {
    questionIdsRef.current = questionIds
  }, [questionIds])
  const [index, setIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [topicByQuestionId, setTopicByQuestionId] = useState<Record<string, string | undefined>>({})
  const resultsRef = useRef<MockExamAnswerResult[]>([])
  const [elapsedSec, setElapsedSec] = useState(0)
  const startTimeRef = useRef(0)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(() =>
    timeLimitMinutesFromPracticeConfig(state?.config),
  )
  const [answerFeedbackMode, setAnswerFeedbackMode] = useState(() =>
    answerFeedbackModeFromPracticeConfig(state?.config),
  )
  const finishingRef = useRef(false)
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<string, { isCorrect: boolean } | undefined>
  >({})
  const answersByQuestionIdRef = useRef(answersByQuestionId)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => new Set())
  const [exitModalOpen, setExitModalOpen] = useState(false)
  const [exitBusy, setExitBusy] = useState<'save' | 'discard' | null>(null)
  const [finalizingVisible, setFinalizingVisible] = useState(false)

  useEffect(() => {
    answersByQuestionIdRef.current = answersByQuestionId
  }, [answersByQuestionId])

  useEffect(() => {
    didHydrateSessionRef.current = false
  }, [routeSessionId])

  useEffect(() => {
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    trackMvpFunnelStep('first_mock_exam_started', { sessionId })
  }, [sessionId])

  const missingRouteBootstrap = useMemo(() => {
    return !routeSessionId && !state?.questions?.length
  }, [routeSessionId, state?.questions])

  useEffect(() => {
    if (!baseUrl || questionIds.length === 0) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${baseUrl}/data/question-topic-mapping.json`)
        const data = (await res.json()) as { mapping?: Record<string, string> }
        const mapping = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {}
        if (cancelled) return
        const next: Record<string, string | undefined> = {}
        for (const id of questionIds) {
          next[id] = mapping[id]
        }
        setTopicByQuestionId(next)
      } catch {
        if (!cancelled) setTopicByQuestionId({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [baseUrl, questionIds])

  useEffect(() => {
    if (!routeSessionId) return
    let cancelled = false
    void (async () => {
      try {
        const data = await api.post<SessionGetRes>('/api/practice-session/get', {
          sessionId: routeSessionId,
        })
        if (cancelled) return
        setSessionId(data.sessionId ?? routeSessionId)
        const tl = timeLimitMinutesFromPracticeConfig(data.config)
        setTimeLimitMinutes((prev) => prev ?? tl)
        setAnswerFeedbackMode(answerFeedbackModeFromPracticeConfig(data.config))

        const idsFromApi = Array.isArray(data.questionIds) ? data.questionIds.map(String) : []

        if (!didHydrateSessionRef.current) {
          didHydrateSessionRef.current = true
          const idsForClamp =
            skipQuestionFetchRef.current && questionIdsRef.current.length > 0
              ? questionIdsRef.current
              : idsFromApi

          if (Array.isArray(data.sessionAnswers) && data.sessionAnswers.length > 0) {
            const map: Record<string, { isCorrect: boolean }> = {}
            const rows: { questionId: string; isCorrect: boolean }[] = []
            for (const raw of data.sessionAnswers) {
              if (!raw || typeof raw.questionId !== 'string') continue
              const qid = raw.questionId.trim()
              if (!qid) continue
              const isCorrect = raw.isCorrect === true
              map[qid] = { isCorrect }
              rows.push({ questionId: qid, isCorrect })
            }
            setAnswersByQuestionId(map)
            resultsRef.current = mockExamResultsFromSessionAnswers(rows)
          }

          const prog = parsePracticeSessionProgress(data.progress)
          if (prog && idsForClamp.length > 0) {
            setIndex(Math.min(Math.max(0, prog.currentIndex), idsForClamp.length - 1))
            setSkippedIds(new Set(prog.skippedQuestionIds.filter((id) => idsForClamp.includes(id))))
          }
        }

        if (skipQuestionFetchRef.current) return
        if (!baseUrl) return

        const ids = idsFromApi
        if (ids.length === 0) {
          setLoadError('Não foi possível recuperar a lista de questões.')
          return
        }
        setQuestionIds(ids)
        const loaded = await fetchMockExamQuestions(baseUrl, ids)
        if (cancelled) return
        if (loaded.length === 0) {
          setLoadError('Erro ao carregar questões do armazenamento.')
          return
        }
        setQuestions(loaded)
      } catch {
        if (!cancelled) setLoadError('Erro ao carregar a sessão.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [routeSessionId, baseUrl])

  const orderedQuestionIds = useMemo(
    () => (questions ?? []).map((q) => getQuestionId(q)),
    [questions],
  )

  const allAnswered = useMemo(() => {
    if (!orderedQuestionIds.length) return false
    return orderedQuestionIds.every((id) => answersByQuestionId[id] !== undefined)
  }, [orderedQuestionIds, answersByQuestionId])

  const onAnswerRecorded = useCallback((r: MockExamAnswerResult) => {
    resultsRef.current = [...resultsRef.current.filter((x) => x.questionId !== r.questionId), r]
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [r.questionId]: { isCorrect: r.isCorrect },
    }))
    setSkippedIds((prev) => {
      const n = new Set(prev)
      n.delete(r.questionId)
      return n
    })
  }, [])

  const finalizeExam = useCallback(() => {
    const list = questions
    const sid = sessionId
    if (!list || !sid || finishingRef.current) return
    finishingRef.current = true
    setFinalizingVisible(true)
    const summary = buildPracticeSessionSummary(resultsRef.current, list, topicByQuestionId)
    const questionsById = new Map(list.map((question) => [getQuestionId(question), question]))
    const answerReview: PracticeSessionAnswerReviewItem[] = resultsRef.current.map((result) => {
      const question = questionsById.get(result.questionId)
      const correctLetter =
        result.correctLetter ?? question?.alternatives.find((alt) => alt.isCorrect)?.letter ?? null

      return {
        questionId: result.questionId,
        label: question ? `ENEM ${question.year} · Questão ${question.index}` : result.questionId,
        selectedLetter: result.selectedLetter,
        correctLetter,
        isCorrect: result.isCorrect,
      }
    })
    const summaryToPersist =
      answerFeedbackMode === 'final' ? { ...summary, respostas: answerReview } : summary
    void api
      .patch('/api/practice-session/complete', { sessionId: sid, summary: summaryToPersist })
      .catch(() => {})
    navigate(`/study/mock-exam/result?sessionId=${encodeURIComponent(sid)}`, {
      state: {
        summary: summaryToPersist,
        sessionId: sid,
        answerReview,
        showAnswerReview: answerFeedbackMode === 'final',
      },
    })
  }, [questions, sessionId, navigate, topicByQuestionId, answerFeedbackMode])

  useEffect(() => {
    if (timeLimitMinutes == null || !questions?.length || !sessionId) return
    const limitSec = timeLimitMinutes * 60
    if (elapsedSec < limitSec) return
    finalizeExam()
  }, [elapsedSec, timeLimitMinutes, questions, sessionId, finalizeExam])

  const handlePrevious = useCallback(() => {
    if (finishingRef.current || index <= 0) return
    const list = questions
    if (!list) return
    const curId = getQuestionId(list[index])
    if (!answersByQuestionIdRef.current[curId]) {
      setSkippedIds((prev) => new Set(prev).add(curId))
    }
    setIndex((i) => i - 1)
  }, [questions, index])

  const handleNext = useCallback(() => {
    if (finishingRef.current) return
    const list = questions
    if (!list) return
    if (index >= list.length - 1) {
      if (allAnswered) finalizeExam()
      return
    }
    setIndex((i) => i + 1)
  }, [questions, index, allAnswered, finalizeExam])

  const goToQuestion = useCallback(
    (nextIdx: number) => {
      if (!questions || finishingRef.current) return
      if (nextIdx < 0 || nextIdx >= questions.length) return
      if (nextIdx === index) return
      const curId = getQuestionId(questions[index])
      if (!answersByQuestionIdRef.current[curId]) {
        setSkippedIds((prev) => new Set(prev).add(curId))
      }
      setIndex(nextIdx)
    },
    [questions, index],
  )

  const handleSaveAndExit = useCallback(async () => {
    const sid = sessionId
    if (!sid) return
    setExitBusy('save')
    try {
      await api.patch('/api/practice-session/progress', {
        sessionId: sid,
        progress: {
          currentIndex: index,
          skippedQuestionIds: [...skippedIds],
        },
      })
      navigate('/study/mock-exam')
    } catch {
      // falha silenciosa
    } finally {
      setExitBusy(null)
      setExitModalOpen(false)
    }
  }, [sessionId, index, skippedIds, navigate])

  const handleExitWithoutSave = useCallback(async () => {
    const sid = sessionId
    if (!sid) return
    setExitBusy('discard')
    try {
      await api.post('/api/practice-session/abandon', { sessionId: sid })
      navigate('/study/mock-exam')
    } catch {
      // falha silenciosa
    } finally {
      setExitBusy(null)
      setExitModalOpen(false)
    }
  }, [sessionId, navigate])

  const q = questions?.[index]
  const progressLabel =
    questions && questions.length > 0 ? `${index + 1} / ${questions.length}` : ''

  const lastIndex = (questions?.length ?? 1) - 1

  if (missingRouteBootstrap) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Sessão ENEM" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p style={{ color: 'var(--red-400)' }}>
            Sessão inválida. Comece uma nova na página da sessão.
          </p>
          <Link
            to="/study/mock-exam"
            className="broto-btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            Nova sessão
          </Link>
        </div>
      </div>
    )
  }

  if (!baseUrl && !(questions && questions.length)) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Sessão ENEM" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p style={{ color: 'var(--red-400)' }}>
            Configuração incompleta (URL do Supabase). Não é possível carregar questões.
          </p>
          <Link
            to="/study/mock-exam"
            className="broto-btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Sessão ENEM" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p style={{ color: 'var(--red-400)' }}>{loadError}</p>
          <Link
            to="/study/mock-exam"
            className="broto-btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            Nova sessão
          </Link>
        </div>
      </div>
    )
  }

  if (!q || !sessionId) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Sessão ENEM" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p className="broto-muted">Carregando...</p>
        </div>
      </div>
    )
  }

  const topicSlug = topicByQuestionId[getQuestionId(q)]
  const fromTopicSlug = topicSlug != null ? areaKeyFromTopico(topicSlug) : 'outros'
  const areaKey =
    parseEnemAreaKey(q.discipline) ?? (fromTopicSlug !== 'outros' ? fromTopicSlug : undefined)
  const totalQ = questions?.length ?? 0
  const progressPct = totalQ > 0 ? ((index + 1) / totalQ) * 100 : 0
  const limitSec = timeLimitMinutes != null ? timeLimitMinutes * 60 : null
  const remainingSec = limitSec != null ? Math.max(0, limitSec - elapsedSec) : null
  const timerWarn = remainingSec != null && remainingSec > 0 && remainingSec <= 300
  const timerProgressPct =
    limitSec != null ? Math.max(0, Math.min(100, ((remainingSec ?? 0) / limitSec) * 100)) : null

  return (
    <div className="broto-page broto-page--study">
      <TopBar title="Sessão ENEM" subtitle={progressLabel} variant="study" />
      <div className="broto-main-inner" style={{ padding: '16px 18px' }}>
        <div className="broto-mock-exam-play-layout">
          <div className="broto-mock-exam-play-layout__main">
            <div className="broto-mock-exam-progress">
              <div
                className="broto-mock-exam-progress__fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="broto-mock-exam-status">
              <div className="broto-mock-exam-status__left">
                <span className="broto-mock-exam-status__counter">
                  Questão {index + 1} de {totalQ}
                </span>
              </div>
              <div className="broto-mock-exam-status__actions">
                <div
                  className={`broto-mock-exam-status__timer-hover${timerWarn ? ' broto-mock-exam-status__timer-hover--warn' : ''}`}
                >
                  <span
                    className="broto-mock-exam-status__timer-chip"
                    tabIndex={0}
                    aria-label={
                      remainingSec != null
                        ? `Tempo restante ${formatTimerClock(remainingSec)}. Passe o mouse ou foque para ver detalhes.`
                        : `Tempo decorrido ${formatTimerClock(elapsedSec)}. Passe o mouse ou foque para ver detalhes.`
                    }
                  >
                    <Clock size={14} strokeWidth={2} aria-hidden />
                    <span className="broto-mock-exam-status__timer-chip-time">
                      {formatTimerClock(remainingSec != null ? remainingSec : elapsedSec)}
                    </span>
                  </span>
                  <div className="broto-mock-exam-status__timer-popover" role="tooltip">
                    {remainingSec != null ? (
                      <>
                        <p className="broto-mock-exam-status__timer-popover-title">
                          Tempo restante
                        </p>
                        <div
                          className="broto-mock-exam-status__timer-track broto-mock-exam-status__timer-track--popover"
                          role="progressbar"
                          aria-label="Progresso do tempo da sessão"
                          aria-valuemin={0}
                          aria-valuemax={limitSec ?? undefined}
                          aria-valuenow={remainingSec}
                        >
                          <span
                            className={`broto-mock-exam-status__timer-fill${timerWarn ? ' broto-mock-exam-status__timer-fill--warn' : ''}`}
                            style={{ width: `${timerProgressPct ?? 0}%` }}
                          />
                        </div>
                        <p className="broto-mock-exam-status__timer-popover-meta">
                          Decorrido · {formatElapsed(elapsedSec)}
                        </p>
                        {timeLimitMinutes != null ? (
                          <p className="broto-mock-exam-status__timer-popover-meta">
                            Limite da sessão · {timeLimitMinutes} min
                          </p>
                        ) : null}
                        {timerWarn ? (
                          <p className="broto-mock-exam-status__timer-popover-warn">Reta final</p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="broto-mock-exam-status__timer-popover-title">
                          Tempo de prova
                        </p>
                        <p className="broto-mock-exam-status__timer-popover-meta">
                          Decorrido · {formatElapsed(elapsedSec)}
                        </p>
                        <p className="broto-mock-exam-status__timer-popover-meta">
                          Sessão sem limite de tempo
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <QuestionPlayer
              question={q}
              areaKey={areaKey}
              onPrevious={handlePrevious}
              previousDisabled={index <= 0}
              onNext={handleNext}
              nextCtaLabel={index >= lastIndex && allAnswered ? 'Ver resultado' : undefined}
              nextDisabled={index >= lastIndex && !allAnswered}
              sessionId={sessionId}
              onAnswerRecorded={onAnswerRecorded}
              revealAnswerOnSelect={answerFeedbackMode === 'immediate'}
            />
          </div>

          <MockExamSessionProgressPanel
            totalQuestions={totalQ}
            currentIndex={index}
            questionIdsOrdered={orderedQuestionIds}
            answersByQuestionId={answersByQuestionId}
            skippedQuestionIds={skippedIds}
            onSelectIndex={goToQuestion}
            allAnswered={allAnswered}
            onFinalize={finalizeExam}
            finalizing={finalizingVisible}
            onDesistir={() => setExitModalOpen(true)}
          />
        </div>
      </div>

      <MockExamSessionExitModal
        open={exitModalOpen}
        onClose={() => {
          if (!exitBusy) setExitModalOpen(false)
        }}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSave={handleExitWithoutSave}
        busyAction={exitBusy}
        isDiagnostic={state?.isDiagnostic ?? false}
      />
    </div>
  )
}
