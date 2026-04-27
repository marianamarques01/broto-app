import { buildDailyMissions } from '@/lib/build-daily-missions'
import type { DailyMissionsState } from '@broto/shared'
import type { AreaStat } from '@/hooks/useProgress'
import { AREA_CONFIG } from '@/lib/area-config'

const DEFAULT_GOAL = 3

function mergedAnsweredToday(
  areaKey: string,
  daily: DailyMissionsState,
  serverToday?: Record<string, { answered: number; correct: number }>,
): number {
  const l = daily.byArea[areaKey] ?? { answered: 0, correct: 0 }
  const s = serverToday?.[areaKey] ?? { answered: 0, correct: 0 }
  return Math.max(l.answered, s.answered)
}

export interface DailyPracticeStripProps {
  selectedArea: string
  areaLabel: string
  areas: AreaStat[] | undefined
  daily: DailyMissionsState
  studyTodayByArea?: Record<string, { answered: number; correct: number }>
}

export function DailyPracticeStrip({
  selectedArea,
  areaLabel,
  areas,
  daily,
  studyTodayByArea,
}: DailyPracticeStripProps) {
  const missions = buildDailyMissions(areas, daily, studyTodayByArea)
  const mission =
    missions.find((m) => m.areaKey === selectedArea) ?? missions[0] ?? null
  const answered = mergedAnsweredToday(selectedArea, daily, studyTodayByArea)
  const goal =
    mission?.areaKey === selectedArea && mission.title.includes('3 questões')
      ? 3
      : mission?.areaKey === selectedArea && mission.title.includes('2 questões')
        ? 2
        : DEFAULT_GOAL
  const pct = goal > 0 ? Math.min(100, Math.round((answered / goal) * 100)) : 0

  const focusLabel = AREA_CONFIG[selectedArea]?.label ?? areaLabel

  return (
    <section className="broto-qbank-daily" aria-label="Progresso de hoje nesta área">
      <div className="broto-qbank-daily-row">
        <span className="broto-qbank-daily-label">Foco de hoje</span>
        <span className="broto-qbank-daily-area">{focusLabel}</span>
      </div>
      {mission ? (
        <p className="broto-qbank-daily-mission">{mission.title}</p>
      ) : (
        <p className="broto-qbank-daily-mission">Resolve pelo menos {goal} questões hoje nesta área.</p>
      )}
      <div className="broto-qbank-daily-bar-wrap" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={goal}>
        <div className="broto-qbank-daily-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="broto-qbank-daily-count">
        Hoje em {focusLabel}: <strong>{answered}</strong> / {goal} questões
      </p>
    </section>
  )
}
