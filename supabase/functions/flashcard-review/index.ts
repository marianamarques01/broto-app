import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { FSRS, createEmptyCard, type Card, type Grade } from 'npm:ts-fsrs@5.4.1'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parseFlashcardReviewBody } from '../_shared/edge-api-types.ts'
import type { FlashcardReviewsRow } from '../../database.types.ts'

const fsrs = new FSRS({})

function cardFromRow(row: FlashcardReviewsRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: 0,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  }
}

function inferTopicKey(cardId: string): string {
  const parts = cardId.split('-')
  if (parts.length < 2) return cardId
  return parts.slice(0, -1).join('-')
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const parsed = parseFlashcardReviewBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'card_id e rating são obrigatórios' }, cors)
    }
    const { card_id, topic_key, area_key, rating } = parsed

    const admin = createServiceRoleClientUnsafe()

    const { data: existing, error: selectError } = await admin
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', card_id)
      .maybeSingle()

    if (selectError) {
      console.error('[flashcard-review] select', selectError)
      return json(500, { error: 'Erro ao buscar revisão' }, cors)
    }

    const now = new Date()
    const card: Card = existing ? cardFromRow(existing) : createEmptyCard(now)
    const result = fsrs.next(card, now, rating as Grade)
    const nextCard = result.card

    const resolvedTopicKey = topic_key ?? existing?.topic_key ?? inferTopicKey(card_id)
    const resolvedAreaKey = area_key ?? existing?.area_key ?? 'unknown'

    const { error: upsertError } = await admin.from('flashcard_reviews').upsert(
      {
        user_id: user.id,
        card_id,
        topic_key: resolvedTopicKey,
        area_key: resolvedAreaKey,
        due: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        elapsed_days: nextCard.elapsed_days,
        scheduled_days: nextCard.scheduled_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        state: nextCard.state,
        last_review: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id,card_id' },
    )

    if (upsertError) {
      console.error('[flashcard-review] upsert', upsertError)
      return json(500, { error: 'Erro ao salvar revisão' }, cors)
    }

    return json(
      200,
      {
        card_id,
        due: nextCard.due.toISOString(),
        scheduled_days: nextCard.scheduled_days,
        state: nextCard.state,
        reps: nextCard.reps,
      },
      cors,
    )
  } catch (err) {
    console.error('[flashcard-review]', err)
    return json(500, { error: String(err) }, cors)
  }
})
