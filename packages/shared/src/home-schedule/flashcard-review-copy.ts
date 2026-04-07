import type { AreaStat } from '../types/dashboard-progress'

/** Texto da linha de revisão na timeline (até existir tabela de flashcards no backend). */
export function buildFlashcardReviewCopy(areas: AreaStat[] | undefined): {
  title: string
  subtitle: string
  areaSlug?: string
} {
  if (!areas?.length) {
    return {
      title: 'Revisão: flashcards',
      subtitle: 'Pratique questões para liberar revisões por tópico.',
    }
  }
  const ordered = [...areas].sort((a, b) => {
    if (a.totalAnswered === 0 && b.totalAnswered === 0) return 0
    if (a.totalAnswered === 0) return 1
    if (b.totalAnswered === 0) return -1
    return a.accuracyPct - b.accuracyPct
  })
  const area = ordered[0]
  const weakTopico = [...area.topicos]
    .filter((t) => t.totalAnswered > 0)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
  const topic = weakTopico?.label ?? 'tópicos prioritários'
  return {
    title: `Revisão: ${area.label} — ${topic}`,
    subtitle: weakTopico
      ? `${weakTopico.totalAnswered} respostas no tópico · consolide com flashcards`
      : 'Reforço sugerido pelo seu desempenho',
    areaSlug: area.value,
  }
}
