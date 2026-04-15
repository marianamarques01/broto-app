import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
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
import {
  Target,
  Trophy,
  BookOpen,
  Star,
  Award,
  Crown,
  Medal,
} from 'lucide-react'

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
    () =>
      ACHIEVEMENT_DEFS.map((a) => ({
        ...a,
        unlocked: a.check(totalAnswered, accuracyPct, totalAnswered),
      })),
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
        hint: hasData ? 'no banco de questões' : 'pratique para ver',
        tone: 'var(--teal-400)',
      },
      {
        id: 'total',
        label: 'Questões',
        value: totalAnswered.toLocaleString('pt-BR'),
        hint: 'respondidas no total',
        tone: 'var(--text-primary)',
      },
      {
        id: 'period',
        label: 'Neste período',
        value: String(sumPeriodAnswered),
        hint:
          chartPeriod === 'week'
            ? 'no filtro semana'
            : chartPeriod === 'month'
              ? 'no filtro mês'
              : 'no filtro geral',
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
        hint: '~2,5 min / questão',
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

  return (
    <>
      <TopBar variant="study" title="Progresso" />
      <div className="broto-main-inner broto-main-inner--study broto-prog-page broto-progress-page">
        <div className="broto-progress-layout">
          <div className="broto-progress-main">
            <BrotoHeroCard
              pet={pet}
              loadingPet={loadingPet}
              accuracyPct={accuracyPct}
              totalAnswered={totalAnswered}
              hasData={hasData}
              performanceDayMap={performanceDayMap}
            />
            <ProgressKpiStrip items={kpiItems} loading={loadingProgress} />

            <AreaPerformanceTable areas={areas} loading={loadingProgress} />

            <ProgressTrendCard
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              buckets={historyBuckets}
              loading={chartLoading}
              error={chartError}
              globalAccuracyPct={accuracyPct}
              totalAnswered={totalAnswered}
            />

            <TopicFocusPanel areas={areas} />

            <ConsistencyHeatmapCard
              performanceDayMap={performanceDayMap}
              totalAnswered={totalAnswered}
            />
          </div>

          <aside className="broto-progress-aside">
            <DailyStreakCard
              streak={streak}
              questoesHoje={pet?.questoesHoje ?? 0}
              loading={loadingPet}
              performanceDayMap={performanceDayMap}
            />
            <AchievementsCollapsible achievements={achievements} initialVisible={4} />
          </aside>
        </div>
      </div>
    </>
  )
}
