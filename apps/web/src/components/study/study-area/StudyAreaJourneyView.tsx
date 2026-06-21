import { useRef } from 'react'
import { studyJourneyCompletedCount, STUDY_JOURNEY_STAGES } from '@broto/shared'
import {
  StudyPackageLeaveDialog,
  GrowthTrail,
  HumanTrailProgress,
  StudyBackLink,
  StudyPackageJourneyGrid,
  StudySanctuaryHeader,
} from '@/components/study/StudyPackageJourney'
import { clearStudyPackageSessionDraft } from '@/lib/study-package-session-storage'
import type { StudyPackage } from '@/lib/study-area-mock'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import type { StudyAreaTab } from '@/components/study/study-area/study-area-utils'
import { SummarySection } from '@/components/study/study-area/SummarySection'
import { FlashcardDeck } from '@/components/study/study-area/FlashcardDeck'
import { GuidedBankPracticeQuestions } from '@/components/study/study-area/GuidedBankPracticeQuestions'
import { PracticeQuestions } from '@/components/study/study-area/PracticeQuestions'
import { MindMapView } from '@/components/study/study-area/MindMapView'
import { SessionSummaryView } from '@/components/study/study-area/SessionSummaryView'

export function StudyAreaJourneyView({
  pkg,
  areaLabel,
  areaColor,
  activeTab,
  completed,
  focusMode,
  guidedBankRows,
  questionsResult,
  showSummary,
  leaveDialogOpen,
  simuladoStudyCard,
  onToggleFocus,
  onRequestBack,
  onBack,
  onGoToTab,
  onMarkDone,
  onQuestionsDone,
  onShowSummary,
  onLeaveContinue,
  onLeaveSaveAndExit,
  onLeaveDiscardAndExit,
  scrollToTop,
}: {
  pkg: StudyPackage
  areaLabel: string
  areaColor: string
  activeTab: StudyAreaTab
  completed: Record<StudyAreaTab, boolean>
  focusMode: boolean
  guidedBankRows: QuestionBankRow[] | null
  questionsResult: { correct: number; total: number }
  showSummary: boolean
  leaveDialogOpen: boolean
  simuladoStudyCard: React.ReactNode
  onToggleFocus: () => void
  onRequestBack: () => void
  onBack: () => void
  onGoToTab: (tab: StudyAreaTab) => void
  onMarkDone: (tab: StudyAreaTab) => void
  onQuestionsDone: (correct: number, total: number) => void
  onShowSummary: () => void
  onLeaveContinue: () => void
  onLeaveSaveAndExit: () => void
  onLeaveDiscardAndExit: () => void
  scrollToTop: () => void
}) {
  const stageMainRef = useRef<HTMLDivElement>(null)

  if (showSummary) {
    return (
      <SessionSummaryView
        pkg={pkg}
        questionsCorrect={questionsResult.correct}
        questionsTotal={questionsResult.total}
        flashcardsCount={pkg.flashcards.length}
        areaColor={areaColor}
        onBack={onBack}
        completed={completed}
      />
    )
  }

  return (
    <>
      <div className={`study-package-journey${focusMode ? ' study-package-journey--focus' : ''}`}>
        <StudyBackLink onClick={onRequestBack} />

        <StudySanctuaryHeader
          topicLabel={pkg.topicoLabel}
          areaLabel={areaLabel}
          focusMode={focusMode}
          onToggleFocus={onToggleFocus}
          areaColor={areaColor}
          belowLede={simuladoStudyCard}
        />
        <HumanTrailProgress
          completedCount={studyJourneyCompletedCount(completed)}
          areaColor={areaColor}
        />

        <StudyPackageJourneyGrid
          focusMode={focusMode}
          aside={
            <GrowthTrail
              activeTab={activeTab}
              completed={completed}
              onSelectTab={onGoToTab}
              areaColor={areaColor}
            />
          }
          main={
            <div id="study-stage-main" ref={stageMainRef} className="study-stage-main">
              {activeTab === 'summary' && (
                <SummarySection
                  summary={pkg.summary}
                  areaColor={areaColor}
                  onDone={() => {
                    onMarkDone('summary')
                    onGoToTab('flashcards')
                  }}
                />
              )}

              {activeTab === 'flashcards' && (
                <FlashcardDeck
                  cards={pkg.flashcards}
                  areaColor={areaColor}
                  onDone={() => {
                    onMarkDone('flashcards')
                    onGoToTab('questions')
                  }}
                />
              )}

              {activeTab === 'questions' &&
                (guidedBankRows && guidedBankRows.length > 0 ? (
                  <GuidedBankPracticeQuestions
                    areaKey={pkg.areaKey}
                    rows={guidedBankRows}
                    onDone={(correct, total) => {
                      onMarkDone('questions')
                      onQuestionsDone(correct, total)
                      onGoToTab('mindmap')
                    }}
                  />
                ) : (
                  <PracticeQuestions
                    questions={pkg.practiceQuestions}
                    onDone={(correct, total) => {
                      onMarkDone('questions')
                      onQuestionsDone(correct, total)
                      onGoToTab('mindmap')
                    }}
                  />
                ))}

              {activeTab === 'mindmap' && (
                <MindMapView
                  mindMap={pkg.mindMap}
                  areaColor={areaColor}
                  onDone={() => {
                    onMarkDone('mindmap')
                    clearStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue)
                    onShowSummary()
                    scrollToTop()
                  }}
                />
              )}
            </div>
          }
        />
      </div>

      <StudyPackageLeaveDialog
        open={leaveDialogOpen}
        completedCount={studyJourneyCompletedCount(completed)}
        stageCount={STUDY_JOURNEY_STAGES.length}
        onContinue={onLeaveContinue}
        onSaveAndLeave={onLeaveSaveAndExit}
        onDiscardAndLeave={onLeaveDiscardAndExit}
      />
    </>
  )
}
