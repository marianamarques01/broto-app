import { pickWeakestDisplayArea } from '../enem-area-display'
import type { AreaStat } from '../types/dashboard-progress'

/** Texto da linha de revisão na timeline (até existir tabela de flashcards no backend). */
export function buildFlashcardReviewCopy(areas: AreaStat[] | undefined): {
  title: string
  subtitle: string
  areaSlug?: string
  /** Respostas registradas no tópico mais fraco (para UI compacta, ex. pill no banner). */
  topicAnswerCount?: number
} {
  if (!areas?.length) {
    return {
      title: 'Revisão: flashcards',
      subtitle: 'Pratique questões para liberar revisões por tópico.',
    }
  }
  const area = pickWeakestDisplayArea(areas)
  if (!area) {
    return {
      title: 'Revisão: flashcards',
      subtitle: 'Pratique questões para liberar revisões por tópico.',
    }
  }
  const weakTopico = [...area.topicos]
    .filter((t) => t.totalAnswered > 0)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
  const topic = weakTopico?.label ?? 'tópicos prioritários'
  const topicAnswerCount =
    weakTopico && weakTopico.totalAnswered > 0 ? weakTopico.totalAnswered : undefined
  return {
    title: `Revisão: ${area.label} — ${topic}`,
    subtitle: weakTopico
      ? `${weakTopico.totalAnswered} respostas no tópico · consolide com flashcards`
      : 'Reforço sugerido pelo seu desempenho',
    areaSlug: area.value,
    topicAnswerCount,
  }
}
