import type { QuestionBankSuggestionReason } from '@broto/shared'

function daysBetweenUtc(iso: string): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 999
  const start = new Date(t)
  const today = new Date()
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((b - a) / 86400000))
}

export function formatSuggestionReasonTag(reason: QuestionBankSuggestionReason): string {
  if (reason.kind === 'mistake') {
    const d = daysBetweenUtc(reason.createdAt)
    if (d === 0) return 'Erraste hoje'
    if (d === 1) return 'Erraste ontem'
    return `Erraste há ${d} dias`
  }
  if (reason.kind === 'weak') {
    return `Acerto ~${Math.round(reason.accuracyPct)}% · ${reason.topicoLabel}`
  }
  if (reason.kind === 'new') {
    return `Ainda não praticaste · ${reason.topicoLabel}`
  }
  return `Sugestão Broto · ${reason.topicoLabel}`
}
