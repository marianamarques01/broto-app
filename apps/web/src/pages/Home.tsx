import { useMemo, useSyncExternalStore, useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { usePet, FASE_LABEL } from '@/hooks/usePet'
import { usePerformanceSeries } from '@/hooks/usePerformanceSeries'
import { useUser } from '@/hooks/useUser'
import { PetCard } from '@/components/pet/PetCard'
import { HomeDashboardTopBar } from '@/components/layout/HomeDashboardTopBar'
import { ProgressKpiStrip } from '@/components/progress/ProgressKpiStrip'
import { AreaPerformanceTable } from '@/components/progress/AreaPerformanceTable'
import { gerarRotina } from '@/lib/routine'
import { DEFAULT_AREAS } from '@/lib/default-areas'
import {
  getPerformanceDayMapSnapshot,
  getPerformanceDayMapServerSnapshot,
  subscribePerformanceHistory,
} from '@/lib/performance-history'
import { HomeRightSidebar } from '@/components/home/HomeRightSidebar'
import { HomePetBanner } from '@/components/home/HomePetBanner'
import { HomePracticeYearHeatmap } from '@/components/home/HomePracticeYearHeatmap'
import { buildFlashcardReviewCopy } from '@broto/shared'
import { ClipboardCheck } from 'lucide-react'
import {
  HomeBetaSurveyModal,
  readBetaSurveyCompleted,
  resolveBetaFeedbackFormUrl,
  writeBetaSurveyCompleted,
} from '@/components/home/HomeBetaSurveyModal'
import { HomeIntegratedTourModal } from '@/components/home/HomeIntegratedTourModal'
import {
  consumeIntegratedTourSessionTriggers,
  isIntegratedTourFeatureEnabled,
  resolveIntegratedTourOpenOnHomeMount,
} from '@/lib/integrated-tour'

const BETA_SURVEY_FORM_URL = resolveBetaFeedbackFormUrl()

type HomeOverlayState = {
  integratedTourOpen: boolean
  integratedTourInitialStep: number
  betaSurveyModalOpen: boolean
}

function createHomeOverlayState(): HomeOverlayState {
  if (!isIntegratedTourFeatureEnabled()) {
    return {
      integratedTourOpen: false,
      integratedTourInitialStep: 0,
      betaSurveyModalOpen: !readBetaSurveyCompleted(),
    }
  }
  const resolved = resolveIntegratedTourOpenOnHomeMount()
  if (resolved.open) {
    return {
      integratedTourOpen: true,
      integratedTourInitialStep: resolved.step,
      betaSurveyModalOpen: false,
    }
  }
  return {
    integratedTourOpen: false,
    integratedTourInitialStep: 0,
    betaSurveyModalOpen: !readBetaSurveyCompleted(),
  }
}

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
  const [searchParams, setSearchParams] = useSearchParams()
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

  const performanceDayMap = useSyncExternalStore(
    subscribePerformanceHistory,
    getPerformanceDayMapSnapshot,
    getPerformanceDayMapServerSnapshot,
  )

  const { buckets: historyBuckets } = usePerformanceSeries('month')

  const hasData = !loadingProgress && progress !== null && progress.totalAnswered > 0
  const areasForProgress = progress?.areas ?? DEFAULT_AREAS
  const accuracyPct = progress?.accuracyPct ?? 0
  const totalAnswered = progress?.totalAnswered ?? 0

  const estTotalStudyMin = Math.round(totalAnswered * 2.5)
  const estTotalHours = estTotalStudyMin / 60

  const sumPeriodAnswered = useMemo(
    () => historyBuckets.reduce((s, b) => s + b.answered, 0),
    [historyBuckets],
  )

  const reviewCopy = useMemo(() => buildFlashcardReviewCopy(progress?.areas), [progress?.areas])

  const kpiItems = useMemo(
    () => [
      {
        id: 'accuracy',
        label: 'Acerto geral',
        value: hasData ? `${accuracyPct}%` : '—',
        hint: hasData ? 'no banco de questões' : 'pratique para ver',
        tone: 'var(--teal-400)',
      },
      {
        id: 'total',
        label: 'Questões',
        value: totalAnswered.toLocaleString('pt-BR'),
        hint: 'respondidas no total',
        tone: 'var(--text-primary)',
      },
      {
        id: 'period',
        label: 'Neste período',
        value: String(sumPeriodAnswered),
        hint: 'no filtro mês',
        tone: 'var(--status-sky)',
      },
      {
        id: 'study-time',
        label: 'Tempo estimado',
        value:
          !hasData || loadingProgress
            ? '—'
            : estTotalHours >= 1
              ? `${estTotalHours.toFixed(1).replace('.', ',')} h`
              : `${estTotalStudyMin} min`,
        hint: '~2,5 min / questão',
        tone: 'var(--text-secondary)',
      },
    ],
    [
      accuracyPct,
      estTotalHours,
      estTotalStudyMin,
      hasData,
      loadingProgress,
      sumPeriodAnswered,
      totalAnswered,
    ],
  )

  const ctaParam = searchParams.get('cta')

  useEffect(() => {
    if (ctaParam !== 'primeiro-simulado') return
    requestAnimationFrame(() => {
      document.getElementById('home-hub-primeiro-simulado')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('cta')
        return next
      },
      { replace: true },
    )
  }, [ctaParam, setSearchParams])

  const showFirstMockCta = !loadingProgress && !hasData

  const showHubFocus = !showFirstMockCta && hasData && Boolean(reviewCopy.areaSlug)

  const petBannerNextSteps = useMemo(() => {
    if (!showHubFocus || !reviewCopy.areaSlug) return null
    const today = diaHoje
    return {
      revisaoLinha: reviewCopy.title,
      areaSlug: reviewCopy.areaSlug,
      topicAnswerCount: reviewCopy.topicAnswerCount,
      contextualHint:
        reviewCopy.topicAnswerCount === undefined ? reviewCopy.subtitle : undefined,
      todayRoutineAreaLabel: today?.ehDescanso ? null : today?.area?.label ?? null,
      todayRoutineAreaSlug: today?.ehDescanso ? null : today?.area?.value ?? null,
      todayRoutineMinutes: today?.ehDescanso ? undefined : today?.duracaoMin,
      todayIsRoutineRest: Boolean(today?.ehDescanso),
    }
  }, [
    showHubFocus,
    reviewCopy.areaSlug,
    reviewCopy.title,
    reviewCopy.subtitle,
    reviewCopy.topicAnswerCount,
    diaHoje,
  ])

  const [overlays, setOverlays] = useState<HomeOverlayState>(() => createHomeOverlayState())

  const handleIntegratedTourClose = useCallback(() => {
    consumeIntegratedTourSessionTriggers()
    setOverlays((o) => ({
      ...o,
      integratedTourOpen: false,
      betaSurveyModalOpen: !readBetaSurveyCompleted(),
    }))
  }, [])

  const handleBetaSurveyDismiss = useCallback(() => {
    setOverlays((o) => ({ ...o, betaSurveyModalOpen: false }))
  }, [])

  const handleBetaSurveyMarked = useCallback(() => {
    writeBetaSurveyCompleted()
    setOverlays((o) => ({ ...o, betaSurveyModalOpen: false }))
  }, [])

  return (
    <div className="broto-home-dashboard">
      <HomeDashboardTopBar
        greeting={`Olá, ${firstName}! 🌱`}
        plantLine={loadingPet ? 'Carregando…' : plantLine}
        streak={streak}
        mockExamAnchorId={hasData ? 'home-hub-primeiro-simulado' : undefined}
      />

      <div className="broto-home-dashboard__body">
        <div className="broto-home-dashboard__main">
          <div className="broto-main-inner broto-main-inner--dashboard">
            <div className="broto-dashboard-grid broto-dashboard-grid--pet-banner broto-fade-in">
              <div className="broto-dashboard-hero broto-dashboard-hero--solo">
                <HomePetBanner nextSteps={petBannerNextSteps} />
              </div>

              {showFirstMockCta ? (
                <section
                  id="home-hub-primeiro-simulado"
                  className="broto-home-first-mock-cta"
                  aria-labelledby="home-first-mock-title"
                >
                  <span className="broto-home-first-mock-cta__accent" aria-hidden />
                  <div className="broto-home-first-mock-cta__inner">
                    <span className="broto-home-first-mock-cta__icon" aria-hidden>
                      <ClipboardCheck size={16} strokeWidth={2} />
                    </span>
                    <div className="broto-home-first-mock-cta__body">
                      <p className="broto-home-first-mock-cta__eyebrow">Primeiro passo</p>
                      <h2 id="home-first-mock-title" className="broto-home-first-mock-cta__title">
                        Faça sua primeira sessão
                      </h2>
                      <p className="broto-home-first-mock-cta__text">
                        É uma experiência no <strong>estilo simulado</strong> — bloco com quantidade à sua escolha
                        e tempo opcional. Em poucos minutos você experimenta o formato do ENEM e ganha um ponto
                        de partida; recomendamos logo após o cadastro.
                      </p>
                      <Link to="/study/mock-exam" className="broto-home-first-mock-cta__btn">
                        Começar sessão ENEM
                      </Link>
                    </div>
                  </div>
                </section>
              ) : null}

              {showHubFocus ? (
                <section
                  className={[
                    'broto-home-hub-focus',
                    'broto-home-hub-focus--kpi-wrap',
                    'broto-home-hub-focus--weak',
                    petBannerNextSteps ? 'broto-home-hub-focus--paired-with-banner' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label="Área para reforço"
                >
                  <Link
                    className="broto-progress-kpi-tile broto-home-hub-focus-kpi-tile"
                    to={`/study/${reviewCopy.areaSlug}`}
                  >
                    <span className="broto-progress-kpi-tile__label">Onde reforçar agora</span>
                    <span
                      className="broto-progress-kpi-tile__value broto-home-hub-focus-kpi-tile__headline"
                      style={{ color: 'var(--teal-400)' }}
                    >
                      {reviewCopy.title}
                    </span>
                    <span className="broto-progress-kpi-tile__hint">
                      {reviewCopy.topicAnswerCount !== undefined
                        ? 'Na página da área você encontra questões e flashcards para consolidar.'
                        : reviewCopy.subtitle}
                    </span>
                  </Link>
                </section>
              ) : null}

              <div id="home-desempenho" className="broto-home-dash-progress">
                <ProgressKpiStrip items={kpiItems} loading={loadingProgress} />
                <AreaPerformanceTable areas={areasForProgress} loading={loadingProgress} />
              </div>

              <details className="broto-home-details-analytics">
                <summary>Ver calendário e detalhes de prática</summary>
                <HomePracticeYearHeatmap
                  performanceDayMap={performanceDayMap}
                  questoesHoje={pet?.questoesHoje ?? 0}
                />
              </details>

              {/* Card legado do Broto: mantido no DOM, oculto via CSS (substituído pelo banner) */}
              <div className="broto-pet-card-legacy" aria-hidden>
                <PetCard />
              </div>
            </div>
          </div>
        </div>

        <HomeRightSidebar diaHoje={diaHoje} horasPorDia={horasPorDia} />
      </div>

      <HomeIntegratedTourModal
        open={overlays.integratedTourOpen}
        initialStep={overlays.integratedTourInitialStep}
        onRequestClose={handleIntegratedTourClose}
      />

      <HomeBetaSurveyModal
        open={overlays.betaSurveyModalOpen && !overlays.integratedTourOpen}
        formUrl={BETA_SURVEY_FORM_URL}
        onDismiss={handleBetaSurveyDismiss}
        onMarkAnswered={handleBetaSurveyMarked}
      />
    </div>
  )
}
