import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { WeekStrip } from '@/components/routine/WeekStrip'
import { RoutineHeroHeader } from '@/components/routine/RoutineHeroHeader'
import { RoutineSessionCards } from '@/components/routine/RoutineSessionCards'
import { RoutineWeekBars } from '@/components/routine/RoutineWeekBars'
import { RoutineBrotoTip } from '@/components/routine/RoutineBrotoTip'
import { useUser } from '@/hooks/useUser'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { useDailyMissionsState } from '@/hooks/useDailyMissionsState'
import { BookOpen, Plus } from 'lucide-react'
import { getAreaColor, getAreaIcon } from '@/lib/area-config'
import { gerarRotina, getSegundaDaSemana, formatarSemana } from '@/lib/routine'
import { buildRoutineSessions, countCompletedSessions } from '@/lib/routine-sessions'
import { getPerformanceBuckets } from '@/lib/performance-history'

const WD_UP = [
  'DOMINGO',
  'SEGUNDA-FEIRA',
  'TERÇA-FEIRA',
  'QUARTA-FEIRA',
  'QUINTA-FEIRA',
  'SEXTA-FEIRA',
  'SÁBADO',
] as const

const MESES_UP = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
] as const

function formatRoutineDateLine(d: Date): string {
  return `${WD_UP[d.getDay()]}, ${d.getDate()} DE ${MESES_UP[d.getMonth()]}`
}

type RoutineTab = 'hoje' | 'semana' | 'personalizar'

