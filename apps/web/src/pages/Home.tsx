import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_LABEL } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { PetCard } from '@/components/pet/PetCard'
import { HomeDashboardTopBar } from '@/components/layout/HomeDashboardTopBar'
import { DayCard } from '@/components/routine/DayCard'
import { PerformanceChartCard } from '@/components/progress/PerformanceChartCard'
import { BookOpen, Play, Clock, Target, Percent } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'

const META_QUESTOES_DIA = 3

function plantStatusLine(fase: keyof typeof FASE_LABEL): string {
  const lines: Record<keyof typeof FASE_LABEL, string> = {
    semente: `Sua planta está na fase ${FASE_LABEL.semente} — cada questão rega o broto.`,
    muda: `Sua planta está na fase ${FASE_LABEL.muda} — continue firme.`,
    planta: `Sua planta está ${FASE_LABEL.planta.toLowerCase()} — ótimo ritmo.`,
    flor: `Sua planta está ${FASE_LABEL.flor.toLowerCase()}!`,
    especial: `Sua planta está em estágio ${FASE_LABEL.especial.toLowerCase()}.`,
  }
  return lines[fase]
}

export function Home() {
  const { user: profile, loading: loadingUser } = useUser()
  const { progress, loading: loadingProgress } = useProgress()
  const { pet, loading: loadingPet } = usePet()

  const firstName = profile?.nome?.split(' ')[0] ?? 'Aluno'
  const horasPorDia = profile?.horasDisponiveisPorDia ?? 2
  const areas = progress?.areas?.length ? progress.areas : DEFAULT_AREAS
  const areasForRoutine = progress?.areas?.length ? progress.areas : DEFAULT_AREAS
  const loading = loadingUser || loadingProgress

  const rotina = useMemo(
    () => (!loading ? gerarRotina(areasForRoutine, horasPorDia) : []),
    [loading, areasForRoutine, horasPorDia],
  )
  const diaHoje = useMemo(() => rotina.find(d => d.ehHoje), [rotina])

  const areasToFocus = useMemo(
    () => (progress?.areas ?? [])
      .filter(a => a.totalAnswered > 0)
      .sort((a, b) => a.accuracyPct - b.accuracyPct)
      .slice(0, 3),
    [progress?.areas],
  )

  const questoesHoje = pet?.questoesHoje ?? 0
  const questoesMetaCount = Math.min(questoesHoje, META_QUESTOES_DIA)
  const questoesMetaCompleta = questoesHoje >= META_QUESTOES_DIA
  const missionsPct = Math.round((questoesMetaCount / META_QUESTOES_DIA) * 100)

  const continueCta = useMemo(() => {
    const area = areasToFocus[0]
    if (!area) {
      return {
        title: 'Começar a estudar',
        subtitle: 'Escolha a matéria e pratique questões do ENEM.',
      }
    }
    const weakTopico = [...area.topicos]
      .filter(t => t.totalAnswered > 0)
      .sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
    const top = weakTopico?.label ?? area.label
    return {
      title: 'Continuar estudos',
      subtitle: `Última: ${area.label} — ${top}`,
    }
  }, [areasToFocus])

  const goalMinutesPlanned = useMemo(() => {
    if (!diaHoje || diaHoje.ehDescanso) return 0
    return Math.max(diaHoje.duracaoMin, horasPorDia * 60)
  }, [diaHoje, horasPorDia])

  const studiedMinutesEstimate = useMemo(() => {
    if (goalMinutesPlanned <= 0) return 0
    return Math.round((questoesMetaCount / META_QUESTOES_DIA) * goalMinutesPlanned)
  }, [goalMinutesPlanned, questoesHoje])

  const fase = pet?.fase ?? 'semente'
  const plantLine = plantStatusLine(fase)
  const xpTotal = pet?.xp ?? 0
  const streak = pet?.streak ?? 0
  const accuracyPct = progress?.accuracyPct ?? 0
  const totalAnswered = progress?.totalAnswered ?? 0
  const hasProgressData = !loadingProgress && progress !== null && progress.totalAnswered > 0

  return (
    <div className="broto-home-dashboard">
      <HomeDashboardTopBar
        greeting={`Olá, ${firstName}`}
        plantLine={loadingPet ? 'Carregando seu broto...' : plantLine}
        xpTotal={xpTotal}
        streak={streak}
      />

      <div className="broto-main-inner broto-main-inner--dashboard">
        <div className="broto-dashboard-grid broto-fade-in">
          {/* Coluna 1 — Broto + rotina de hoje */}
          <div className="broto-dashboard-col broto-dashboard-col--left">
            <section className="broto-dashboard-section" aria-label="Seu Broto">
              <PetCard />
            </section>
            <section className="broto-dashboard-section broto-dashboard-section--grow" aria-label="Missões de hoje">
              {loading ? (
                <div className="broto-skeleton" style={{ height: 220, borderRadius: 'var(--radius-md)' }} />
              ) : diaHoje ? (
                <DayCard dia={diaHoje} />
              ) : (
                <div className="broto-card" style={{ padding: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Sem dados de rotina ainda.
                </div>
              )}
            </section>
          </div>

          {/* Coluna 2 — indicadores + desempenho (gráfico) */}
          <div className="broto-dashboard-col broto-dashboard-col--center">
            <div className="broto-dashboard-indicators">
              <div className="broto-metric-card broto-metric-card--stat">
                <div className="broto-metric-card__top">
                  <span className="broto-metric-card__label">Acerto</span>
                  <Percent className="broto-metric-card__icon broto-metric-card__icon--green" size={20} strokeWidth={1.75} aria-hidden />
                </div>
                <span className="broto-metric-card__main">
                  {loadingProgress ? '—' : hasProgressData ? `${accuracyPct}%` : '—'}
                </span>
              </div>
              <div className="broto-metric-card broto-metric-card--stat">
                <div className="broto-metric-card__top">
                  <span className="broto-metric-card__label">Questões</span>
                  <BookOpen className="broto-metric-card__icon broto-metric-card__icon--blue" size={20} strokeWidth={1.75} aria-hidden />
                </div>
                <span className="broto-metric-card__main">
                  {loadingProgress ? '—' : totalAnswered}
                </span>
              </div>
            </div>
            <PerformanceChartCard loadingProgress={loadingProgress} />
          </div>

          {/* Coluna 3 — tempo, meta, matérias, CTA, FAB */}
          <div className="broto-dashboard-col broto-dashboard-col--right">
            <div className="broto-dashboard-indicators">
              <div className="broto-metric-card broto-metric-card--time">
                <div className="broto-metric-card__top">
                  <span className="broto-metric-card__label">Tempo</span>
                  <Clock className="broto-metric-card__icon broto-metric-card__icon--gold" size={20} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="broto-metric-card__time-row">
                  {loading || loadingPet ? (
                    <span className="broto-metric-card__main broto-metric-card__main--muted">—</span>
                  ) : goalMinutesPlanned === 0 ? (
                    <>
                      <span className="broto-metric-card__main">0m</span>
                      <span className="broto-metric-card__suffix">/ 0m</span>
                    </>
                  ) : (
                    <>
                      <span className="broto-metric-card__main">{studiedMinutesEstimate}m</span>
                      <span className="broto-metric-card__suffix">/ {goalMinutesPlanned}m</span>
                    </>
                  )}
                </div>
              </div>
              <div className="broto-metric-card broto-metric-card--daily">
                <div className="broto-metric-card__top">
                  <span className="broto-metric-card__label">Meta diária</span>
                  <Target className="broto-metric-card__icon broto-metric-card__icon--purple" size={20} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="broto-metric-card__daily-body">
                  {loadingPet ? (
                    <span className="broto-metric-card__main broto-metric-card__main--muted">—</span>
                  ) : (
                    <span className="broto-metric-card__main">{missionsPct}%</span>
                  )}
                </div>
              </div>
            </div>

            <section className="broto-dashboard-section broto-dashboard-subjects" aria-labelledby="home-subjects-heading">
              <header className="broto-dashboard-subjects-head">
                <div className="broto-section-heading-row">
                  <span className="broto-heading-dot" aria-hidden />
                  <h3 id="home-subjects-heading" className="broto-section-label">
                    Acesso rápido às matérias
                  </h3>
                </div>
                <Link
                  to="/study"
                  className="broto-missions-panel__badge broto-subjects-questions-btn"
                  style={{
                    color: questoesMetaCompleta ? 'var(--green-400)' : 'var(--text-muted)',
                  }}
                  aria-label={`Questões de hoje: ${questoesMetaCount} de ${META_QUESTOES_DIA} completas`}
                >
                  {loadingPet
                    ? '—'
                    : `${questoesMetaCount}/${META_QUESTOES_DIA} completas`}
                </Link>
              </header>
              <div className="broto-subject-chips">
                {areas.map(area => {
                  const config = AREA_CONFIG[area.value] ?? { color: '#888', icon: BookOpen }
                  const Icon = config.icon
                  return (
                    <Link
                      key={area.value}
                      to="/study"
                      className="broto-subject-chip"
                      style={{ borderColor: `${config.color}40` }}
                    >
                      <span className="broto-subject-chip__icon" style={{ background: `${config.color}18`, color: config.color }}>
                        <Icon size={18} />
                      </span>
                      <span className="broto-subject-chip__label">{area.label}</span>
                    </Link>
                  )
                })}
              </div>
              <Link to="/study" className="broto-continue-studies">
                <span className="broto-continue-studies__watermark" aria-hidden>
                  <Play size={140} strokeWidth={1.2} fill="currentColor" />
                </span>
                <span className="broto-continue-studies__inner">
                  <span className="broto-continue-studies__play-chip">
                    <Play size={22} fill="currentColor" strokeWidth={0} aria-hidden />
                  </span>
                  <span className="broto-continue-studies__copy">
                    <span className="broto-continue-studies__title">{continueCta.title}</span>
                    <span className="broto-continue-studies__subtitle">{continueCta.subtitle}</span>
                  </span>
                </span>
              </Link>
            </section>
          </div>
        </div>
      </div>

      <div className="broto-fab-ia-wrap" role="presentation">
        <span className="broto-fab-ia-ring" aria-hidden />
        <span className="broto-fab-ia-glow" aria-hidden />
        <Link
          to="/broto"
          className="broto-fab-ia"
          title="Conversar com o Broto (IA)"
          aria-label="Conversar com o Broto (IA)"
        >
          {'\u{1F331}'}
        </Link>
      </div>
    </div>
  )
}
