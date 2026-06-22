import type { SupabaseClient } from '@supabase/supabase-js'
import type { FlashcardDueItem } from './types'

export async function getDueFlashcards(
  supabase: SupabaseClient,
  userId: string,
  options: {
    topicKey?: string
    limit?: number
    includeNew?: boolean // incluir cards nunca vistos (state=0)?
  } = {},
): Promise<FlashcardDueItem[]> {
  const { topicKey, limit = 20, includeNew = true } = options
  const now = new Date().toISOString()

  let query = supabase
    .from('flashcard_reviews')
    .select('card_id, topic_key, area_key, due, state, reps, scheduled_days')
    .eq('user_id', userId)
    .lte('due', now)
    .order('due', { ascending: true })
    .limit(limit)

  if (topicKey) query = query.eq('topic_key', topicKey)
  if (!includeNew) query = query.gt('state', 0)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getNextDueDate(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('flashcard_reviews')
    .select('due')
    .eq('user_id', userId)
    .gt('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(1)
    .single()

  return data?.due ?? null
}
