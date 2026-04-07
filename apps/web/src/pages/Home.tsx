import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_LABEL } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { PetCard } from '@/components/pet/PetCard'
import { HomeDashboardTopBar } from '@/components/layout/HomeDashboardTopBar'
import { PerformanceChartCard } from '@/components/progress/PerformanceChartCard'
import { BookOpen, Play } from 'lucide-react'
import { DashboardStudyStats } from '@/components/progress/DashboardStudyStats'
import { AREA_CONFIG } from '@/lib/area-config'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import { HomeRightSidebar } from '@/components/home/HomeRightSidebar'
import { HomePetBanner } from '@/components/home/HomePetBanner'
import { HomeDashboardMetricsPlaceholder } from '@/components/home/HomeDashboardMetricsPlaceholder'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import { BrotoChatModal } from '@/components/broto/BrotoChatModal'

/** `false` = oculta KPIs (Acerto, Questões…) e o bloco “Desempenho” no dashboard. */
const SHOW_HOME_METRICS_SECTION = false

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
  const [brotoChatOpen, setBrotoChatOpen] = useState(false)
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
  const diaHoje = useMemo(() => rotina.find((d) => d.ehHoje), [rotina])

  const areasToFocus = useMemo(
    () =>
      (progress?.areas ?? [])
        .filter((a) => a.totalAnswered > 0)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 3),
    [progress?.areas],
  )

  const continueCta = useMemo(() => {
    const area = areasToFocus[0]
    if (!area) {
      return {
        title: 'Banco de Questões',
        subtitle: 'Escolha a matéria e pratique questões do ENEM.',
      }
    }
    const weakTopico = [...area.topicos]
      .filter((t) => t.totalAnswered > 0)
      .sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
    const top = weakTopico?.label ?? area.label
    return {
      title: 'Continuar estudos',
      subtitle: `Última: ${area.label} — ${top}`,
    }
  }, [areasToFocus])

  const fase = pet?.fase ?? 'semente'
  const plantLine = plantStatusLine(fase)
  const xpTotal = pet?.xp ?? 0
  const streak = pet?.streak ?? 0
  return (
    <div className="broto-home-dashboard">
      <HomeDashboardTopBar
        greeting={`Olá, ${firstName}`}
        plantLine={loadingPet ? 'Carregando seu broto...' : plantLine}
        xpTotal={xpTotal}
        streak={streak}
      />

      <div className="broto-home-dashboard__body">
        <div className="broto-home-dashboard__main">
          <div className="broto-main-inner broto-main-inner--dashboard">
            <div className="broto-dashboard-grid broto-dashboard-grid--pet-banner broto-fade-in">
              <div className="broto-dashboard-hero">
                <HomePetBanner />
                <div className="broto-dashboard-hero__aside">
                  <section
                    className="broto-dashboard-section broto-dashboard-subjects"
                    aria-labelledby="home-subjects-heading"
                  >
                    <header className="broto-dashboard-subjects-head">
                      <div className="broto-section-heading-row">
                        <h3 id="home-subjects-heading" className="broto-section-label">
                          Acesso rápido
                        </h3>
                      </div>
                      <Link
                        to="/study"
                        className="broto-missions-panel__badge broto-subjects-questions-btn broto-dashboard-subjects__study-link"
                        aria-label={`Abrir a área de estudo com todas as matérias (${areas.length} áreas)`}
                      >
                        Ver estudo
                      </Link>
                    </header>
                    <div className="broto-subject-chips">
                      {areas.map((area) => {
                        const config = AREA_CONFIG[area.value] ?? { color: '#888', icon: BookOpen }
                        const Icon = config.icon
                        const av = AREA_ACCENT_VARS[area.value] ?? AREA_ACCENT_VARS.linguagens
                        const nTopicos = area.topicos.length
                        const metaLinha =
                          area.totalAnswered > 0
                            ? `${nTopicos} tópicos · ${area.accuracyPct}% média`
                            : `${nTopicos} tópicos · sem média`
                        return (
                          <Link
                            key={area.value}
                            to="/study"
                            className="study-area-card broto-subject-area-card"
                            style={
                              {
                                '--study-area-accent': config.color,
                                '--ac-dim': av.dim,
                                '--ac-glow': av.glow,
                              } as CSSProperties
                            }
                          >
                            <StudyAreaCardPattern areaKey={area.value} />
                            <div className="study-area-card__glow" aria-hidden />
                            <div className="study-area-card__icon">
                              <Icon size={18} color="currentColor" strokeWidth={1.8} />
                            </div>
                            <div className="study-area-card__text">
                              <p className="study-area-card__label">{area.label}</p>
                              <p className="study-area-card__meta">{metaLinha}</p>
                            </div>
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
                          <span className="broto-continue-studies__subtitle">
                            {continueCta.subtitle}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </section>
                </div>
              </div>

              {SHOW_HOME_METRICS_SECTION ? (
                <DashboardStudyStats />
              ) : (
                <HomeDashboardMetricsPlaceholder />
              )}

              {/* Card legado do Broto: mantido no DOM, oculto via CSS (substituído pelo banner) */}
              <div className="broto-pet-card-legacy" aria-hidden>
                <PetCard />
              </div>

              {/* Desempenho — largura total após mover Acesso rápido para a hero */}
              {SHOW_HOME_METRICS_SECTION ? (
                <div className="broto-dashboard-col broto-dashboard-col--center">
                  <PerformanceChartCard loadingProgress={loadingProgress} />
                </div>
              ) : null}
             </div>
          </div>
        </div>

        <HomeRightSidebar diaHoje={diaHoje} horasPorDia={horasPorDia} />
      </div>

      <div className="broto-fab-ia-wrap" role="presentation">
        <span className="broto-fab-ia-ring" aria-hidden />
        <span className="broto-fab-ia-glow" aria-hidden />
        <button
          type="button"
          className="broto-fab-ia"
          title="Conversar com o Broto (IA)"
          aria-label="Conversar com o Broto (IA)"
          aria-expanded={brotoChatOpen}
          aria-controls="broto-chat-floating-panel"
          onClick={() => setBrotoChatOpen(true)}
        >
          {'\u{1F331}'}
        </button>
      </div>

      {brotoChatOpen ? <BrotoChatModal onClose={() => setBrotoChatOpen(false)} /> : null}
    </div>
  )
}
