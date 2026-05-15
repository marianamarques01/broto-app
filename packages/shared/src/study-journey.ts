/**
 * Metadados da trilha do pacote de estudo — etapas nomeadas,
 * tempos estimados e copy. Consumido por web e mobile.
 */

export type StudyJourneyTab = 'summary' | 'flashcards' | 'questions' | 'mindmap'

export const STUDY_JOURNEY_TABS: StudyJourneyTab[] = [
  'summary',
  'flashcards',
  'questions',
  'mindmap',
]

export interface StudyJourneyStageMeta {
  tab: StudyJourneyTab
  /** Nome pedagógico curto */
  title: string
  oneLiner: string
}

export const STUDY_JOURNEY_STAGES: StudyJourneyStageMeta[] = [
  {
    tab: 'summary',
    title: 'Entender',
    oneLiner: 'Leitura e ideias centrais',
  },
  {
    tab: 'flashcards',
    title: 'Fixar',
    oneLiner: 'Cartões ativos para memorizar',
  },
  {
    tab: 'questions',
    title: 'Aplicar',
    oneLiner: 'Questões no ritmo da prova',
  },
  {
    tab: 'mindmap',
    title: 'Revisar',
    oneLiner: 'Mapa para fechar o ciclo',
  },
]

export function studyJourneyStageMeta(tab: StudyJourneyTab): StudyJourneyStageMeta {
  return STUDY_JOURNEY_STAGES.find((s) => s.tab === tab) ?? STUDY_JOURNEY_STAGES[0]
}

export function studyJourneyCompletedCount(completed: Record<StudyJourneyTab, boolean>): number {
  return STUDY_JOURNEY_TABS.filter((t) => completed[t]).length
}

export function studyJourneyNextIncompleteTab(
  completed: Record<StudyJourneyTab, boolean>,
): StudyJourneyTab | null {
  for (const t of STUDY_JOURNEY_TABS) {
    if (!completed[t]) return t
  }
  return null
}

export interface StudyJourneyEstimateInput {
  flashcardsLen: number
  practiceQuestionsLen: number
  /** Quando o fluxo usa banco ENEM em vez de questões estáticas */
  bankRowCount?: number | null
}

/** Minutos aproximados só para a etapa atual (faixas humanas). */
export function estimateMinutesForTab(
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

export function formatEstimateRange(r: { min: number; max: number }): string {
  if (r.min === r.max) return `~${r.min} min`
  return `~${r.min}–${r.max} min`
}

/** Mensagem curta pós-marco (celebração discreta). */
export function brotoCelebrateLine(tab: StudyJourneyTab): string {
  const map: Record<StudyJourneyTab, string> = {
    summary: 'Conceitos bem encaixados.',
    flashcards: 'Boa memorização ativa.',
    questions: 'Você aplicou o conteúdo de verdade.',
    mindmap: 'Esse tópico agora faz mais sentido para você.',
  }
  return map[tab]
}

/**
 * Textos do CTA fixo inferior (web/mobile): troca de etapa ou âncora no conteúdo atual.
 */
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
