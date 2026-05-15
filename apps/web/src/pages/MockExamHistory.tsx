import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { api } from '@/lib/api-client'
import { formatPracticeSessionAreasLabel, type PracticeSessionSummary } from '@broto/shared'
import { ArrowLeft, ClipboardList, Loader2, PlayCircle, CheckCircle2, Clock } from 'lucide-react'

function scoreBadgeClass(pct: number): string {
  if (pct >= 70) return 'broto-mock-exam-badge--score-high'
  if (pct >= 50) return 'broto-mock-exam-badge--score-mid'
  return 'broto-mock-exam-badge--score-low'
}

type SessionListItem = {
  sessionId: string
  createdAt: string
  completedAt: string | null
  summary: unknown
  config: unknown
  questionCount: number
}

function isPracticeSessionSummary(raw: unknown): raw is PracticeSessionSummary {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  if (typeof o.percentualGeral !== 'number') return false
  if (typeof o.totalQuestoes !== 'number') return false
  if (typeof o.totalCorretas !== 'number') return false
  if (!o.porArea || typeof o.porArea !== 'object') return false
  if (!o.porTopico || typeof o.porTopico !== 'object') return false
  return true
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MockExamHistory() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      type Res = { sessions?: SessionListItem[] }
      const data = await api.post<Res>('/api/practice-session/list', { limit: 50 })
      setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar histórico')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="broto-page broto-page--study">
      <TopBar
        title="Sessões anteriores"
        subtitle="Histórico de blocos tipo simulado ENEM"
        variant="study"
      />
      <div className="broto-main-inner" style={{ maxWidth: 720, margin: '0 auto', padding: '20px 18px' }}>
        <Link
          to="/study/mock-exam"
          className="broto-btn-ghost broto-btn-ghost--inline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}
        >
          <ArrowLeft size={18} /> Voltar ao configurador
        </Link>

        {loading ? (
          <p className="broto-muted" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader2 size={18} style={{ animation: 'broto-rotate 0.7s linear infinite' }} />
            Carregando...
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              padding: 14,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(224, 82, 82, 0.12)',
              color: 'var(--red-400)',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        ) : null}

        {!loading && !error && sessions.length === 0 ? (
          <div className="broto-mock-exam-empty">
            <div className="broto-mock-exam-empty__icon">
              <ClipboardList size={28} strokeWidth={1.6} />
            </div>
            <p className="broto-muted" style={{ margin: '0 0 20px', fontSize: '0.88rem' }}>
              Você ainda não tem sessões registradas.
              <br />
              Faça uma sessão (estilo simulado) para ver o histórico aqui.
            </p>
            <Link to="/study/mock-exam" className="broto-btn-primary broto-btn-primary--inline" style={{ padding: '12px 28px' }}>
              Montar sessão
            </Link>
          </div>
        ) : null}

        {!loading && sessions.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => {
              const done = s.completedAt != null
              const sum = isPracticeSessionSummary(s.summary) ? s.summary : null
              const areasLabel = formatPracticeSessionAreasLabel(s.config, s.summary)
              return (
                <li key={s.sessionId} className="broto-card broto-mock-exam-session">
                  <div className="broto-mock-exam-session__header">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{formatWhen(s.createdAt)}</div>
                      <div className="broto-mock-exam-session__meta">
                        <span className="broto-muted" style={{ fontSize: '0.78rem' }}>
                          {s.questionCount} questões · {areasLabel}
                        </span>
                        {done ? (
                          <span className="broto-mock-exam-badge broto-mock-exam-badge--done">
                            <CheckCircle2 size={12} /> Concluído
                          </span>
                        ) : (
                          <span className="broto-mock-exam-badge broto-mock-exam-badge--progress">
                            <Clock size={12} /> Em andamento
                          </span>
                        )}
                        {sum ? (
                          <span className={`broto-mock-exam-badge broto-mock-exam-badge--score ${scoreBadgeClass(sum.percentualGeral)}`}>
                            {sum.percentualGeral}%
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {!done ? (
                        <Link
                          to={`/study/mock-exam/play/${s.sessionId}`}
                          className="broto-btn-primary broto-btn-primary--inline"
                          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                        >
                          <PlayCircle size={16} /> Continuar
                        </Link>
                      ) : null}
                      {done && sum ? (
                        <Link
                          to={`/study/mock-exam/result?sessionId=${encodeURIComponent(s.sessionId)}`}
                          className="broto-btn-secondary broto-btn-secondary--inline"
                          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                        >
                          Ver resultado
                        </Link>
                      ) : null}
                      {done && !sum ? (
                        <span className="broto-muted" style={{ fontSize: '0.78rem' }}>
                          Resumo indisponível
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
