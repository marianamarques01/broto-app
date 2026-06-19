import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { api } from '@/lib/api-client'
import type { PracticeSessionAnswerReviewItem, PracticeSessionSummary } from '@broto/shared'
import { isPracticeSessionSummary } from '@broto/shared'
import { AREA_CONFIG } from '@/lib/area-config'
import { Home, Loader2, RotateCcw, History } from 'lucide-react'

function statLabel(key: string): string {
  if (key === '_sem_mapeamento') return 'Sem tópico mapeado'
  return key
}

function formatTime(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

function getPerformanceTier(pct: number): { label: string; className: string } {
  if (pct >= 80) return { label: 'Excelente!', className: 'broto-mock-exam-score-tier--excellent' }
  if (pct >= 60) return { label: 'Bom trabalho!', className: 'broto-mock-exam-score-tier--good' }
  if (pct >= 40)
    return { label: 'Continue praticando!', className: 'broto-mock-exam-score-tier--ok' }
  return { label: 'Não desanime!', className: 'broto-mock-exam-score-tier--low' }
}

function scoreColor(pct: number): string {
  if (pct >= 70) return 'var(--green-400)'
  if (pct >= 50) return 'var(--gold-400)'
  return 'var(--red-400)'
}

const RING_R = 58
const RING_C = 2 * Math.PI * RING_R

export function MockExamResult() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const paramSessionId = searchParams.get('sessionId')

  const state = location.state as
    | {
        summary?: PracticeSessionSummary
        sessionId?: string
        answerReview?: PracticeSessionAnswerReviewItem[]
        showAnswerReview?: boolean
      }
    | undefined
  const [summary, setSummary] = useState<PracticeSessionSummary | null>(state?.summary ?? null)
  const [loading, setLoading] = useState(
    () => !state?.summary && !!(paramSessionId && paramSessionId.length > 0),
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const answerReview = state?.showAnswerReview
    ? (state.answerReview ?? summary?.respostas ?? [])
    : (summary?.respostas ?? [])

  useEffect(() => {
    if (summary) return
    const sid = paramSessionId?.trim()
    if (!sid) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        type GetRes = { sessionId?: string; summary?: unknown; completedAt?: string | null }
        const data = await api.post<GetRes>('/api/practice-session/get', { sessionId: sid })
        if (cancelled) return
        const raw = data.summary
        if (isPracticeSessionSummary(raw)) {
          setSummary(raw)
          setLoadError(null)
        } else if (data.completedAt == null) {
          setLoadError('Esta sessão ainda está em andamento. Continue de onde parou.')
        } else {
          setLoadError('O resumo desta sessão não está disponível.')
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Erro ao carregar resultado')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [paramSessionId, summary])

  if (loading) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Resultado" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p className="broto-muted" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader2 size={18} style={{ animation: 'broto-rotate 0.7s linear infinite' }} />
            Carregando resultado...
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Resultado" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24, maxWidth: 560 }}>
          <p style={{ color: 'var(--red-400)' }}>{loadError}</p>
          {paramSessionId ? (
            <Link
              to={`/study/mock-exam/play/${paramSessionId}`}
              className="broto-btn-primary"
              style={{ marginTop: 16, display: 'inline-block' }}
            >
              Ir para a sessão
            </Link>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <Link to="/study/mock-exam/history" className="broto-btn-ghost broto-btn-ghost--inline">
              Histórico de sessões
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="broto-page broto-page--study">
        <TopBar title="Resultado" variant="study" />
        <div className="broto-main-inner" style={{ padding: 24 }}>
          <p className="broto-muted">Nenhum resultado para exibir.</p>
          <Link
            to="/study/mock-exam"
            className="broto-btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            Configurar sessão
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link to="/study/mock-exam/history" className="broto-btn-ghost broto-btn-ghost--inline">
              Ver histórico
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tier = getPerformanceTier(summary.percentualGeral)
  const ringOffset = RING_C * (1 - summary.percentualGeral / 100)

  return (
    <div className="broto-page broto-page--study">
      <TopBar title="Resultado da sessão" variant="study" />
      <div
        className="broto-main-inner"
        style={{ maxWidth: 720, margin: '0 auto', padding: '20px 18px' }}
      >
        <div className="broto-mock-exam-score-hero broto-fade-in">
          <div className="broto-mock-exam-score-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle className="broto-mock-exam-score-ring__bg" cx="70" cy="70" r={RING_R} />
              <circle
                className="broto-mock-exam-score-ring__fill"
                cx="70"
                cy="70"
                r={RING_R}
                stroke={scoreColor(summary.percentualGeral)}
                strokeDasharray={RING_C}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="broto-mock-exam-score-ring__value">
              <span className="broto-mock-exam-score-ring__pct">{summary.percentualGeral}%</span>
              <span className="broto-mock-exam-score-ring__label">acertos</span>
            </div>
          </div>

          <span className={`broto-mock-exam-score-tier ${tier.className}`}>{tier.label}</span>

          <span className="broto-mock-exam-score-detail">
            {summary.totalCorretas} de {summary.totalQuestoes} questões corretas
          </span>

          {summary.tempoMedioPorQuestaoSeg != null ? (
            <div className="broto-mock-exam-score-time">
              <div className="broto-mock-exam-score-time__item">
                <span className="broto-mock-exam-score-time__value">
                  {formatTime(summary.tempoMedioPorQuestaoSeg)}
                </span>
                <span className="broto-mock-exam-score-time__label">por questão</span>
              </div>
              {summary.tempoTotalSeg != null ? (
                <div className="broto-mock-exam-score-time__item">
                  <span className="broto-mock-exam-score-time__value">
                    {formatTime(summary.tempoTotalSeg)}
                  </span>
                  <span className="broto-mock-exam-score-time__label">total</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {answerReview.length > 0 ? (
          <div className="broto-card" style={{ padding: 22, marginBottom: 18 }}>
            <h3 className="broto-section-label" style={{ marginBottom: 14 }}>
              Suas respostas
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {answerReview.map((item, idx) => (
                <li
                  key={`${item.questionId}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: item.isCorrect
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(224, 82, 82, 0.08)',
                    border: `1px solid ${
                      item.isCorrect ? 'rgba(16, 185, 129, 0.18)' : 'rgba(224, 82, 82, 0.18)'
                    }`,
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      color: item.isCorrect ? 'var(--green-400)' : 'var(--red-400)',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.selectedLetter ?? '—'} / {item.correctLetter ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="broto-card" style={{ padding: 22, marginBottom: 18 }}>
          <h3 className="broto-section-label" style={{ marginBottom: 14 }}>
            Desempenho por área
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {Object.entries(summary.porArea).map(([slug, s]) => {
              const cfg = AREA_CONFIG[slug]
              const Icon = cfg?.icon
              const color = cfg?.color ?? '#888'
              return (
                <li key={slug} className="broto-mock-exam-area-row">
                  <div
                    className="broto-mock-exam-area-row__icon"
                    style={{ background: `${color}15`, color }}
                  >
                    {Icon ? <Icon size={18} strokeWidth={1.8} /> : null}
                  </div>
                  <div className="broto-mock-exam-area-row__info">
                    <div className="broto-mock-exam-area-row__name">
                      {cfg?.label ?? statLabel(slug)}
                    </div>
                    <div className="broto-mock-exam-area-row__bar">
                      <div
                        className="broto-mock-exam-area-row__bar-fill"
                        style={{ width: `${s.percentual}%`, background: color }}
                      />
                    </div>
                  </div>
                  <span className="broto-mock-exam-area-row__score" style={{ color }}>
                    {s.percentual}%
                    <span
                      className="broto-muted"
                      style={{ fontWeight: 400, fontSize: '0.72rem', marginLeft: 4 }}
                    >
                      ({s.corretas}/{s.total})
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="broto-card" style={{ padding: 22, marginBottom: 24 }}>
          <h3 className="broto-section-label" style={{ marginBottom: 14 }}>
            Desempenho por tópico
          </h3>
          {Object.keys(summary.porTopico).length === 0 ? (
            <p className="broto-muted">Nenhum tópico agregado nesta rodada.</p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {Object.entries(summary.porTopico).map(([slug, s]) => (
                <li
                  key={slug}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{statLabel(slug)}</span>
                  <span style={{ fontWeight: 600, color: scoreColor(s.percentual) }}>
                    {s.percentual}%
                    <span className="broto-muted" style={{ fontWeight: 400, marginLeft: 4 }}>
                      ({s.corretas}/{s.total})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="broto-mock-exam-actions">
          <Link to="/study/mock-exam" className="broto-btn-secondary broto-btn-secondary--inline">
            <RotateCcw size={16} /> Nova sessão
          </Link>
          <Link to="/study/mock-exam/history" className="broto-btn-ghost broto-btn-ghost--inline">
            <History size={16} /> Histórico
          </Link>
          <Link to="/" className="broto-btn-ghost broto-btn-ghost--inline">
            <Home size={16} /> Início
          </Link>
        </div>
      </div>
    </div>
  )
}
