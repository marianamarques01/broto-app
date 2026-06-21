import { Navigate } from 'react-router-dom'
import { useMemo, useRef } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { QuestionBankView } from '@/components/study/QuestionBankView'
import { StudyPackageSimuladoSessionCard } from '@/components/study/StudyPackageSimuladoSessionCard'
import { useProgress } from '@/hooks/useProgress'
import { useStudyAreaSession } from '@/hooks/useStudyAreaSession'
import { StudyLandingPick } from '@/components/study/study-area/StudyLandingPick'
import { PackageLoading } from '@/components/study/study-area/PackageLoading'
import { StudyAreaJourneyView } from '@/components/study/study-area/StudyAreaJourneyView'
import { StudySimuladoModal } from '@/components/study/study-area/StudySimuladoModal'

export function StudyArea() {
  const { progress } = useProgress()
  const mainRef = useRef<HTMLDivElement>(null)
  const {
    step,
    pkg,
    selectedArea,
    invalidAreaKey,
    hubTopics,
    loadingTopicLabel,
    activeTab,
    completed,
    focusMode,
    guidedBankRows,
    questionsResult,
    showSummary,
    simuladoModalOpen,
    leaveDialogOpen,
    areaColor,
    areaLabel,
    openSimuladoModal,
    studyBreadcrumb,
    searchParams,
    handleStart,
    markDone,
    goToTab,
    handleBack,
    requestStudyHubBack,
    handleLeaveDialogContinue,
    handleLeaveSaveAndExit,
    handleLeaveDiscardAndExit,
    setFocusMode,
    setQuestionsResult,
    setShowSummary,
    setSimuladoModalOpen,
    scrollToTop,
    navigate,
  } = useStudyAreaSession(progress ?? undefined, mainRef)

  const simuladoStudyCard = useMemo(() => {
    if (!pkg) return undefined
    return (
      <StudyPackageSimuladoSessionCard
        areaKey={pkg.areaKey}
        topicoValue={pkg.topicoValue}
        topicoLabel={pkg.topicoLabel}
        areaColor={areaColor}
        onOpenModal={openSimuladoModal}
      />
    )
  }, [pkg, areaColor, openSimuladoModal])

  if (invalidAreaKey) {
    return <Navigate to="/study" replace />
  }

  return (
    <>
      <TopBar variant="study" title="Área de Estudo" studyBreadcrumb={studyBreadcrumb} />
      <div className="broto-main-inner broto-main-inner--study" ref={mainRef}>
        {step === 'select' && !selectedArea ? (
          <StudyLandingPick progress={progress ?? undefined} />
        ) : null}

        {step === 'select' && selectedArea ? (
          searchParams.get('hub') === 'guided' ? (
            <Navigate to={`/study/${selectedArea}`} replace />
          ) : (
            <QuestionBankView
              embedded
              preferredArea={selectedArea}
              guidedTopics={hubTopics}
              onSelectGuidedTopic={(t) => void handleStart(selectedArea, t)}
              onBackToHub={() => navigate('/study')}
              onOpenStudyPackageForRow={(row, practiceRows) => {
                if (!selectedArea) return
                const topico = hubTopics.find((t) => t.value === row.topicoValue) ?? {
                  value: row.topicoValue ?? '',
                  label: row.topicoLabel?.trim() ? row.topicoLabel : (row.topicoValue ?? 'Tópico'),
                  accuracy: null,
                  totalAnswered: 0,
                }
                if (!topico.value) return
                void handleStart(selectedArea, topico, practiceRows)
              }}
            />
          )
        ) : null}

        {step === 'loading' && pkg === null ? (
          <PackageLoading areaKey={selectedArea ?? ''} topicoLabel={loadingTopicLabel} />
        ) : null}

        {step === 'study' && pkg ? (
          <StudyAreaJourneyView
            pkg={pkg}
            areaLabel={areaLabel}
            areaColor={areaColor}
            activeTab={activeTab}
            completed={completed}
            focusMode={focusMode}
            guidedBankRows={guidedBankRows}
            questionsResult={questionsResult}
            showSummary={showSummary}
            leaveDialogOpen={leaveDialogOpen}
            simuladoStudyCard={simuladoStudyCard}
            onToggleFocus={() => setFocusMode((v) => !v)}
            onRequestBack={requestStudyHubBack}
            onBack={handleBack}
            onGoToTab={goToTab}
            onMarkDone={markDone}
            onQuestionsDone={(correct, total) => setQuestionsResult({ correct, total })}
            onShowSummary={() => setShowSummary(true)}
            onLeaveContinue={handleLeaveDialogContinue}
            onLeaveSaveAndExit={handleLeaveSaveAndExit}
            onLeaveDiscardAndExit={handleLeaveDiscardAndExit}
            scrollToTop={scrollToTop}
          />
        ) : null}
      </div>

      {simuladoModalOpen && pkg ? (
        <StudySimuladoModal pkg={pkg} onClose={() => setSimuladoModalOpen(false)} />
      ) : null}
    </>
  )
}
