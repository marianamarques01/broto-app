import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import type { PerformancePeriod } from '@/lib/performance-history'
import { AREA_CONFIG } from '@/lib/area-config'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import { DashboardStudyStats } from '@/components/progress/DashboardStudyStats'
import {
  Target,
  CheckCircle2,
  XCircle,
  Flame,
  Trophy,
  Zap,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Star,
  Award,
  Crown,
  Medal,
  Calendar,
  ArrowRight,
} from 'lucide-react'

/* ─── Helpers ──────────────────────────────── */

function ProgressRing({
  pct,
  color,
  size = 64,
  stroke = 5,
}: {
  pct: number
  color: string
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (c * Math.min(pct, 100)) / 100
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.8s ease',
          filter: `drop-shadow(0 0 6px ${color}50)`,
        }}
      />
    </svg>
  )
}

const ACHIEVEMENT_DEFS = [
  {
    id: 'first-question',
    label: 'Primeira Questão',
    desc: 'Respondeu sua primeira questão',
    icon: Star,
    color: '#2dd4a8',
    check: (t: number) => t >= 1,
  },
  {
    id: '10-questions',
    label: '10 Questões',
    desc: 'Respondeu 10 questões',
    icon: BookOpen,
    color: '#60a5fa',
    check: (t: number) => t >= 10,
  },
  {
    id: '50-questions',
    label: '50 Questões',
    desc: 'Respondeu 50 questões',
    icon: Target,
    color: '#a78bfa',
    check: (t: number) => t >= 50,
  },
  {
    id: '100-questions',
    label: 'Centurião',
    desc: '100 questões respondidas',
    icon: Trophy,
    color: '#f5c842',
    check: (t: number) => t >= 100,
  },
  {
    id: '250-questions',
    label: 'Maratonista',
    desc: '250 questões respondidas',
    icon: Crown,
    color: '#fb7e6a',
    check: (t: number) => t >= 250,
  },
  {
    id: '500-questions',
    label: 'Mestre ENEM',
    desc: '500 questões respondidas',
    icon: Medal,
    color: '#f5c842',
    check: (t: number) => t >= 500,
  },
  {
    id: '70-accuracy',
    label: 'Precisão 70%',
    desc: 'Taxa de acerto acima de 70%',
    icon: Award,
    color: '#2dd4a8',
    check: (_t: number, acc: number, total: number) => total >= 10 && acc >= 70,
  },
  {
    id: '80-accuracy',
    label: 'Precisão 80%',
    desc: 'Taxa de acerto acima de 80%',
    icon: Award,
    color: '#f5c842',
    check: (_t: number, acc: number, total: number) => total >= 20 && acc >= 80,
  },
]

const PERIOD_FILTERS: { id: PerformancePeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Tudo' },
]

/* ─── Main ─────────────────────────────────── */

