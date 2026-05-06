import { useMemo } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_LABEL } from '@/hooks/usePet'
import { useUser } from '@/hooks/useUser'
import { PetCard } from '@/components/pet/PetCard'
import { HomeDashboardTopBar } from '@/components/layout/HomeDashboardTopBar'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import { HomeRightSidebar } from '@/components/home/HomeRightSidebar'
import { HomePetBanner } from '@/components/home/HomePetBanner'
import { HomeWeeklyProgressCard } from '@/components/home/HomeWeeklyProgressCard'
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
        greeting={`Olá, ${firstName}! 🌱`}
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
                  <HomeWeeklyProgressCard />
                </div>
              </div>

              {/* Card legado do Broto: mantido no DOM, oculto via CSS (substituído pelo banner) */}
              <div className="broto-pet-card-legacy" aria-hidden>
                <PetCard />
              </div>
            </div>
          </div>
        </div>

        <HomeRightSidebar diaHoje={diaHoje} horasPorDia={horasPorDia} />
      </div>
    </div>
  )
}
