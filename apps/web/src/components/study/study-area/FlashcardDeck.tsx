import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { StudyFlashcard } from '@/lib/study-area-mock'

export function FlashcardDeck({
  cards,
  areaColor,
  onDone,
}: {
  cards: StudyFlashcard[]
  areaColor: string
  onDone: () => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())

  const card = cards[currentIdx]
  const isLast = currentIdx === cards.length - 1
  const allReviewed = reviewed.size === cards.length

  const DIFF_COLORS: Record<string, string> = {
    easy: 'var(--green-400)',
    medium: 'var(--gold-400)',
    hard: 'var(--red-400)',
  }
  const DIFF_LABELS: Record<string, string> = { easy: 'Facil', medium: 'Medio', hard: 'Dificil' }

  function handleNext() {
    setReviewed((prev) => new Set(prev).add(currentIdx))
    if (!isLast) {
      setFlipped(false)
      setCurrentIdx((prev) => prev + 1)
    } else {
      setReviewed((prev) => new Set(prev).add(currentIdx))
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Card {currentIdx + 1} de {cards.length}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: `${DIFF_COLORS[card.difficulty]}18`,
            color: DIFF_COLORS[card.difficulty],
          }}
        >
          {DIFF_LABELS[card.difficulty]}
        </span>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          minHeight: 220,
          padding: '32px 28px',
          borderRadius: 'var(--radius-lg)',
          border: `1.5px solid ${flipped ? areaColor + '44' : 'var(--border-default)'}`,
          background: flipped
            ? `linear-gradient(160deg, ${areaColor}10, var(--bg-card))`
            : 'var(--bg-card)',
          cursor: 'pointer',
          transition: 'all 0.25s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <p
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
          }}
        >
          {flipped ? 'Resposta' : 'Pergunta'}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: flipped ? '0.92rem' : '1.05rem',
            fontWeight: flipped ? 400 : 600,
            lineHeight: 1.6,
            color: flipped ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}
        >
          {flipped ? card.back : card.front}
        </p>

        <p
          style={{
            position: 'absolute',
            bottom: 14,
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          {flipped ? '' : 'Clique para ver a resposta'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => {
            setFlipped(false)
            setCurrentIdx((prev) => prev - 1)
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
            opacity: currentIdx === 0 ? 0.4 : 1,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${areaColor}44`,
            background: `${areaColor}12`,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: areaColor,
          }}
        >
          {isLast ? 'Finalizar' : 'Proximo'} <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIdx ? 20 : 8,
              height: 8,
              borderRadius: 999,
              background: reviewed.has(i)
                ? areaColor
                : i === currentIdx
                  ? `${areaColor}88`
                  : 'var(--border-strong)',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      {allReviewed && (
        <button
          type="button"
          onClick={onDone}
          className="broto-btn-primary"
          style={{ marginTop: 20, justifyContent: 'center' }}
        >
          Continuar para fixação <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}
