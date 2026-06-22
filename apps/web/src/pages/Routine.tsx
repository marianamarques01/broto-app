import { type KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { WeekStrip } from '@/components/routine/WeekStrip'
import { RoutineHeroHeader } from '@/components/routine/RoutineHeroHeader'
import { RoutineSessionCards } from '@/components/routine/RoutineSessionCards'
import { RoutineAreaPerformance } from '@/components/routine/RoutineAreaPerformance'
import { RoutineWeekBars } from '@/components/routine/RoutineWeekBars'
import { RoutineBrotoTip } from '@/components/routine/RoutineBrotoTip'
import { useUser } from '@/hooks/useUser'
import { useProgress } from '@/hooks/useProgress'
import { usePet } from '@/hooks/usePet'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { BookOpen, Plus } from 'lucide-react'
import { getAreaColor, getAreaIcon } from '@/lib/area-config'
import { gerarRotina, getSegundaDaSemana, formatarSemana } from '@/lib/routine'
import { buildRoutineSessions, countCompletedSessions } from '@/lib/routine-sessions'

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

const ROUTINE_TABS = [
  { id: 'hoje' as const, label: 'Hoje' },
  { id: 'semana' as const, label: 'Semana' },
  { id: 'personalizar' as const, label: 'Personalizar' },
]

export function Routine() {
  const { user, loading: loadingUser } = useUser()
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()
  const { buckets: weekBuckets } = usePerformanceSeries('week')

  const [tab, setTab] = useState<RoutineTab>('hoje')

  const focusTabAt = useCallback((next: RoutineTab) => {
    setTab(next)
    requestAnimationFrame(() => {
      document.getElementById(`routine-tab-${next}`)?.focus()
    })
  }, [])

  function handleRoutineTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ROUTINE_TABS.map((t) => t.id)
    const i = keys.indexOf(tab)
    if (i < 0) return

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault()
        focusTabAt(keys[(i + 1) % keys.length])
        break
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault()
        focusTabAt(keys[(i - 1 + keys.length) % keys.length])
        break
      }
      case 'Home': {
        e.preventDefault()
        focusTabAt(keys[0])
        break
      }
      case 'End': {
        e.preventDefault()
        focusTabAt(keys[keys.length - 1])
        break
      }
      default:
        break
    }
  }

  const loading = loadingUser || loadingProgress
  const horasPorDia = user?.horasDisponiveisPorDia ?? 2
  const areas = useMemo(() => progress?.areas ?? [], [progress])
  const goalMin = Math.round(horasPorDia * 60)

  const rotina = useMemo(
    () => (!loading ? gerarRotina(areas, horasPorDia) : []),
    [loading, areas, horasPorDia],
  )

  const sessions = useMemo(
    () => (!loading ? buildRoutineSessions(areas, horasPorDia, pet?.studyTodayByArea) : []),
    [loading, areas, horasPorDia, pet?.studyTodayByArea],
  )

  const completed = countCompletedSessions(sessions)
  const totalSess = sessions.length || 4

  const semanaLabel = useMemo(() => formatarSemana(getSegundaDaSemana(new Date())), [])
  const dateLine = useMemo(() => formatRoutineDateLine(new Date()), [])

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
          <div className="broto-routine-skeleton" aria-busy="true" aria-live="polite">
            <div className="broto-routine-skeleton__hero broto-skeleton" />
            <div className="broto-routine-skeleton__tabs broto-skeleton" />
            <div className="broto-routine-skeleton__panel broto-skeleton" />
            <span className="broto-routine-sr-only">Carregando sua rotina…</span>
          </div>
        ) : (
          <div className="broto-routine-layout">
            <div className="broto-routine-primary">
              <RoutineHeroHeader dateLine={dateLine} completed={completed} total={totalSess} />

              <div className="broto-routine-toolbar">
                <p className="broto-routine-toolbar__hint" id="routine-tabs-desc">
                  Passe rápido por hoje, visão semanal ou ajustes do plano inteligente.
                </p>
                <nav
                  className="broto-routine-tabs"
                  role="tablist"
                  aria-label="Visão da rotina"
                  aria-describedby="routine-tabs-desc"
                  onKeyDown={handleRoutineTabKeyDown}
                >
                  {ROUTINE_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`routine-tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls={`routine-tabpanel-${t.id}`}
                      tabIndex={tab === t.id ? 0 : -1}
                      className={`broto-routine-tab${tab === t.id ? ' broto-routine-tab--active' : ''}`}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div
                className={`broto-routine-panel-shell${tab !== 'personalizar' ? ' broto-routine-panel-shell--surface' : ' broto-routine-panel-shell--personal'}`}
              >
                <div
                  id="routine-tabpanel-hoje"
                  role="tabpanel"
                  aria-labelledby="routine-tab-hoje"
                  hidden={tab !== 'hoje'}
                  className={`broto-routine-panel${tab === 'hoje' ? ' broto-fade-in' : ''}`}
                >
                  <RoutineSessionCards sessions={sessions} />
                  <Link to="/study" className="broto-routine-add">
                    <Plus size={18} strokeWidth={2.25} aria-hidden />
                    Adicionar sessão
                  </Link>
                </div>

                <div
                  id="routine-tabpanel-semana"
                  role="tabpanel"
                  aria-labelledby="routine-tab-semana"
                  hidden={tab !== 'semana'}
                  className={`broto-routine-panel broto-routine-panel--week${tab === 'semana' ? ' broto-fade-in' : ''}`}
                >
                  <div className="broto-routine-week-plan">
                    <div className="broto-routine-week-head">
                      <span className="broto-routine-week-head__eyebrow">Plano por dia</span>
                      <div className="broto-routine-week-head__row">
                        <span className="broto-routine-week-head__label">{semanaLabel}</span>
                        <span className="broto-routine-week-head__hint">
                          {horasPorDia} h/dia planejadas
                        </span>
                      </div>
                    </div>
                    <div className="broto-routine-week-strip-wrap">
                      <WeekStrip rotina={rotina} />
                    </div>
                  </div>
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
                              {dia.ehDescanso ? 'Descanso' : (dia.area?.label ?? '—')}
                            </span>
                            <span className="broto-routine-week-row__sub">
                              {dia.ehDescanso
                                ? 'Recupere energia'
                                : `${Math.round(dia.duracaoMin / 60)} h · prioridade automática`}
                            </span>
                          </div>
                          {!dia.ehDescanso && dia.area && (
                            <Link
                              to={`/study/${dia.area.value}`}
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

                <div
                  id="routine-tabpanel-personalizar"
                  role="tabpanel"
                  aria-labelledby="routine-tab-personalizar"
                  hidden={tab !== 'personalizar'}
                  className={`broto-routine-panel broto-routine-panel--personal${tab === 'personalizar' ? ' broto-fade-in' : ''}`}
                >
                  <div className="broto-routine-personal__intro">
                    <span className="broto-routine-personal__eyebrow">
                      Como montamos sua semana
                    </span>
                    <h2 className="broto-routine-personal__title">Sua rotina inteligente</h2>
                    <p className="broto-routine-personal__copy">
                      Priorizamos áreas com menor acerto e respeitamos suas horas por dia. O plano é
                      montado neste aparelho com base no seu progresso — em breve poderemos
                      sincronizar rotinas personalizadas na nuvem e sugestões da IA.
                    </p>
                  </div>
                  <div className="broto-routine-personal__card">
                    <span className="broto-routine-personal__card-label">
                      Disponibilidade diária
                    </span>
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
                  <div className="broto-routine-personal__callouts">
                    <div className="broto-routine-personal__callout">
                      <span className="broto-routine-personal__callout-label">Critérios</span>
                      <span className="broto-routine-personal__callout-text">
                        Matérias mais frágeis aparecem mais cedo nos blocos.
                      </span>
                    </div>
                    <div className="broto-routine-personal__callout">
                      <span className="broto-routine-personal__callout-label">Descansos</span>
                      <span className="broto-routine-personal__callout-text">
                        Respeitamos dias de descanso na grade semanal.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="broto-routine-aside" aria-label="Resumo e desempenho">
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

              <RoutineAreaPerformance areas={areas} />

              <RoutineBrotoTip areas={areas} />
            </aside>
          </div>
        )}
      </div>
    </>
  )
}
