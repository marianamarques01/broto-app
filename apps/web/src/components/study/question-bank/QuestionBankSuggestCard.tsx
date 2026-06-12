import type { QuestionBankSuggestedRow } from '@broto/shared'
import { ArrowRight, Clock } from 'lucide-react'
import { formatQuestionBankId, type QuestionBankRow } from '@/hooks/useQuestionBank'
import { getAreaColor } from '@/lib/area-config'
import { formatSuggestionReasonTag } from './format-suggestion-reason'

function difficultyDotsActive(level: 'facil' | 'medio' | 'dificil'): number {
  if (level === 'facil') return 1
  if (level === 'medio') return 2
  return 3
}

export interface QuestionBankSuggestCardProps {
  row: QuestionBankSuggestedRow
  selectedArea: string
  onOpen: (row: QuestionBankRow) => void
  /** Se false, omite pontos de dificuldade e tempo para reduzir ruído. */
  compactMeta?: boolean
}

export function QuestionBankSuggestCard({
  row,
  selectedArea,
  onOpen,
  compactMeta = true,
}: QuestionBankSuggestCardProps) {
  const topicColor = getAreaColor(selectedArea)
  const dots = difficultyDotsActive(row.difficulty)
  const reasonLabel = formatSuggestionReasonTag(row.reason)

  return (
    <li>
      <button
        type="button"
        className="broto-qbank-card broto-qbank-card--suggest"
        onClick={() => onOpen(row)}
      >
        <span className="broto-qbank-suggest-reason">{reasonLabel}</span>
        <div className="broto-qbank-card-top">
          <div className="broto-qbank-card-badges">
            <span className="broto-qbank-badge broto-qbank-badge-year">ENEM {row.year}</span>
            <span
              className="broto-qbank-badge broto-qbank-badge-topic"
              style={{
                color: topicColor,
                borderColor: `${topicColor}22`,
                background: `${topicColor}0e`,
              }}
            >
              {row.topicoLabel}
            </span>
            {row.isNova ? (
              <span className="broto-qbank-badge broto-qbank-badge-new">Nova</span>
            ) : null}
            {row.language ? (
              <span className="broto-qbank-badge broto-qbank-badge-year">{row.language}</span>
            ) : null}
          </div>
          <span className="broto-qbank-card-id">
            {formatQuestionBankId(selectedArea, row.year, row.index)}
          </span>
        </div>
        <p className="broto-qbank-card-title">
          Questão {row.index} — ENEM {row.year}
        </p>
        <p className="broto-qbank-card-preview">{row.preview}</p>
        <div className="broto-qbank-card-bottom">
          {compactMeta ? (
            <span className="broto-qbank-meta-item broto-qbank-meta-item--muted">
              Toque para resolver
            </span>
          ) : (
            <div className="broto-qbank-card-meta">
              <span className="broto-qbank-meta-item">
                <Clock size={12} aria-hidden />
                ~2 min
              </span>
              <span className="broto-qbank-meta-item">
                Dificuldade
                <span className="broto-qbank-diff-dots" aria-hidden>
                  <span
                    className={`broto-qbank-diff-dot${dots >= 1 ? ' broto-qbank-diff-dot--on' : ''}`}
                  />
                  <span
                    className={`broto-qbank-diff-dot${dots >= 2 ? ' broto-qbank-diff-dot--on' : ''}`}
                  />
                  <span
                    className={`broto-qbank-diff-dot${dots >= 3 ? ' broto-qbank-diff-dot--on' : ''}`}
                  />
                </span>
              </span>
            </div>
          )}
          <span className="broto-qbank-card-action">
            Resolver
            <ArrowRight size={14} aria-hidden />
          </span>
        </div>
      </button>
    </li>
  )
}
