import { Link } from 'react-router-dom'
import type { AreaStat } from '@/hooks/useProgress'
import { useProgress } from '@/hooks/useProgress'
import { useDailyMissionsState } from '@/hooks/useDailyMissionsState'
import { BookOpen, CheckCircle2, Coffee, Lock, Zap } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'
import type { DailyMissionsState } from '@/lib/daily-missions'

interface DiaRotina {
  label: string
  area: AreaStat | null
  topicosDestaque: { value: string; label: string; accuracyPct: number }[]
  duracaoMin: number
  ehDescanso: boolean
  ehHoje: boolean
}

interface DayCardProps {
  dia: DiaRotina
}

const DEFAULT_MISSION_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'] as const

function areaLabel(key: string) {
  return AREA_CONFIG[key]?.label ?? 'Questões'
}

interface Mission {
  title: string
  subtitle: string
  xp: number
  areaKey: string
  done: boolean
  locked: boolean
}

function buildMissions(
  areas: AreaStat[] | undefined,
  daily: DailyMissionsState,
): Mission[] {
  const sortedKeys = areas?.length
    ? [...areas]
        .filter(a => a.totalAnswered >= 1)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .map(a => a.value)
    : []

  const missionAreas = [
    sortedKeys[0] ?? DEFAULT_MISSION_AREAS[0],
    sortedKeys[1] ?? DEFAULT_MISSION_AREAS[1],
    sortedKeys[2] ?? DEFAULT_MISSION_AREAS[2],
  ]

  const areaAnswered = (key: string) => daily.byArea[key]?.answered ?? 0
  const areaCorrect = (key: string) => daily.byArea[key]?.correct ?? 0
  const areaAccuracy = (key: string) => {
    const a = areaAnswered(key)
    if (a === 0) return null
    return Math.round((areaCorrect(key) / a) * 100)
  }

  return [
    {
      title: `3 questões de ${areaLabel(missionAreas[0])}`,
      subtitle: 'Área com maior oportunidade',
      xp: 30,
      areaKey: missionAreas[0],
      done: areaAnswered(missionAreas[0]) >= 3,
      locked: false,
    },
    {
      title: `2 questões de ${areaLabel(missionAreas[1])}`,
      subtitle: 'Continue progredindo',
      xp: 20,
      areaKey: missionAreas[1],
      done: areaAnswered(missionAreas[1]) >= 2,
      locked: areaAnswered(missionAreas[0]) < 3,
    },
    {
      title: 'Atingir 70% de acerto',
      subtitle:
        areaAccuracy(missionAreas[2]) !== null
          ? `Acerto atual: ${areaAccuracy(missionAreas[2])}%`
          : 'Acerto atual: —',
      xp: 50,
      areaKey: missionAreas[2],
      done:
        areaAnswered(missionAreas[2]) >= 5 &&
        (areaAccuracy(missionAreas[2]) ?? 0) >= 70,
      locked: areaAnswered(missionAreas[2]) < 5,
    },
  ]
}

function MissionsExternalHead({
  doneMissions,
  showBadge,
}: {
  doneMissions: number
  showBadge: boolean
}) {
  const allDone = doneMissions === 3
  return (
    <header className="broto-missions-external-head" aria-labelledby="broto-missions-title">
      <div className="broto-section-heading-row">
        <span className="broto-heading-dot" aria-hidden />
        <h2 id="broto-missions-title" className="broto-missions-panel__heading">
          Missões de hoje
        </h2>
      </div>
      {showBadge && (
        <span
          className="broto-missions-panel__badge"
          style={{
            color: allDone ? 'var(--green-400)' : 'var(--text-muted)',
          }}
        >
          {doneMissions}/3 completas
        </span>
      )}
    </header>
  )
}

export function DayCard({ dia }: DayCardProps) {
  const { progress } = useProgress()
  const daily = useDailyMissionsState()

  if (dia.ehDescanso) {
    return (
      <div className="broto-missions-stack">
        <MissionsExternalHead doneMissions={0} showBadge={false} />
        <article className="broto-missions-panel broto-missions-panel--rest" aria-label="Dia de descanso">
          <div className="broto-missions-panel__rest-inner">
            <Coffee size={32} style={{ color: 'var(--text-muted)', marginBottom: 4 }} aria-hidden />
            <p className="broto-missions-panel__rest-title">Dia de descanso</p>
            <p className="broto-missions-panel__rest-copy">
              Descanse bem — você merece. Volte amanhã com tudo.
            </p>
          </div>
        </article>
      </div>
    )
  }

  const missions = buildMissions(progress?.areas, daily)
  const doneMissions = missions.filter(m => m.done).length
  const allDone = doneMissions === 3

  return (
    <div className="broto-missions-stack">
      <MissionsExternalHead doneMissions={doneMissions} showBadge />
      <article className="broto-missions-panel" aria-labelledby="broto-missions-title">
        <ul className="broto-missions-panel__list">
          {missions.map((mission, i) => {
            const cfg = AREA_CONFIG[mission.areaKey] ?? { color: '#888', icon: BookOpen, label: 'Questões' }
            const Icon = cfg.icon
            const inner = (
              <>
                <div
                  className="broto-mission-card__icon-wrap"
                  style={{
                    borderColor: mission.done
                      ? 'rgba(16, 185, 129, 0.45)'
                      : mission.locked
                        ? 'rgba(148, 163, 184, 0.35)'
                        : 'rgba(255, 255, 255, 0.12)',
                    background: mission.locked ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.25)',
                  }}
                >
                  {mission.locked ? (
                    <Lock size={16} style={{ color: 'var(--text-secondary)' }} aria-hidden />
                  ) : mission.done ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--green-400)' }} aria-hidden />
                  ) : (
                    <Icon size={16} style={{ color: 'rgba(255,255,255,0.88)' }} aria-hidden />
                  )}
                </div>
                <div className="broto-mission-card__text">
                  <div
                    className={`broto-mission-card__title${mission.done ? ' broto-mission-card__title--done' : ''}${mission.locked ? ' broto-mission-card__title--locked' : ''}`}
                  >
                    {mission.title}
                  </div>
                  <div className="broto-mission-card__subtitle">
                    {mission.locked ? 'Complete a missão anterior' : mission.subtitle}
                  </div>
                </div>
                {!mission.done && !mission.locked && (
                  <span className="broto-mission-card__xp">
                    <Zap size={11} strokeWidth={2.5} aria-hidden />
                    +{mission.xp}
                  </span>
                )}
                {mission.done && (
                  <span className="broto-mission-card__xp-done">+{mission.xp} XP</span>
                )}
              </>
            )
            return (
              <li key={`mission-${i}`} className="broto-missions-panel__item">
                {mission.locked ? (
                  <div className="broto-mission-card broto-mission-card--locked">
                    {inner}
                  </div>
                ) : (
                  <Link
                    to="/study"
                    className={`broto-mission-card${mission.done ? ' broto-mission-card--done' : ''}`}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>

        <Link to="/study" className="broto-missions-panel__cta">
          {allDone ? 'Missões completas! Continuar' : 'Começar missões'}
          <span aria-hidden> →</span>
        </Link>
      </article>
    </div>
  )
}
