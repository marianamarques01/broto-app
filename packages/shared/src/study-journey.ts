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
