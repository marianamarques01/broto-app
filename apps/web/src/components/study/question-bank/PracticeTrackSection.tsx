import type { QuestionBankPracticeTrack } from '@broto/shared'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import { QuestionBankSuggestCard } from './QuestionBankSuggestCard'

const TRACK_EMOJI: Record<string, string> = {
  mistakes: '🔴',
  weak: '🟡',
  newTopics: '🔵',
  freeExplore: '🟢',
}

export interface PracticeTrackSectionProps {
  track: QuestionBankPracticeTrack
  selectedArea: string
  onOpenRow: (row: QuestionBankRow) => void
  onExpandExplore?: () => void
}

export function PracticeTrackSection({
  track,
  selectedArea,
  onOpenRow,
  onExpandExplore,
}: PracticeTrackSectionProps) {
  const emoji = TRACK_EMOJI[track.id] ?? ''

  return (
    <section className="broto-qbank-track" aria-labelledby={`broto-qbank-track-${track.id}`}>
      <div className="broto-qbank-track-head">
        <h3 id={`broto-qbank-track-${track.id}`} className="broto-qbank-track-title">
          <span className="broto-qbank-track-emoji" aria-hidden>
            {emoji}
          </span>
          {track.title}
        </h3>
        <p className="broto-qbank-track-desc">{track.description}</p>
      </div>
      {track.id === 'freeExplore' ? (
        <div className="broto-qbank-track-free">
          {track.emptyHint ? (
            <p className="broto-qbank-track-empty">{track.emptyHint}</p>
          ) : null}
          {onExpandExplore ? (
            <button type="button" className="broto-qbank-track-explore-btn" onClick={onExpandExplore}>
              Explorar o banco
            </button>
          ) : null}
        </div>
      ) : track.rows.length === 0 ? (
        <p className="broto-qbank-track-empty" role="status">
          {track.emptyHint}
        </p>
      ) : (
        <ul className="broto-qbank-track-list">
          {track.rows.map((row) => (
            <QuestionBankSuggestCard
              key={`${row.year}-${row.index}-${row.language ?? 'p'}-${track.id}`}
              row={row}
              selectedArea={selectedArea}
              onOpen={onOpenRow}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
