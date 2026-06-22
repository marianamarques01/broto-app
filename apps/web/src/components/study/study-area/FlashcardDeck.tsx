import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  FLASHCARD_RATING,
  getDueFlashcards,
  getNextDueDate,
  type FlashcardDueItem,
} from '@broto/shared'
import type { StudyFlashcard } from '@/lib/study-area-mock'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api-client'

function buildLocalDueItems(
  topicKey: string,
  areaKey: string,
  contentCards: StudyFlashcard[],
): FlashcardDueItem[] {
  const now = new Date().toISOString()
  return contentCards.map((_, i) => ({
    card_id: `${topicKey}-${i}`,
    topic_key: topicKey,
    area_key: areaKey,
    due: now,
    state: 0,
    reps: 0,
    scheduled_days: 0,
  }))
}

function resolveCardContent(
  dueItem: FlashcardDueItem,
  topicKey: string,
  contentCards: StudyFlashcard[],
): StudyFlashcard | null {
  const prefix = `${topicKey}-`
  const suffix = dueItem.card_id.startsWith(prefix)
    ? dueItem.card_id.slice(prefix.length)
    : dueItem.card_id.split('-').pop()
  const index = parseInt(suffix ?? '', 10)
  if (Number.isNaN(index) || index < 0 || index >= contentCards.length) return null
  return contentCards[index]
}

function formatReviewFeedback(rating: number, scheduledDays: number): string {
  if (rating === FLASHCARD_RATING.AGAIN || scheduledDays <= 0) {
    return '↩ Aparece novamente em breve'
  }
  if (scheduledDays === 1) return '✓ Próxima revisão: amanhã'
  return `✓ Próxima revisão: em ${scheduledDays} dias`
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'em breve'
  if (diffDays === 1) return 'amanhã'
  if (diffDays < 7) return `em ${diffDays} dias`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

type FlashcardReviewResponse = {
  card_id: string
  due: string
  scheduled_days: number
  state: number
  reps: number
}

export function FlashcardDeck({
  topicKey,
  areaKey,
  contentCards,
  areaColor,
  onDone,
}: {
  topicKey: string
  areaKey: string
  contentCards: StudyFlashcard[]
  areaColor: string
  onDone: () => void
}) {
  const { user } = useAuth()
  const userId = user?.id

  const [dueCards, setDueCards] = useState<FlashcardDueItem[]>([])
  const [nextDue, setNextDue] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [ratingPending, setRatingPending] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const uid = userId
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      setCurrentIdx(0)
      setFlipped(false)
      try {
        let cards = await getDueFlashcards(supabase, uid, { topicKey, limit: 30 })
        const next = cards.length === 0 ? await getNextDueDate(supabase, uid) : null
        if (!cancelled && cards.length === 0) {
          setNextDue(next)
          if (!next && contentCards.length > 0) {
            cards = buildLocalDueItems(topicKey, areaKey, contentCards)
          }
        } else if (!cancelled) {
          setNextDue(null)
        }
        if (!cancelled) setDueCards(cards)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erro ao carregar flashcards')
          setDueCards([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [topicKey, userId, areaKey, contentCards.length])

  const dueItem = dueCards[currentIdx]
  const card = dueItem ? resolveCardContent(dueItem, topicKey, contentCards) : null
  const remaining = dueCards.length - currentIdx
  const queueEmpty = !loading && dueCards.length === 0

  const DIFF_COLORS: Record<string, string> = {
    easy: 'var(--green-400)',
    medium: 'var(--gold-400)',
    hard: 'var(--red-400)',
  }
  const DIFF_LABELS: Record<string, string> = { easy: 'Facil', medium: 'Medio', hard: 'Dificil' }

  async function handleRating(rating: number) {
    if (!userId || !dueItem || ratingPending || !flipped) return

    setRatingPending(true)
    try {
      const result = await api.post<FlashcardReviewResponse>('/api/flashcard-review', {
        card_id: dueItem.card_id,
        topic_key: topicKey,
        area_key: areaKey,
        rating,
      })
      setFeedback(formatReviewFeedback(rating, result.scheduled_days))
      await new Promise((r) => setTimeout(r, 1500))
      setFeedback(null)
      setFlipped(false)

      const nextQueue = dueCards.filter((_, i) => i !== currentIdx)
      setDueCards(nextQueue)

      if (nextQueue.length === 0) {
        const next = await getNextDueDate(supabase, userId)
        setNextDue(next)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao salvar revisão')
    } finally {
      setRatingPending(false)
    }
  }

  if (loading) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
        Carregando flashcards…
      </p>
    )
  }

  if (loadError && queueEmpty) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--red-400)', padding: '48px 0' }}>{loadError}</p>
    )
  }

  if (queueEmpty) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>🎉 Fila zerada!</p>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {nextDue
              ? `Próximo card disponível ${formatRelativeDate(nextDue)}`
              : 'Você estudou todos os flashcards disponíveis.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="broto-btn-primary"
          style={{ marginTop: 20, justifyContent: 'center' }}
        >
          Continuar para fixação <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  if (!card) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
        Card não encontrado no deck local.
      </p>
    )
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
          {remaining} {remaining === 1 ? 'card' : 'cards'} para revisar hoje
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

      <div style={{ position: 'relative' }}>
        <div
          onClick={() => !feedback && !ratingPending && setFlipped(!flipped)}
          style={{
            minHeight: 220,
            padding: '32px 28px',
            borderRadius: 'var(--radius-lg)',
            border: `1.5px solid ${flipped ? areaColor + '44' : 'var(--border-default)'}`,
            background: flipped
              ? `linear-gradient(160deg, ${areaColor}10, var(--bg-card))`
              : 'var(--bg-card)',
            cursor: feedback || ratingPending ? 'default' : 'pointer',
            transition: 'all 0.25s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            opacity: feedback ? 0.6 : 1,
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

        {feedback && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-lg)',
              background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
              backdropFilter: 'blur(2px)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              padding: '0 24px',
              textAlign: 'center',
            }}
          >
            {feedback}
          </div>
        )}
      </div>

      {loadError && (
        <p
          style={{
            marginTop: 12,
            fontSize: '0.82rem',
            color: 'var(--red-400)',
            textAlign: 'center',
          }}
        >
          {loadError}
        </p>
      )}

      {flipped && (
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            disabled={ratingPending || !!feedback}
            onClick={() => void handleRating(FLASHCARD_RATING.AGAIN)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'color-mix(in srgb, var(--red-400) 12%, var(--bg-card))',
              color: 'var(--red-400)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: ratingPending || feedback ? 'not-allowed' : 'pointer',
              opacity: ratingPending || feedback ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            Não lembrei
          </button>
          <button
            type="button"
            disabled={ratingPending || !!feedback}
            onClick={() => void handleRating(FLASHCARD_RATING.GOOD)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'color-mix(in srgb, var(--gold-400) 14%, var(--bg-card))',
              color: 'var(--gold-400)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: ratingPending || feedback ? 'not-allowed' : 'pointer',
              opacity: ratingPending || feedback ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            Lembrei com esforço
          </button>
          <button
            type="button"
            disabled={ratingPending || !!feedback}
            onClick={() => void handleRating(FLASHCARD_RATING.EASY)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'color-mix(in srgb, var(--green-400) 14%, var(--bg-card))',
              color: 'var(--green-400)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: ratingPending || feedback ? 'not-allowed' : 'pointer',
              opacity: ratingPending || feedback ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            Fácil
          </button>
        </div>
      )}
    </div>
  )
}