export function Progress() {
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()
  const { user, loading: loadingUser } = useUser()
  const [chartPeriod, setChartPeriod] = useState<PerformancePeriod>('week')
  const {
    buckets,
    loading: chartLoading,
    error: chartError,
  } = usePerformanceSeries(chartPeriod)

  const loading = loadingProgress || loadingPet || loadingUser
  const hasData = !loadingProgress && progress !== null && progress.totalAnswered > 0
  const areas = progress?.areas ?? DEFAULT_AREAS
  const accuracyPct = progress?.accuracyPct ?? 0
  const totalAnswered = progress?.totalAnswered ?? 0
  const totalCorrect = progress?.totalCorrect ?? 0
  const totalErrors = totalAnswered - totalCorrect

  const streak = pet?.streak ?? 0
  const fase = pet?.fase ?? 'semente'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpNext = pet?.xpNextLevel ?? 100
  const xpPct = xpNext > 0 ? Math.round((xp / xpNext) * 100) : 0
  const questoesHoje = pet?.questoesHoje ?? 0
  const acertosHoje = pet?.acertosHoje ?? 0

  const firstName = user?.nome?.split(' ')[0] ?? 'Aluno'

  const achievements = useMemo(
    () =>
      ACHIEVEMENT_DEFS.map((a) => ({
        ...a,
        unlocked: a.check(totalAnswered, accuracyPct, totalAnswered),
      })),
    [totalAnswered, accuracyPct],
  )
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const topFortes = useMemo(
    () =>
      areas
        .flatMap((a) => a.topicos)
        .filter((t) => t.totalAnswered >= 3)
        .sort((a, b) => b.accuracyPct - a.accuracyPct)
        .slice(0, 3),
    [areas],
  )

  const topFracos = useMemo(
    () =>
      areas
        .flatMap((a) => a.topicos)
        .filter((t) => t.totalAnswered >= 3)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 3),
    [areas],
  )

  const chartHasData = useMemo(() => buckets.some((b) => b.answered > 0), [buckets])

  const chartN = Math.max(buckets.length, 1)
  const chartGap = 6
  const chartPadL = 8
  const chartPadR = 8
  const chartPadB = 22
  const chartH = 120
  const chartW = 400
  const chartInnerW = chartW - chartPadL - chartPadR
  const chartBarW = (chartInnerW - chartGap * (chartN - 1)) / chartN

  return (
    <div className="broto-prog-page">
      <TopBar title="Progresso" subtitle="Acompanhe sua evolução nos estudos" />

      <div className="broto-prog-shell">
        <div className="broto-prog-inner">
          {/* ── Hero section ── */}
          <section className="broto-prog-hero">
            <div className="broto-prog-hero-left">
              <h2 className="broto-prog-hero-greeting">
                {loading ? 'Carregando...' : `${firstName}, aqui está seu progresso`}
              </h2>
              <p className="broto-prog-hero-sub">
                {hasData
                  ? `Você já respondeu ${totalAnswered.toLocaleString('pt-BR')} questões com ${accuracyPct}% de acerto.`
                  : 'Responda questões para começar a acompanhar sua evolução.'}
              </p>
            </div>
            <div className="broto-prog-hero-ring">
              <ProgressRing pct={hasData ? accuracyPct : 0} color="#2dd4a8" size={100} stroke={7} />
              <span className="broto-prog-hero-ring-label">
                {loading ? '—' : hasData ? `${accuracyPct}%` : '—'}
              </span>
              <span className="broto-prog-hero-ring-caption">Acerto geral</span>
            </div>
          </section>

          <DashboardStudyStats className="broto-prog-dashboard-stats" />

          {/* ── KPI row (totais + streak; questões totais estão no bloco acima) ── */}
          <div className="broto-prog-kpis">
            {[
              {
                label: 'Acertos',
                value: loading ? '—' : totalCorrect.toLocaleString('pt-BR'),
                icon: CheckCircle2,
                accent: 'var(--green-400)',
              },
              {
                label: 'Erros',
                value: loading ? '—' : totalErrors.toLocaleString('pt-BR'),
                icon: XCircle,
                accent: 'var(--red-400)',
              },
              {
                label: 'Streak',
                value: loadingPet ? '—' : `${streak} dias`,
                icon: Flame,
                accent: 'var(--gold-accent)',
              },
            ].map((kpi) => (
              <div key={kpi.label} className="broto-prog-kpi">
                <div className="broto-prog-kpi-icon" style={{ color: kpi.accent }}>
                  <kpi.icon size={18} />
                </div>
                <div className="broto-prog-kpi-val">{kpi.value}</div>
                <div className="broto-prog-kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ── Grid layout ── */}
          <div className="broto-prog-grid">
            {/* ── Col Left: Broto + Areas ── */}
            <div className="broto-prog-col">
              {/* Broto Section */}
              <section className="broto-prog-card broto-prog-broto-card">
                <div className="broto-prog-card-head">
                  <span className="broto-prog-card-dot" style={{ background: 'var(--teal-400)' }} />
                  <h3 className="broto-prog-card-title">Seu Broto</h3>
                </div>
                <div className="broto-prog-broto-body">
                  <div className="broto-prog-broto-avatar">
                    {loadingPet ? '...' : FASE_EMOJI[fase]}
                  </div>
                  <div className="broto-prog-broto-info">
                    <div className="broto-prog-broto-phase">
                      <span className="broto-prog-broto-phase-name">
                        {loadingPet ? '...' : FASE_LABEL[fase]}
                      </span>
                      <span className="broto-prog-broto-level">Nv. {nivel}</span>
                    </div>
                    <div className="broto-prog-xp-track">
                      <div
                        className="broto-prog-xp-fill"
                        style={{ width: `${loadingPet ? 0 : xpPct}%` }}
                      />
                    </div>
                    <span className="broto-prog-xp-label">
                      {loadingPet ? '...' : `${xp} / ${xpNext} XP`}
                    </span>
                  </div>
                </div>
                <div className="broto-prog-broto-stats">
                  <div className="broto-prog-broto-stat">
                    <Zap size={14} style={{ color: 'var(--gold-accent)' }} />
                    <span className="broto-prog-broto-stat-val">
                      {loadingPet ? '—' : questoesHoje}
                    </span>
                    <span className="broto-prog-broto-stat-label">Questões hoje</span>
                  </div>
                  <div className="broto-prog-broto-stat">
                    <CheckCircle2 size={14} style={{ color: 'var(--green-400)' }} />
                    <span className="broto-prog-broto-stat-val">
                      {loadingPet ? '—' : acertosHoje}
                    </span>
                    <span className="broto-prog-broto-stat-label">Acertos hoje</span>
                  </div>
                  <div className="broto-prog-broto-stat">
                    <Flame size={14} style={{ color: 'var(--gold-accent)' }} />
                    <span className="broto-prog-broto-stat-val">
                      {loadingPet ? '—' : streak}
                    </span>
                    <span className="broto-prog-broto-stat-label">Streak</span>
                  </div>
                </div>
              </section>

              {/* Area Performance */}
              <section className="broto-prog-card">
                <div className="broto-prog-card-head">
                  <span className="broto-prog-card-dot" style={{ background: 'var(--status-sky)' }} />
                  <h3 className="broto-prog-card-title">Desempenho por Área</h3>
                </div>
                <div className="broto-prog-areas">
                  {areas.map((area) => {
                    const config = AREA_CONFIG[area.value] ?? {
                      color: '#888',
                      icon: BookOpen,
                      label: area.label,
                    }
                    const Icon = config.icon
                    const pct = area.totalAnswered > 0 ? area.accuracyPct : 0
                    const answered = area.totalAnswered
                    const correct = area.totalCorrect

                    return (
                      <div key={area.value} className="broto-prog-area-row">
                        <div className="broto-prog-area-ring">
                          <ProgressRing pct={pct} color={config.color} size={48} stroke={4} />
                          <span
                            className="broto-prog-area-ring-val"
                            style={{ color: answered > 0 ? config.color : 'var(--text-muted)' }}
                          >
                            {answered > 0 ? pct : '—'}
                          </span>
                        </div>
                        <div className="broto-prog-area-info">
                          <div className="broto-prog-area-name">
                            <Icon size={14} style={{ color: config.color }} />
                            <span>{area.label}</span>
                          </div>
                          {answered > 0 ? (
                            <span className="broto-prog-area-detail">
                              {correct}/{answered} acertos
                            </span>
                          ) : (
                            <span className="broto-prog-area-detail">Sem dados</span>
                          )}
                          {answered > 0 && (
                            <div className="broto-prog-area-bar">
                              <div
                                className="broto-prog-area-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: config.color,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* ── Col Right: Chart + Topics + Achievements ── */}
            <div className="broto-prog-col">
              {/* Performance Chart */}
              <section className="broto-prog-card">
                <div className="broto-prog-card-head">
                  <span className="broto-prog-card-dot" style={{ background: 'var(--green-400)' }} />
                  <h3 className="broto-prog-card-title">Histórico de Estudo</h3>
                  <div className="broto-prog-chart-filters">
                    {PERIOD_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`broto-prog-chart-filter${chartPeriod === f.id ? ' broto-prog-chart-filter--active' : ''}`}
                        onClick={() => setChartPeriod(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="broto-prog-chart-sub">
                  {chartPeriod === 'week' && 'Últimos 7 dias (UTC) — taxa de acerto por dia, dados da conta'}
                  {chartPeriod === 'month' && 'Últimas 4 semanas — taxa agregada'}
                  {chartPeriod === 'all' && 'Histórico mensal (até 12 meses)'}
                </p>
                {chartError ? (
                  <p className="broto-prog-chart-empty" role="alert">
                    {chartError}
                  </p>
                ) : null}
                <div
                  className={`broto-prog-chart-wrap${!chartHasData && !chartLoading ? ' broto-prog-chart-wrap--empty' : ''}`}
                >
                  {chartLoading ? (
                    <p className="broto-prog-chart-empty">Carregando histórico...</p>
                  ) : null}
                  {!chartLoading && !chartHasData && !chartError ? (
                    <p className="broto-prog-chart-empty">
                      Responda questões para ver seu gráfico de evolução.
                    </p>
                  ) : null}
                  <svg
                    className="broto-prog-chart"
                    viewBox={`0 0 ${chartW} ${chartH + chartPadB}`}
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="Gráfico de desempenho"
                  >
                    <defs>
                      <linearGradient id="prog-bar-grad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    {buckets.map((b, i) => {
                      const x = chartPadL + i * (chartBarW + chartGap)
                      const pct = b.accuracyPct
                      const hFill = pct === null ? 6 : Math.max((pct / 100) * chartH, 8)
                      const y = chartH - hFill
                      return (
                        <g key={b.key}>
                          <title>
                            {b.label}: {pct !== null ? `${pct}%` : '—'} ({b.answered} quest.)
                          </title>
                          <rect
                            x={x}
                            y={0}
                            width={chartBarW}
                            height={chartH}
                            rx={4}
                            fill="rgba(255,255,255,0.03)"
                          />
                          <rect
                            x={x}
                            y={y}
                            width={chartBarW}
                            height={hFill}
                            rx={4}
                            fill={pct === null ? 'rgba(255,255,255,0.06)' : 'url(#prog-bar-grad)'}
                          />
                          <text
                            x={x + chartBarW / 2}
                            y={chartH + 16}
                            textAnchor="middle"
                            fill="var(--text-muted)"
                            fontSize="9"
                            fontFamily="inherit"
                          >
                            {b.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </section>

              {/* Topic Insights */}
              {hasData && (topFortes.length > 0 || topFracos.length > 0) && (
                <section className="broto-prog-card">
                  <div className="broto-prog-card-head">
                    <span
                      className="broto-prog-card-dot"
                      style={{ background: 'var(--status-violet)' }}
                    />
                    <h3 className="broto-prog-card-title">Indicadores por Tópico</h3>
                  </div>
                  <div className="broto-prog-topics">
                    {topFortes.length > 0 && (
                      <div className="broto-prog-topic-group">
                        <h4 className="broto-prog-topic-heading broto-prog-topic-heading--forte">
                          <TrendingUp size={14} /> Pontos fortes
                        </h4>
                        {topFortes.map((t) => (
                          <div key={t.value} className="broto-prog-topic-chip broto-prog-topic-chip--forte">
                            <div className="broto-prog-topic-chip-info">
                              <span className="broto-prog-topic-chip-name">{t.label}</span>
                              <span className="broto-prog-topic-chip-meta">
                                {t.totalAnswered} questões
                              </span>
                            </div>
                            <span className="broto-prog-topic-chip-pct" style={{ color: 'var(--green-400)' }}>
                              {t.accuracyPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {topFracos.length > 0 && (
                      <div className="broto-prog-topic-group">
                        <h4 className="broto-prog-topic-heading broto-prog-topic-heading--fraco">
                          <TrendingDown size={14} /> A melhorar
                        </h4>
                        {topFracos.map((t) => (
                          <div key={t.value} className="broto-prog-topic-chip broto-prog-topic-chip--fraco">
                            <div className="broto-prog-topic-chip-info">
                              <span className="broto-prog-topic-chip-name">{t.label}</span>
                              <span className="broto-prog-topic-chip-meta">
                                {t.totalAnswered} questões
                              </span>
                            </div>
                            <span className="broto-prog-topic-chip-pct" style={{ color: 'var(--red-400)' }}>
                              {t.accuracyPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Achievements */}
              <section className="broto-prog-card">
                <div className="broto-prog-card-head">
                  <span className="broto-prog-card-dot" style={{ background: 'var(--gold-accent)' }} />
                  <h3 className="broto-prog-card-title">
                    Conquistas
                    <span className="broto-prog-badge-count">
                      {unlockedCount}/{achievements.length}
                    </span>
                  </h3>
                </div>
                <div className="broto-prog-achievements">
                  {achievements.map((a) => {
                    const Icon = a.icon
                    return (
                      <div
                        key={a.id}
                        className={`broto-prog-achievement${a.unlocked ? ' broto-prog-achievement--unlocked' : ''}`}
                      >
                        <div
                          className="broto-prog-achievement-icon"
                          style={{
                            color: a.unlocked ? a.color : 'var(--text-muted)',
                            borderColor: a.unlocked ? `${a.color}30` : 'var(--border-subtle)',
                            background: a.unlocked ? `${a.color}10` : 'transparent',
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="broto-prog-achievement-info">
                          <span className="broto-prog-achievement-name">{a.label}</span>
                          <span className="broto-prog-achievement-desc">{a.desc}</span>
                        </div>
                        {a.unlocked && (
                          <CheckCircle2
                            size={16}
                            className="broto-prog-achievement-check"
                            style={{ color: a.color }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>

          {/* Empty state CTA */}
          {!loading && !hasData && (
            <div className="broto-prog-empty">
              <div className="broto-prog-empty-icon">
                <Calendar size={32} />
              </div>
              <h3 className="broto-prog-empty-title">Seu progresso aparece aqui</h3>
              <p className="broto-prog-empty-desc">
                Responda questões para ver desempenho por área, tópico, conquistas e muito mais.
              </p>
              <Link to="/study" className="broto-prog-empty-cta">
                Praticar questões
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
