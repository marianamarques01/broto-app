import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import {
  buildPracticeSessionSummary,
  fetchMockExamQuestions,
  getQuestionId,
  timeLimitMinutesFromPracticeConfig,
  type MockExamAnswerResult,
  type Question,
} from '@broto/shared'
import { Clock, LogOut } from 'lucide-react'
import { trackMvpFunnelStep } from '@/lib/mvp-funnel'

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

type SessionGetRes = {
  sessionId?: string
  questionIds?: string[]
  config?: unknown
}

function initialQuestionIds(state: { questions?: Question[]; questionIds?: string[] } | undefined): string[] {
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
    | { questions?: Question[]; sessionId?: string; questionIds?: string[]; config?: unknown }
    | undefined

  const skipQuestionFetchRef = useRef(!!(state?.questions?.length))

  const [questions, setQuestions] = useState<Question[] | null>(state?.questions ?? null)
  const [sessionId, setSessionId] = useState<string | null>(state?.sessionId ?? routeSessionId ?? null)
  const [questionIds, setQuestionIds] = useState<string[]>(() => initialQuestionIds(state))
  const [index, setIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [topicByQuestionId, setTopicByQuestionId] = useState<Record<string, string | undefined>>({})
  const resultsRef = useRef<MockExamAnswerResult[]>([])
  const [elapsedSec, setElapsedSec] = useState(0)
  const startTimeRef = useRef(0)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(() =>
    timeLimitMinutesFromPracticeConfig(state?.config),
  )
  const finishingRef = useRef(false)

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
    return !routeSessionId && !(state?.questions?.length)
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

        if (skipQuestionFetchRef.current) return
        if (!baseUrl) return

        const ids = Array.isArray(data.questionIds) ? data.questionIds.map(String) : []
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

  const onAnswerRecorded = useCallback((r: MockExamAnswerResult) => {
    resultsRef.current = [...resultsRef.current, r]
  }, [])

  const finalizeExam = useCallback(() => {
    const list = questions
    const sid = sessionId
    if (!list || !sid || finishingRef.current) return
    finishingRef.current = true
    const summary = buildPracticeSessionSummary(resultsRef.current, list, topicByQuestionId)
    void api.patch('/api/practice-session/complete', { sessionId: sid, summary }).catch(() => {})
    navigate(`/study/mock-exam/result?sessionId=${encodeURIComponent(sid)}`, {
      state: { summary, sessionId: sid },
    })
  }, [questions, sessionId, navigate, topicByQuestionId])

  useEffect(() => {
    if (timeLimitMinutes == null || !questions?.length || !sessionId) return
    const limitSec = timeLimitMinutes * 60
    if (elapsedSec < limitSec) return
    finalizeExam()
  }, [elapsedSec, timeLimitMinutes, questions, sessionId, finalizeExam])

  const handleNext = useCallback(() => {
    if (finishingRef.current) return
    const list = questions
    const sid = sessionId
    if (!list || !sid) return
    if (index >= list.length - 1) {
      finalizeExam()
      return
    }
    setIndex((i) => i + 1)
  }, [questions, sessionId, index, finalizeExam])

  const q = questions?.[index]
  const progressLabel =
    questions && questions.length > 0 ? `${index + 1} / ${questions.length}` : ''

  if (missingRouteBootstrap) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Sessão ENEM" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p style={{ color: 'var(--red-400)' }}>
            Sessão inválida. Comece uma nova na página da sessão.
          </p>
          <Link to="/study/mock-exam" className="broto-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
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
          <Link to="/study/mock-exam" className="broto-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
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
          <Link to="/study/mock-exam" className="broto-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
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

  const areaKey = q.discipline ?? 'outros'
  const totalQ = questions?.length ?? 0
  const progressPct = totalQ > 0 ? ((index + 1) / totalQ) * 100 : 0
  const limitSec = timeLimitMinutes != null ? timeLimitMinutes * 60 : null
  const remainingSec = limitSec != null ? Math.max(0, limitSec - elapsedSec) : null
  const timerWarn = remainingSec != null && remainingSec > 0 && remainingSec <= 300

  return (
    <div className="broto-page broto-page--study">
      <TopBar title="Sessão ENEM" subtitle={progressLabel} variant="study" />
      <div className="broto-main-inner" style={{ maxWidth: 800, margin: '0 auto', padding: '16px 18px' }}>
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
            <div className="broto-mock-exam-status__timers">
              {remainingSec != null ? (
                <>
                  <span
                    className={`broto-mock-exam-status__timer broto-mock-exam-status__timer--countdown${timerWarn ? ' broto-mock-exam-status__timer--warn' : ''}`}
                  >
                    <Clock size={14} />
                    Restante {formatElapsed(remainingSec)}
                  </span>
                  <span className="broto-mock-exam-status__timer-elapsed">
                    Decorrido {formatElapsed(elapsedSec)}
                  </span>
                </>
              ) : (
                <span className="broto-mock-exam-status__timer">
                  <Clock size={14} />
                  {formatElapsed(elapsedSec)}
                </span>
              )}
            </div>
          </div>
          <Link to="/study/mock-exam" className="broto-mock-exam-exit-link">
            <LogOut size={14} />
            Sair
          </Link>
        </div>

        <QuestionPlayer
          question={q}
          areaKey={areaKey}
          onNext={handleNext}
          sessionId={sessionId}
          onAnswerRecorded={onAnswerRecorded}
        />
      </div>
    </div>
  )
}
