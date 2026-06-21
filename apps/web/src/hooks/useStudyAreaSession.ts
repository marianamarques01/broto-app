import { useState, useCallback, useEffect, useMemo, type RefObject } from 'react'
import { studyJourneyNextIncompleteTab } from '@broto/shared'
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { BlockerFunction } from 'react-router-dom'
import { AREA_CONFIG, getAreaColor } from '@/lib/area-config'
import {
  getMockStudyPackage,
  resolveStudyTopicValue,
  type StudyPackage,
  type TopicOption,
} from '@/lib/study-area-mock'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import type { StudyBreadcrumbParts } from '@/components/layout/TopBar'
import {
  clearStudyPackageSessionDraft,
  loadStudyPackageSessionDraft,
  saveStudyPackageSessionDraft,
} from '@/lib/study-package-session-storage'
import type { ProgressData } from '@/hooks/useProgress'
import {
  STUDY_AREA_CARD_KEYS,
  topicsForAreaKey,
  type StudyAreaStep,
  type StudyAreaTab,
} from '@/components/study/study-area/study-area-utils'

const BLANK_COMPLETED: Record<StudyAreaTab, boolean> = {
  summary: false,
  flashcards: false,
  questions: false,
  mindmap: false,
}

export function useStudyAreaSession(
  progress: ProgressData | undefined,
  mainRef: RefObject<HTMLDivElement | null>,
) {
  const { areaKey: areaKeyParam } = useParams<{ areaKey: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loadingTopicLabel, setLoadingTopicLabel] = useState('…')
  const [step, setStep] = useState<StudyAreaStep>('select')
  const [activeTab, setActiveTab] = useState<StudyAreaTab>('summary')
  const [pkg, setPkg] = useState<StudyPackage | null>(null)
  const [guidedBankRows, setGuidedBankRows] = useState<QuestionBankRow[] | null>(null)
  const [completed, setCompleted] = useState<Record<StudyAreaTab, boolean>>({ ...BLANK_COMPLETED })
  const [questionsResult, setQuestionsResult] = useState({ correct: 0, total: 0 })
  const [showSummary, setShowSummary] = useState(false)
  const [simuladoModalOpen, setSimuladoModalOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [leaveDialogRequested, setLeaveDialogRequested] = useState(false)

  useEffect(() => {
    if (!simuladoModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSimuladoModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [simuladoModalOpen])

  useEffect(() => {
    const bank = searchParams.get('bank')
    const areaParam = searchParams.get('area')
    if (bank !== '1') return
    const keys = STUDY_AREA_CARD_KEYS
    const area = areaParam && keys.includes(areaParam) ? areaParam : (keys[0] ?? null)
    const tid = window.setTimeout(() => {
      if (area) {
        navigate(`/study/${area}`, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }, 0)
    return () => window.clearTimeout(tid)
  }, [searchParams, setSearchParams, navigate])

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [mainRef])

  const invalidAreaKey =
    areaKeyParam != null && areaKeyParam !== '' && !STUDY_AREA_CARD_KEYS.includes(areaKeyParam)

  const selectedArea =
    areaKeyParam && STUDY_AREA_CARD_KEYS.includes(areaKeyParam) ? areaKeyParam : null

  const hubTopics = selectedArea ? topicsForAreaKey(selectedArea, progress?.areas) : []

  const areaColor = pkg ? getAreaColor(pkg.areaKey) : 'var(--green-500)'
  const areaLabel = pkg ? (AREA_CONFIG[pkg.areaKey]?.label ?? '') : ''

  const openSimuladoModal = useCallback(() => setSimuladoModalOpen(true), [])

  async function handleStart(
    areaKey: string,
    topico: TopicOption,
    bankPracticeRows?: QuestionBankRow[] | null,
  ) {
    setSimuladoModalOpen(false)
    setLoadingTopicLabel(topico.label)
    setStep('loading')
    setActiveTab('summary')
    setCompleted({ ...BLANK_COMPLETED })
    setShowSummary(false)
    setFocusMode(false)
    setLeaveDialogRequested(false)
    setGuidedBankRows(bankPracticeRows && bankPracticeRows.length > 0 ? bankPracticeRows : null)

    const topicKey = resolveStudyTopicValue(topico.value)
    const data = await getMockStudyPackage(areaKey, topicKey)
    const draft =
      loadStudyPackageSessionDraft(areaKey, topicKey) ??
      loadStudyPackageSessionDraft(areaKey, topico.value)
    let nextCompleted = { ...BLANK_COMPLETED }
    let nextTab: StudyAreaTab = 'summary'
    if (draft) {
      nextCompleted = { ...BLANK_COMPLETED, ...draft.completed }
      nextTab = studyJourneyNextIncompleteTab(nextCompleted) ?? draft.activeTab
    }
    setCompleted(nextCompleted)
    setActiveTab(nextTab)
    setPkg({
      ...data,
      performance: {
        accuracy: topico.accuracy ?? 0,
        totalAnswered: topico.totalAnswered,
      },
    })
    setStep('study')
  }

  function markDone(tab: StudyAreaTab) {
    setCompleted((prev) => ({ ...prev, [tab]: true }))
  }

  const goToTab = useCallback(
    (tab: StudyAreaTab) => {
      setActiveTab(tab)
      scrollToTop()
    },
    [scrollToTop],
  )

  const handleBack = useCallback(() => {
    const key = pkg?.areaKey
    setSimuladoModalOpen(false)
    setStep('select')
    setPkg(null)
    setGuidedBankRows(null)
    setShowSummary(false)
    setFocusMode(false)
    setLeaveDialogRequested(false)
    if (key) navigate(`/study/${key}`)
  }, [pkg?.areaKey, navigate])

  const needsExitGuard = useMemo(
    () =>
      step === 'study' &&
      pkg != null &&
      !showSummary &&
      studyJourneyNextIncompleteTab(completed) !== null,
    [step, pkg, showSummary, completed],
  )

  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (!needsExitGuard) return false
      if (
        currentLocation.pathname === nextLocation.pathname &&
        currentLocation.search === nextLocation.search &&
        currentLocation.hash === nextLocation.hash
      ) {
        return false
      }
      return true
    },
    [needsExitGuard],
  )

  const blocker = useBlocker(shouldBlockNavigation)
  const leaveDialogOpen = leaveDialogRequested || blocker.state === 'blocked'

  useEffect(() => {
    if (step !== 'study' || !pkg) return
    saveStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue, { completed, activeTab })
  }, [step, pkg, completed, activeTab])

  useEffect(() => {
    if (!needsExitGuard) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [needsExitGuard])

  const requestStudyHubBack = useCallback(() => {
    if (needsExitGuard) {
      setLeaveDialogRequested(true)
    } else {
      handleBack()
    }
  }, [needsExitGuard, handleBack])

  const handleLeaveDialogContinue = useCallback(() => {
    setLeaveDialogRequested(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const handleLeaveSaveAndExit = useCallback(() => {
    if (pkg) {
      saveStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue, { completed, activeTab })
    }
    setLeaveDialogRequested(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    } else {
      handleBack()
    }
  }, [pkg, completed, activeTab, blocker, handleBack])

  const handleLeaveDiscardAndExit = useCallback(() => {
    if (pkg) {
      clearStudyPackageSessionDraft(pkg.areaKey, pkg.topicoValue)
    }
    setLeaveDialogRequested(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    } else {
      handleBack()
    }
  }, [pkg, blocker, handleBack])

  let studyBreadcrumb: StudyBreadcrumbParts | undefined
  if (step === 'loading' && selectedArea) {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'preparando…',
    }
  } else if (step === 'select' && selectedArea) {
    studyBreadcrumb = {
      area: AREA_CONFIG[selectedArea]?.label ?? '',
      detail: 'Menu da área',
    }
  } else if (pkg) {
    studyBreadcrumb = { area: areaLabel, detail: pkg.topicoLabel }
  }

  return {
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
  }
}
