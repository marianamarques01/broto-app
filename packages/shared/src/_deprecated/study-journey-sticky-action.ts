/** @deprecated Sem consumidores — CTA sticky da trilha não wired na UI. */
import {
  STUDY_JOURNEY_STAGES,
  studyJourneyNextIncompleteTab,
  type StudyJourneyTab,
} from '../study-journey'

export interface StudyJourneyEstimateInput {
  flashcardsLen: number
  practiceQuestionsLen: number
  bankRowCount?: number | null
}

function studyJourneyStageMeta(tab: StudyJourneyTab): (typeof STUDY_JOURNEY_STAGES)[number] {
  return STUDY_JOURNEY_STAGES.find((s) => s.tab === tab) ?? STUDY_JOURNEY_STAGES[0]
}

function estimateMinutesForTab(
  tab: StudyJourneyTab,
  input: StudyJourneyEstimateInput,
): { min: number; max: number } {
  switch (tab) {
    case 'summary':
      return { min: 8, max: 14 }
    case 'flashcards': {
      const n = input.flashcardsLen
      const base = Math.max(4, Math.ceil(n * 0.75))
      return { min: base, max: base + 4 }
    }
    case 'questions': {
      const n =
        input.bankRowCount != null && input.bankRowCount > 0
          ? input.bankRowCount
          : input.practiceQuestionsLen
      const base = Math.max(5, Math.ceil(n * 2))
      return { min: base, max: base + Math.max(3, Math.ceil(n * 0.5)) }
    }
    case 'mindmap':
      return { min: 5, max: 10 }
  }
}

function formatEstimateRange(r: { min: number; max: number }): string {
  if (r.min === r.max) return `~${r.min} min`
  return `~${r.min}–${r.max} min`
}

export function computeStickyAction(
  activeTab: StudyJourneyTab,
  completed: Record<StudyJourneyTab, boolean>,
  estimateInput: StudyJourneyEstimateInput,
): { title: string; sub?: string; buttonText: string; advanceTab: StudyJourneyTab | null } {
  const next = studyJourneyNextIncompleteTab(completed)
  const estStr = formatEstimateRange(estimateMinutesForTab(activeTab, estimateInput))

  if (next === null) {
    return {
      title: 'Trilha percorrida',
      sub: 'Confira o mapa ou volte quando quiser — seu ritmo é válido.',
      buttonText: 'Ir para o mapa',
      advanceTab: 'mindmap',
    }
  }

  if (activeTab !== next) {
    const meta = studyJourneyStageMeta(next)
    return {
      title: 'Próximo passo sugerido',
      sub: `${meta.title} — ${meta.oneLiner}`,
      buttonText: `Abrir ${meta.title}`,
      advanceTab: next,
    }
  }

  const here = studyJourneyStageMeta(activeTab)
  return {
    title: 'Um passo de cada vez',
    sub: `${here.title} · ${estStr}`,
    buttonText: 'Ir ao conteúdo',
    advanceTab: null,
  }
}
