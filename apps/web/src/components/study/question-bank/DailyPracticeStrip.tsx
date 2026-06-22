import { buildDailyMissions, parseDailyMissionQuestionCount } from '@/lib/build-daily-missions'
import { DAILY_MISSION_VOLUME_QUEST_GOAL, sanitizeStudyTodayByArea } from '@broto/shared'
import type { AreaStat } from '@/hooks/useProgress'
import { AREA_CONFIG } from '@/lib/area-config'

const DEFAULT_GOAL = DAILY_MISSION_VOLUME_QUEST_GOAL

export interface DailyPracticeStripProps {
  selectedArea: string
  areaLabel: string
  areas: AreaStat[] | undefined
  studyTodayByArea?: Record<string, { answered: number; correct: number }>
}

export function DailyPracticeStrip({
  selectedArea,
  areaLabel,
  areas,
  studyTodayByArea,
}: DailyPracticeStripProps) {
  const missions = buildDailyMissions(areas, studyTodayByArea)
  const mission = missions.find((m) => m.areaKey === selectedArea) ?? missions[0] ?? null
  const byArea = sanitizeStudyTodayByArea(studyTodayByArea)
  const answered = byArea[selectedArea]?.answered ?? 0
  const parsedGoal =
    mission?.areaKey === selectedArea ? parseDailyMissionQuestionCount(mission.title) : null
  const goal = parsedGoal && parsedGoal > 0 ? parsedGoal : DEFAULT_GOAL
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
        <p className="broto-qbank-daily-mission">
          Resolve pelo menos {goal} questões hoje nesta área.
        </p>
      )}
      <div
        className="broto-qbank-daily-bar-wrap"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <div className="broto-qbank-daily-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="broto-qbank-daily-count">
        Hoje em {focusLabel}: <strong>{answered}</strong> / {goal} questões
      </p>
    </section>
  )
}
