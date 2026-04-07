import { useMemo } from 'react'
import { BookOpen, Clock, Target, Percent } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'

const META_QUESTOES_DIA = 3

type DashboardStudyStatsProps = {
  /** Classe extra no `<section>` (ex.: margem na página de progresso) */
  className?: string
}

export function DashboardStudyStats({ className }: DashboardStudyStatsProps) {
  const { user: profile, loading: loadingUser } = useUser()
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()

  const loading = loadingUser || loadingProgress
  const horasPorDia = profile?.horasDisponiveisPorDia ?? 2
  const areasForRoutine = progress?.areas?.length ? progress.areas : DEFAULT_AREAS

  const rotina = useMemo(
    () => (!loading ? gerarRotina(areasForRoutine, horasPorDia) : []),
    [loading, areasForRoutine, horasPorDia],
  )
  const diaHoje = useMemo(() => rotina.find((d) => d.ehHoje), [rotina])

  const questoesHoje = pet?.questoesHoje ?? 0
  const questoesMetaCount = Math.min(questoesHoje, META_QUESTOES_DIA)
  const missionsPct = Math.round((questoesMetaCount / META_QUESTOES_DIA) * 100)

  const goalMinutesPlanned = useMemo(() => {
    if (!diaHoje || diaHoje.ehDescanso) return 0
    return Math.max(diaHoje.duracaoMin, horasPorDia * 60)
  }, [diaHoje, horasPorDia])

  const studiedMinutesEstimate = useMemo(() => {
    if (goalMinutesPlanned <= 0) return 0
    return Math.round((questoesMetaCount / META_QUESTOES_DIA) * goalMinutesPlanned)
  }, [goalMinutesPlanned, questoesMetaCount])

  const accuracyPct = progress?.accuracyPct ?? 0
  const totalAnswered = progress?.totalAnswered ?? 0
  const hasProgressData = !loadingProgress && progress !== null && progress.totalAnswered > 0

  const sectionClass = ['broto-dashboard-stats', className].filter(Boolean).join(' ')

  return (
    <section className={sectionClass} aria-label="Indicadores de estudo">
      <div className="broto-stats-card">
        <div className="broto-stat-item">
          <div className="broto-stat-item__head">
            <span className="broto-stat-item__label">Acerto</span>
            <div className="broto-stat-item__icon" aria-hidden>
              <Percent size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="broto-stat-item__val">
            {loadingProgress ? (
              <>
                <span className="broto-stat-item__val-main">—</span>
                <span className="broto-stat-item__unit">%</span>
              </>
            ) : hasProgressData ? (
              <>
                <span className="broto-stat-item__val-main">{accuracyPct}</span>
                <span className="broto-stat-item__unit">%</span>
              </>
            ) : (
              <>
                <span className="broto-stat-item__val-main">—</span>
                <span className="broto-stat-item__unit">%</span>
              </>
            )}
          </div>
        </div>

        <div className="broto-stat-item">
          <div className="broto-stat-item__head">
            <span className="broto-stat-item__label">Questões</span>
            <div className="broto-stat-item__icon" aria-hidden>
              <BookOpen size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="broto-stat-item__val">
            {loadingProgress ? (
              <span className="broto-stat-item__val-main broto-stat-item__val-main--muted">
                —
              </span>
            ) : (
              <span className="broto-stat-item__val-main">{totalAnswered}</span>
            )}
          </div>
        </div>

        <div className="broto-stat-item">
          <div className="broto-stat-item__head">
            <span className="broto-stat-item__label">Tempo</span>
            <div className="broto-stat-item__icon" aria-hidden>
              <Clock size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="broto-stat-item__val broto-stat-item__val--inline">
            {loading || loadingPet ? (
              <span className="broto-stat-item__val-main broto-stat-item__val-main--muted">
                —
              </span>
            ) : goalMinutesPlanned === 0 ? (
              <>
                <span className="broto-stat-item__val-main">0m</span>
                <span className="broto-stat-item__suffix">/ 0m</span>
              </>
            ) : (
              <>
                <span className="broto-stat-item__val-main">{studiedMinutesEstimate}m</span>
                <span className="broto-stat-item__suffix">/ {goalMinutesPlanned}m</span>
              </>
            )}
          </div>
        </div>

        <div className="broto-stat-item">
          <div className="broto-stat-item__head">
            <span className="broto-stat-item__label">Meta diária</span>
            <div className="broto-stat-item__icon" aria-hidden>
              <Target size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="broto-stat-item__val">
            {loadingPet ? (
              <>
                <span className="broto-stat-item__val-main broto-stat-item__val-main--muted">
                  —
                </span>
              </>
            ) : (
              <>
                <span className="broto-stat-item__val-main">{missionsPct}</span>
                <span className="broto-stat-item__unit">%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
