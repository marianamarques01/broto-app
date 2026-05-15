import type { QuestionAnswerOutcome } from '@/hooks/useQuestionBankAnswerStatus'
import { CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react'

export type QuestionBankAnswerBadgeProps = {
  outcome: QuestionAnswerOutcome | undefined
  loading: boolean
}

export function QuestionBankAnswerStatusBadge({ outcome, loading }: QuestionBankAnswerBadgeProps) {
  if (loading) {
    return (
      <span className="broto-qbank-outcome broto-qbank-outcome--loading" title="A carregar estado">
        <Loader2 size={12} className="broto-qbank-outcome-icon" aria-hidden />
        …
      </span>
    )
  }

  if (outcome === 'correct') {
    return (
      <span className="broto-qbank-outcome broto-qbank-outcome--ok">
        <CheckCircle2 size={12} className="broto-qbank-outcome-icon" aria-hidden />
        Acerto
      </span>
    )
  }

  if (outcome === 'wrong') {
    return (
      <span className="broto-qbank-outcome broto-qbank-outcome--bad">
        <XCircle size={12} className="broto-qbank-outcome-icon" aria-hidden />
        Erro
      </span>
    )
  }

  return (
    <span className="broto-qbank-outcome broto-qbank-outcome--pending">
      <CircleDashed size={12} className="broto-qbank-outcome-icon" aria-hidden />
      Pendente
    </span>
  )
}