export function Routine() {
  const { user, loading: loadingUser } = useUser()
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()
  const { daily } = useDailyMissionsState()

  const [tab, setTab] = useState<RoutineTab>('hoje')

  const loading = loadingUser || loadingProgress
  const horasPorDia = user?.horasDisponiveisPorDia ?? 2
  const areas = useMemo(() => progress?.areas ?? [], [progress])
  const goalMin = Math.round(horasPorDia * 60)

  const rotina = useMemo(
    () => (!loading ? gerarRotina(areas, horasPorDia) : []),
    [loading, areas, horasPorDia],
  )

  const sessions = useMemo(
    () =>
      !loading
        ? buildRoutineSessions(areas, daily, horasPorDia, pet?.studyTodayByArea)
        : [],
    [loading, areas, daily, horasPorDia, pet?.studyTodayByArea],
  )

  const completed = countCompletedSessions(sessions)
  const totalSess = sessions.length || 4

  const semanaLabel = useMemo(() => formatarSemana(getSegundaDaSemana(new Date())), [])
  const dateLine = useMemo(() => formatRoutineDateLine(new Date()), [])

  const weekBuckets = getPerformanceBuckets('week')

  const minutosHoje = useMemo(() => {
    if (pet?.tempoEstudoSegHoje && pet.tempoEstudoSegHoje > 0) {
      return Math.max(1, Math.round(pet.tempoEstudoSegHoje / 60))
    }
    return Math.round((pet?.questoesHoje ?? 0) * 2.5)
  }, [pet])

  const xpHoje = useMemo(
    () => sessions.filter((s) => s.status === 'completed').reduce((a, s) => a + s.xp, 0),
    [sessions],
  )

  const streak = pet?.streak ?? 0

  return (
    <>
      <TopBar variant="study" title="Rotina" />
      <div className="broto-main-inner broto-main-inner--study broto-routine-page">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="broto-skeleton" style={{ height: 140 }} />
            <div className="broto-skeleton" style={{ height: 320 }} />
          </div>
        ) : (
          <div className="broto-routine-layout">
            <div className="broto-routine-primary">
              <RoutineHeroHeader dateLine={dateLine} completed={completed} total={totalSess} />

              <div className="broto-routine-tabs" role="tablist" aria-label="Visão da rotina">
                {(
                  [
                    { id: 'hoje' as const, label: 'Hoje' },
                    { id: 'semana' as const, label: 'Semana' },
                    { id: 'personalizar' as const, label: 'Personalizar' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`broto-routine-tab${tab === t.id ? ' broto-routine-tab--active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'hoje' && (
                <div className="broto-routine-panel broto-fade-in">
                  <RoutineSessionCards sessions={sessions} />
                  <Link to="/study" className="broto-routine-add">
                    <Plus size={18} strokeWidth={2.25} aria-hidden />
                    Adicionar sessão
                  </Link>
                </div>
              )}

              {tab === 'semana' && (
                <div className="broto-routine-panel broto-routine-panel--week broto-fade-in">
                  <div className="broto-routine-week-head">
                    <span className="broto-routine-week-head__label">{semanaLabel}</span>
                    <span className="broto-routine-week-head__hint">{horasPorDia} h/dia planejadas</span>
                  </div>
                  <WeekStrip rotina={rotina} />
                  <div className="broto-routine-week-days">
                    {rotina.map((dia) => {
                      const Icon = dia.area ? getAreaIcon(dia.area.value) : BookOpen
                      const color = dia.area ? getAreaColor(dia.area.value) : 'var(--text-muted)'
                      return (
                        <div
                          key={dia.idx}
                          className={`broto-routine-week-row${dia.ehHoje ? ' broto-routine-week-row--today' : ''}`}
                        >
                          <span className="broto-routine-week-row__dow">{dia.label}</span>
                          <div
                            className="broto-routine-week-row__icon"
                            style={{
                              background: dia.ehDescanso ? 'var(--bg-deep)' : `${color}18`,
                            }}
                          >
                            <Icon size={18} style={{ color }} aria-hidden />
                          </div>
                          <div className="broto-routine-week-row__body">
                            <span className="broto-routine-week-row__title">
                              {dia.ehDescanso ? 'Descanso' : dia.area?.label ?? '—'}
                            </span>
                            <span className="broto-routine-week-row__sub">
                              {dia.ehDescanso
                                ? 'Recupere energia'
                                : `${Math.round(dia.duracaoMin / 60)} h · prioridade automática`}
                            </span>
                          </div>
                          {!dia.ehDescanso && dia.area && (
                            <Link
                              to={`/study/${dia.area.value}?hub=bank`}
                              className="broto-routine-week-row__cta"
                            >
                              Abrir
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === 'personalizar' && (
                <div className="broto-routine-panel broto-routine-panel--personal broto-fade-in">
                  <h2 className="broto-routine-personal__title">Sua rotina inteligente</h2>
                  <p className="broto-routine-personal__copy">
                    Priorizamos áreas com menor acerto e respeitamos suas horas por dia. O plano é
                    montado neste aparelho com base no seu progresso — em breve poderemos sincronizar
                    rotinas personalizadas na nuvem e sugestões da IA.
                  </p>
                  <div className="broto-routine-personal__card">
                    <span className="broto-routine-personal__card-label">Disponibilidade diária</span>
                    <strong className="broto-routine-personal__card-value">
                      {horasPorDia} {horasPorDia === 1 ? 'hora' : 'horas'} / dia
                    </strong>
                    <p className="broto-routine-personal__card-hint">
                      Ajuste no perfil para recalibrar blocos e metas de tempo.
                    </p>
                    <Link to="/settings" className="broto-routine-personal__link">
                      Ir para configurações
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <aside className="broto-routine-aside">
              <div className="broto-routine-kpis">
                <div className="broto-routine-kpi">
                  <span className="broto-routine-kpi__value">
                    {minutosHoje}m <span className="broto-routine-kpi__slash">/</span>
                  </span>
                  <span className="broto-routine-kpi__rest">de {goalMin}m</span>
                  <span className="broto-routine-kpi__label">Tempo hoje</span>
                </div>
                <div className="broto-routine-kpi">
                  <span className="broto-routine-kpi__value broto-routine-kpi__value--amber">
                    {loadingPet ? '—' : streak}
                  </span>
                  <span className="broto-routine-kpi__rest">dias</span>
                  <span className="broto-routine-kpi__label">Sequência</span>
                </div>
                <div className="broto-routine-kpi">
                  <span className="broto-routine-kpi__value broto-routine-kpi__value--mint">
                    +{xpHoje}
                  </span>
                  <span className="broto-routine-kpi__rest">XP</span>
                  <span className="broto-routine-kpi__label">Hoje</span>
                </div>
              </div>

              <RoutineWeekBars buckets={weekBuckets} targetMinPerDay={goalMin} />

              <RoutineBrotoTip areas={areas} />
            </aside>
          </div>
        )}
      </div>
    </>
  )
}
