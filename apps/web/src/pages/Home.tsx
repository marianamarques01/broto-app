import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_LABEL } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { PetCard } from '@/components/pet/PetCard'
import { HomeDashboardTopBar } from '@/components/layout/HomeDashboardTopBar'
import { PerformanceChartCard } from '@/components/progress/PerformanceChartCard'
import { BookOpen } from 'lucide-react'
import { DashboardStudyStats } from '@/components/progress/DashboardStudyStats'
import { AREA_CONFIG } from '@/lib/area-config'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import { HomeRightSidebar } from '@/components/home/HomeRightSidebar'
import { HomePetBanner } from '@/components/home/HomePetBanner'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
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
  const diaHoje = useMemo(() => rotina.find((d) => d.ehHoje), [rotina])

  const fase = pet?.fase ?? 'semente'
  const plantLine = plantStatusLine(fase)
  const streak = pet?.streak ?? 0
  return (
    <div className="broto-home-dashboard">
      <HomeDashboardTopBar
        greeting={`Olá, ${firstName}`}
        plantLine={loadingPet ? 'Carregando…' : plantLine}
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
                      {areas
                        .filter((area) => area.value !== 'sem_area')
                        .map((area, i) => {
                        const config = AREA_CONFIG[area.value] ?? { color: '#888', icon: BookOpen }
                        const Icon = config.icon
                        const av = AREA_ACCENT_VARS[area.value] ?? AREA_ACCENT_VARS.linguagens
                        const nTopicos = area.topicos.length
                        const metaLinha =
                          area.totalAnswered > 0
                            ? `${nTopicos} tópicos · ${area.accuracyPct}% média`
                            : `${nTopicos} tópicos · sem média`
                        const areaDelays = [100, 180, 260, 340]
                        return (
                          <Link
                            key={area.value}
                            to={`/study/${area.value}`}
                            className="study-area-card broto-subject-area-card"
                            style={
                              {
                                '--study-area-accent': config.color,
                                '--ac-dim': av.dim,
                                '--ac-glow': av.glow,
                                animation: 'study-scale-in 0.4s ease-out both',
                                animationDelay: `${areaDelays[i] ?? 340}ms`,
                              } as CSSProperties
                            }
                          >
                            <StudyAreaCardPattern areaKey={area.value} />
                            <div className="study-area-card__glow" aria-hidden />
                            <span className="study-area-card__dot" aria-hidden />
                            <div className="study-area-card__icon">
                              <Icon size={20} color="currentColor" strokeWidth={1.8} />
                            </div>
                            <p className="study-area-card__label">{area.label}</p>
                            <p className="study-area-card__meta">{metaLinha}</p>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>

              <DashboardStudyStats />

              {/* Card legado do Broto: mantido no DOM, oculto via CSS (substituído pelo banner) */}
              <div className="broto-pet-card-legacy" aria-hidden>
                <PetCard />
              </div>

              {/* Desempenho — largura total após mover Acesso rápido para a hero */}
              <div className="broto-dashboard-col broto-dashboard-col--center">
                <PerformanceChartCard loadingProgress={loadingProgress} />
              </div>
             </div>
          </div>
        </div>

        <HomeRightSidebar diaHoje={diaHoje} horasPorDia={horasPorDia} />
      </div>
    </div>
  )
}
