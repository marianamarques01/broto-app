import type { QuestionBankPracticeTrack, QuestionBankTrackId } from '@broto/shared'
import type { QuestionBankRow } from '@/hooks/useQuestionBank'
import type { LucideIcon } from 'lucide-react'
import { Compass, Sparkles, Target, TrendingDown } from 'lucide-react'

const TRACK_META: Record<
  QuestionBankTrackId,
  { badge: string; tone: 'violet' | 'gold' | 'sky' | 'mint'; Icon: LucideIcon }
> = {
  mistakes: { badge: 'Prioridade', tone: 'violet', Icon: Target },
  weak: { badge: 'Reforço', tone: 'gold', Icon: TrendingDown },
  newTopics: { badge: 'Novidade', tone: 'sky', Icon: Sparkles },
  freeExplore: { badge: 'Livre', tone: 'mint', Icon: Compass },
}

export interface StartPathsGridProps {
  tracks: QuestionBankPracticeTrack[]
  onOpenRow: (row: QuestionBankRow) => void
  onExpandExplore?: () => void
}

export function StartPathsGrid({ tracks, onOpenRow, onExpandExplore }: StartPathsGridProps) {
  return (
    <section className="broto-qbank-start" aria-labelledby="broto-qbank-start-title">
      <h2 id="broto-qbank-start-title" className="broto-qbank-section-title">
        Por onde queres começar?
      </h2>
      <ul className="broto-qbank-start-grid">
        {tracks.map((track) => {
          const meta = TRACK_META[track.id]
          const Icon = meta.Icon
          const first = track.rows[0] ?? null
          const isExplore = track.id === 'freeExplore'
          const canAct = isExplore ? Boolean(onExpandExplore) : Boolean(first)
          const hint =
            isExplore || (!isExplore && track.rows.length > 0)
              ? null
              : track.emptyHint.trim()
                ? track.emptyHint
                : null
          const ctaLabel = isExplore ? 'Explorar o catálogo' : 'Começar neste caminho'
          return (
            <li key={track.id}>
              <button
                type="button"
                className={`broto-qbank-start-card broto-qbank-start-card--${meta.tone}`}
                aria-label={ctaLabel}
                disabled={!canAct}
                onClick={() => {
                  if (isExplore) onExpandExplore?.()
                  else if (first) onOpenRow(first)
                }}
              >
                <div className="broto-qbank-start-card__glow" aria-hidden />
                <span className="broto-qbank-start-card__dot" aria-hidden />
                <div className="broto-qbank-start-card__icon">
                  <Icon size={20} strokeWidth={1.8} aria-hidden />
                </div>
                <h3 className="broto-qbank-start-card__title">{track.title}</h3>
                <p className="broto-qbank-start-card__meta">{hint ?? meta.badge}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
