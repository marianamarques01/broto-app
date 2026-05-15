import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrotoHeroCard } from '@/components/progress/BrotoHeroCard'
import { AchievementsCollapsible } from '@/components/progress/AchievementsCollapsible'
import { AreaPerformanceTable } from '@/components/progress/AreaPerformanceTable'
import { ConsistencyHeatmapCard } from '@/components/progress/ConsistencyHeatmapCard'
import { DailyStreakCard } from '@/components/progress/DailyStreakCard'
import { TopBar } from '@/components/layout/TopBar'
import { ProgressKpiStrip } from '@/components/progress/ProgressKpiStrip'
import { ProgressTrendCard } from '@/components/progress/ProgressTrendCard'
import { TopicFocusPanel } from '@/components/progress/TopicFocusPanel'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import type { PerformancePeriod } from '@/lib/performance-history'
import {
  getPerformanceDayMapSnapshot,
  getPerformanceDayMapServerSnapshot,
  subscribePerformanceHistory,
} from '@/lib/performance-history'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import { buildAchievementRows } from '@/lib/achievements'

const PROGRESS_HASH_ANCHORS = new Set(['consistencia', 'conquistas'])

export function Progress() {
  const location = useLocation()
  const performanceDayMap = useSyncExternalStore(
    subscribePerformanceHistory,
    getPerformanceDayMapSnapshot,
    getPerformanceDayMapServerSnapshot,
  )
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()
  const [chartPeriod, setChartPeriod] = useState<PerformancePeriod>('month')
  const {
    buckets: historyBuckets,
    loading: chartLoading,
    error: chartError,
  } = usePerformanceSeries(chartPeriod)

  const hasData = !loadingProgress && progress !== null && progress.totalAnswered > 0
  const areas = progress?.areas ?? DEFAULT_AREAS
  const accuracyPct = progress?.accuracyPct ?? 0
  const totalAnswered = progress?.totalAnswered ?? 0

  const achievements = useMemo(
    () => buildAchievementRows(totalAnswered, accuracyPct),
    [totalAnswered, accuracyPct],
  )

  useLayoutEffect(() => {
    if (location.pathname !== '/progress') return
    const id = location.hash.slice(1)
    if (!id || !PROGRESS_HASH_ANCHORS.has(id)) return
    if (loadingProgress) return

    const run = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
  }, [location.pathname, location.hash, loadingProgress])

  const estTotalStudyMin = Math.round(totalAnswered * 2.5)
  const estTotalHours = estTotalStudyMin / 60

  const sumPeriodAnswered = useMemo(
    () => historyBuckets.reduce((s, b) => s + b.answered, 0),
    [historyBuckets],
  )

  const kpiItems = useMemo(
    () => [
      {
        id: 'accuracy',
        label: 'Acerto geral',
        value: hasData ? `${accuracyPct}%` : '—',
        hint: hasData ? 'média no banco de questões' : 'pratique para ver a taxa',
        tone: 'var(--teal-400)',
      },
      {
        id: 'total',
        label: 'Questões feitas',
        value: totalAnswered.toLocaleString('pt-BR'),
        hint: 'total respondidas',
        tone: 'var(--text-primary)',
      },
      {
        id: 'period',
        label: 'No período filtrado',
        value: String(sumPeriodAnswered),
        hint:
          chartPeriod === 'week'
            ? 'últimos dias (gráfico)'
            : chartPeriod === 'month'
              ? 'últimas semanas (gráfico)'
              : 'visão ampla (gráfico)',
        tone: 'var(--status-sky)',
      },
      {
        id: 'study-time',
        label: 'Tempo estimado',
        value:
          !hasData || loadingProgress
            ? '—'
            : estTotalHours >= 1
              ? `${estTotalHours.toFixed(1).replace('.', ',')} h`
              : `${estTotalStudyMin} min`,
        hint: '~2,5 min por questão',
        tone: 'var(--text-secondary)',
      },
    ],
    [
      accuracyPct,
      chartPeriod,
      estTotalHours,
      estTotalStudyMin,
      hasData,
      loadingProgress,
      sumPeriodAnswered,
      totalAnswered,
    ],
  )

  const streak = pet?.streak ?? 0

  const pageLede = loadingProgress
    ? 'Carregando seu histórico de estudos…'
    : !hasData
      ? 'Comece pelo banco de questões: aqui o Broto mostra como seus números evoluem ao longo do tempo.'
      : 'Um retrato do que você já construiu no ENEM — ritmo, foco e constância, no mesmo lugar.'

  return (
    <>
      <TopBar variant="study" title="Progresso" />
      <div className="broto-main-inner broto-main-inner--study broto-prog-page broto-progress-page">
        <header className="broto-progress-page-head">
          <h1 className="broto-sr-only">Progresso</h1>
          <div className="broto-progress-page-head__row">
            <div className="broto-progress-page-head__copy">
              <p className="broto-progress-page-kicker">Sua jornada no Broto</p>
              <p className="broto-progress-page-lede">{pageLede}</p>
            </div>
            {!loadingProgress && !hasData ? (
              <Link
                to="/study/linguagens"
                className="broto-btn-secondary broto-progress-page-head__cta"
              >
                Ir ao banco
              </Link>
            ) : null}
          </div>
          {loadingProgress ? (
            <p className="broto-progress-page-status" role="status" aria-live="polite">
              Sincronizando dados…
            </p>
          ) : null}
        </header>

        <div className="broto-progress-layout">
          <div className="broto-progress-main">
            <div className="broto-progress-hero-zone">
              <BrotoHeroCard
                pet={pet}
                loadingPet={loadingPet}
                accuracyPct={accuracyPct}
                totalAnswered={totalAnswered}
                hasData={hasData}
                performanceDayMap={performanceDayMap}
              />
            </div>

            <section
              id="progress-kpis"
              className="broto-progress-slab broto-progress-slab--overview"
              aria-labelledby="progress-overview-heading"
            >
              <div className="broto-progress-slab__head">
                <h2 id="progress-overview-heading" className="broto-progress-slab__title">
                  Visão geral
                </h2>
                <p className="broto-progress-slab__lede">
                  Indicadores consolidados do seu histórico — o filtro do gráfico abaixo influencia a
                  coluna “período”.
                </p>
              </div>
              <ProgressKpiStrip items={kpiItems} loading={loadingProgress} asDiv />
            </section>

            <ProgressTrendCard
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              buckets={historyBuckets}
              loading={chartLoading}
              error={chartError}
              globalAccuracyPct={accuracyPct}
              totalAnswered={totalAnswered}
            />

            <div className="broto-progress-detail-grid">
              <AreaPerformanceTable areas={areas} loading={loadingProgress} />
              <TopicFocusPanel areas={areas} />
            </div>

            <ConsistencyHeatmapCard
              performanceDayMap={performanceDayMap}
              totalAnswered={totalAnswered}
            />
          </div>

          <aside className="broto-progress-aside" aria-label="Hábito e conquistas">
            <div className="broto-progress-aside-block">
              <p className="broto-progress-aside-kicker">Ritmo semanal</p>
              <DailyStreakCard
                streak={streak}
                questoesHoje={pet?.questoesHoje ?? 0}
                loading={loadingPet}
                performanceDayMap={performanceDayMap}
              />
            </div>
            <div className="broto-progress-aside-block broto-progress-aside-block--achievements">
              <AchievementsCollapsible achievements={achievements} initialVisible={4} />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
