import type {
  DailyMissionsState,
  QuestionBankPrimaryAction,
  QuestionBankTrackId,
} from '@broto/shared'
import type { AreaStat } from '@/hooks/useProgress'
import { buildDailyMissions, DAILY_MISSION_VOLUME_QUEST_GOAL, parseDailyMissionQuestionCount } from '@/lib/build-daily-missions'
import { ArrowRight } from 'lucide-react'

const DEFAULT_GOAL = DAILY_MISSION_VOLUME_QUEST_GOAL

const TRACK_PILL: Record<QuestionBankTrackId, string> = {
  mistakes: 'Erros recentes',
  weak: 'Reforço',
  newTopics: 'Novo tema',
  freeExplore: 'Catálogo',
}

function mergedAnsweredToday(
  areaKey: string,
  daily: DailyMissionsState,
  serverToday?: Record<string, { answered: number; correct: number }>,
): number {
  const l = daily.byArea[areaKey] ?? { answered: 0, correct: 0 }
  const s = serverToday?.[areaKey] ?? { answered: 0, correct: 0 }
  return Math.max(l.answered, s.answered)
}

export interface QuestionBankFocusBandProps {
  primary: QuestionBankPrimaryAction | null
  loading: boolean
  onStart: () => void
  areaAccent: string
  selectedArea: string
  areaLabel: string
  areas: AreaStat[] | undefined
  daily: DailyMissionsState
  studyTodayByArea?: Record<string, { answered: number; correct: number }>
}

export function QuestionBankFocusBand({
  primary,
  loading,
  onStart,
  areaAccent,
  selectedArea,
  areaLabel: _areaLabel,
  areas,
  daily,
  studyTodayByArea,
}: QuestionBankFocusBandProps) {
  const missions = buildDailyMissions(areas, daily, studyTodayByArea)
  const mission =
    missions.find((m) => m.areaKey === selectedArea) ?? missions[0] ?? null
  const answered = mergedAnsweredToday(selectedArea, daily, studyTodayByArea)
  const parsedGoal =
    mission?.areaKey === selectedArea ? parseDailyMissionQuestionCount(mission.title) : null
  const goal =
    parsedGoal && parsedGoal > 0 ? parsedGoal : DEFAULT_GOAL
  const pct = goal > 0 ? Math.min(100, Math.round((answered / goal) * 100)) : 0

  if (loading) {
    return (
      <section
        className="study-spotlight broto-qbank-focus broto-qbank-focus--loading"
        aria-busy="true"
        aria-label="A carregar foco de hoje"
      >
        <div className="broto-qbank-focus-skel broto-skeleton" />
      </section>
    )
  }

  if (!primary) {
    return (
      <section
        className="study-spotlight broto-qbank-focus broto-qbank-focus--empty"
        aria-live="polite"
      >
        <p className="broto-qbank-focus-empty-msg">Carrega o banco para veres o foco personalizado.</p>
      </section>
    )
  }

  const descId = 'broto-qbank-focus-desc'
  const pill = TRACK_PILL[primary.trackId] ?? TRACK_PILL.freeExplore

  return (
    <section className="study-spotlight broto-qbank-focus" aria-label="Foco de hoje">
      <div className="broto-qbank-focus__badge-row">
        <div className="study-spotlight__badge">✨ Foco de hoje</div>
        <span className="study-spotlight__badge broto-qbank-focus__track-badge">{pill}</span>
      </div>
      <h3 className="study-spotlight__title" id="broto-qbank-focus-title" aria-describedby={descId}>
        {primary.headline}
      </h3>
      <div className="study-spotlight__body broto-qbank-focus__body">
        <div className="broto-qbank-focus__daily-row">
          <span className="broto-qbank-focus__daily-label">Meta do dia</span>
          <div
            className="broto-qbank-focus__bar-wrap"
            role="progressbar"
            aria-valuenow={answered}
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-label={`Questões hoje: ${answered} de ${goal}`}
          >
            <div className="broto-qbank-focus__bar" style={{ width: `${pct}%`, background: areaAccent }} />
          </div>
          <span className="broto-qbank-focus__count" aria-hidden>
            {answered}/{goal}
          </span>
          <button
            type="button"
            className="study-spotlight__cta broto-qbank-focus__cta-row"
            onClick={onStart}
            disabled={!primary.targetRow}
          >
            Continuar
            <ArrowRight size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
      <p id={descId} className="broto-sr-only">
        {primary.subline} {primary.trustLine}
        {mission ? ` ${mission.title}` : ''}
      </p>
    </section>
  )
}
