import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useRef } from 'react'

export type TopicCarouselItem = {
  value: string
  label: string
  count: number
  /** 0–100 */
  progressPct: number
}

export interface TopicCarouselSectionProps {
  items: TopicCarouselItem[]
  loading: boolean
  onSelect: (value: string) => void
}

export function TopicCarouselSection({ items, loading, onSelect }: TopicCarouselSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = useCallback((delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  if (loading) {
    return (
      <section className="broto-qbank-topics" aria-hidden>
        <div className="broto-qbank-section-head">
          <h2 className="broto-qbank-section-title">Tópicos do exame</h2>
        </div>
        <div className="broto-skeleton" style={{ height: 100, borderRadius: 16 }} />
      </section>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="broto-qbank-topics" aria-labelledby="broto-qbank-topics-title">
      <div className="broto-qbank-section-head">
        <h2 id="broto-qbank-topics-title" className="broto-qbank-section-title">
          Tópicos do exame
        </h2>
        <div className="broto-qbank-topics__nav" aria-hidden>
          <button
            type="button"
            className="broto-qbank-topics__arrow"
            onClick={() => scrollBy(-220)}
            aria-label="Rolar tópicos para a esquerda"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="broto-qbank-topics__arrow"
            onClick={() => scrollBy(220)}
            aria-label="Rolar tópicos para a direita"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="broto-qbank-topics__scroller" ref={scrollerRef} tabIndex={0} role="region">
        <ul className="broto-qbank-topics__list">
          {items.map((t) => (
            <li key={t.value}>
              <button
                type="button"
                className="broto-qbank-topic-tile"
                onClick={() => onSelect(t.value)}
              >
                <span className="broto-qbank-topic-tile__name">{t.label}</span>
                <span className="broto-qbank-topic-tile__count">
                  {t.count.toLocaleString('pt-BR')} questões
                </span>
                <span className="broto-qbank-topic-tile__bar" aria-hidden>
                  <span
                    className="broto-qbank-topic-tile__bar-fill"
                    style={{ width: `${t.progressPct}%` }}
                  />
                </span>
                <span className="broto-qbank-topic-tile__pct">{t.progressPct}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
