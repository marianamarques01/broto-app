/**
 * Contratos HTTP das edge functions — espelho de `packages/shared/src/types/edge-functions.ts`.
 * Manter sincronizado ao alterar payloads/respostas.
 */

export type EnemAreaKey = 'linguagens' | 'ciencias-humanas' | 'ciencias-natureza' | 'matematica'

export type BrotoChatMessage = { role: 'user' | 'assistant'; content: string }

export type ParsedBrotoChatBody = {
  messages: BrotoChatMessage[]
  sessionId?: string
  turnIndex: number
  classId?: string
}

export type AnswerQuestionBody = {
  questionId: string
  isCorrect?: boolean
  timeSpentSec?: number
  sessionId?: string
  areaKey?: EnemAreaKey
}

export type PracticeSessionCreateBody = {
  questionIds: string[]
  config?: Record<string, unknown>
  kind?: 'student_mock' | 'class_assignment'
}

export type PracticeSessionIdBody = { sessionId: string }

export type PracticeSessionProgressBody = {
  sessionId: string
  progress: {
    currentIndex: number
    skippedQuestionIds?: string[]
  }
}

export type PetMePatchBody = { nome?: string; brotoNome?: string }

export type NotebookLmChatResponse = { answer: string; class_id: string }

/** Narrow `unknown` to plain object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonBody(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null
  return raw
}

export function parseAnswerQuestionBody(raw: unknown): AnswerQuestionBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const questionId = typeof o.questionId === 'string' ? o.questionId.trim() : ''
  if (!questionId) return null
  const timeSpentSecRaw = o.timeSpentSec
  const timeSpentSec =
    typeof timeSpentSecRaw === 'number' && Number.isFinite(timeSpentSecRaw)
      ? Math.max(0, Math.floor(timeSpentSecRaw))
      : undefined
  const sessionIdRaw = o.sessionId
  const sessionId =
    typeof sessionIdRaw === 'string' && sessionIdRaw.trim() ? sessionIdRaw.trim() : undefined
  const rawAreaKey = typeof o.areaKey === 'string' ? o.areaKey.trim() : undefined
  const areaKey =
    rawAreaKey === 'linguagens' ||
    rawAreaKey === 'ciencias-humanas' ||
    rawAreaKey === 'ciencias-natureza' ||
    rawAreaKey === 'matematica'
      ? rawAreaKey
      : undefined
  return {
    questionId,
    isCorrect: o.isCorrect === true,
    timeSpentSec,
    sessionId,
    areaKey,
  }
}

export function parsePracticeSessionCreateBody(raw: unknown): PracticeSessionCreateBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const questionIdsRaw = o.questionIds
  if (!Array.isArray(questionIdsRaw) || questionIdsRaw.length === 0) return null
  const questionIds = questionIdsRaw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
  if (questionIds.length === 0) return null
  const configRaw = o.config
  const config =
    configRaw !== null && typeof configRaw === 'object' && !Array.isArray(configRaw)
      ? (configRaw as Record<string, unknown>)
      : undefined
  const kindRaw = o.kind
  const kind = kindRaw === 'student_mock' || kindRaw === 'class_assignment' ? kindRaw : undefined
  return { questionIds, config, kind }
}

export function parseSessionIdBody(raw: unknown): string | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  return sessionId || null
}

export function parsePracticeSessionProgressBody(raw: unknown): PracticeSessionProgressBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  if (!sessionId) return null
  const progressRaw = o.progress
  if (!isRecord(progressRaw)) return null
  const currentIndexRaw = progressRaw.currentIndex
  if (typeof currentIndexRaw !== 'number' || !Number.isFinite(currentIndexRaw)) return null
  const skippedRaw = progressRaw.skippedQuestionIds
  const skippedQuestionIds =
    Array.isArray(skippedRaw) && skippedRaw.every((x) => typeof x === 'string')
      ? skippedRaw.map((s) => s.trim()).filter(Boolean)
      : []
  return {
    sessionId,
    progress: {
      currentIndex: Math.floor(currentIndexRaw),
      skippedQuestionIds,
    },
  }
}

export function parsePracticeSessionCompleteBody(raw: unknown): {
  sessionId: string
  summary: Record<string, unknown> | null | undefined
} | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  if (!sessionId) return null
  const summary = o.summary
  if (
    summary !== null &&
    summary !== undefined &&
    (typeof summary !== 'object' || Array.isArray(summary))
  ) {
    return null
  }
  return {
    sessionId,
    summary: summary as Record<string, unknown> | null | undefined,
  }
}

export function parsePracticeSessionDeleteBody(raw: unknown): {
  sessionId: string
  deleteAll: boolean
} | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  const deleteAll = o.deleteAll === true
  if (!deleteAll && !sessionId) return null
  return { sessionId, deleteAll }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseBrotoChatBody(raw: unknown): ParsedBrotoChatBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const messages = o.messages
  if (!Array.isArray(messages) || messages.length === 0) return null
  const out: BrotoChatMessage[] = []
  for (const m of messages) {
    if (!isRecord(m)) return null
    if (m.role !== 'user' && m.role !== 'assistant') return null
    if (typeof m.content !== 'string') return null
    out.push({ role: m.role, content: m.content })
  }
  const sessionIdRaw = o.sessionId
  const sessionId =
    typeof sessionIdRaw === 'string' && UUID_RE.test(sessionIdRaw.trim())
      ? sessionIdRaw.trim()
      : undefined
  const turnIndexRaw = o.turnIndex
  const turnIndex =
    typeof turnIndexRaw === 'number' && Number.isFinite(turnIndexRaw) && turnIndexRaw >= 0
      ? Math.floor(turnIndexRaw)
      : 0
  const classIdRaw = o.classId
  const classId =
    typeof classIdRaw === 'string' && UUID_RE.test(classIdRaw.trim())
      ? classIdRaw.trim()
      : undefined
  return { messages: out, sessionId, turnIndex, classId }
}

const BROTO_CHAT_SESSIONS_DEFAULT_LIMIT = 30
const BROTO_CHAT_SESSIONS_MAX_LIMIT = 50

export function parseBrotoChatSessionsListBody(raw: unknown): { classId?: string; limit: number } {
  const o = parseJsonBody(raw) ?? {}
  const classIdRaw = o.classId
  const classId =
    typeof classIdRaw === 'string' && UUID_RE.test(classIdRaw.trim())
      ? classIdRaw.trim()
      : undefined
  const limitRaw = o.limit
  const limit =
    typeof limitRaw === 'number' && Number.isFinite(limitRaw)
      ? Math.min(BROTO_CHAT_SESSIONS_MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : BROTO_CHAT_SESSIONS_DEFAULT_LIMIT
  return { classId, limit }
}

export function parseBrotoChatSessionGetBody(raw: unknown): string | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  if (!sessionId || !UUID_RE.test(sessionId)) return null
  return sessionId
}

export function parsePetMePatchBody(raw: unknown): PetMePatchBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const nome = typeof o.nome === 'string' ? o.nome : undefined
  const brotoNome = typeof o.brotoNome === 'string' ? o.brotoNome : undefined
  if (nome === undefined && brotoNome === undefined) return null
  return { nome, brotoNome }
}

const PRACTICE_SESSION_LIST_DEFAULT_LIMIT = 50
const PRACTICE_SESSION_LIST_MAX_LIMIT = 100

export function parsePracticeSessionListBody(raw: unknown): { limit: number } {
  const o = parseJsonBody(raw) ?? {}
  const limitRaw = o.limit
  if (typeof limitRaw === 'number' && Number.isFinite(limitRaw)) {
    return {
      limit: Math.min(PRACTICE_SESSION_LIST_MAX_LIMIT, Math.max(1, Math.floor(limitRaw))),
    }
  }
  return { limit: PRACTICE_SESSION_LIST_DEFAULT_LIMIT }
}

export type PerformanceSeriesPeriod = 'week' | 'month' | 'all'

export function parsePerformanceSeriesBody(raw: unknown): { period: PerformanceSeriesPeriod } {
  const o = parseJsonBody(raw)
  const periodRaw = o?.period
  const period: PerformanceSeriesPeriod =
    periodRaw === 'month' || periodRaw === 'all' ? periodRaw : 'week'
  return { period }
}

export function parseUserOnboardingBody(raw: unknown): Record<string, unknown> | null {
  return parseJsonBody(raw)
}

export function parseNotebookLmChatResponse(raw: unknown): NotebookLmChatResponse | null {
  if (!isRecord(raw)) return null
  const answer = typeof raw.answer === 'string' ? raw.answer : ''
  const class_id = typeof raw.class_id === 'string' ? raw.class_id : ''
  if (!answer.trim()) return null
  return { answer, class_id }
}

export type FlashcardReviewBody = {
  card_id: string
  topic_key?: string
  area_key?: string
  rating: number
}

const FLASHCARD_REVIEW_RATINGS = new Set([1, 3, 4])

export function parseFlashcardReviewBody(raw: unknown): FlashcardReviewBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const card_id = typeof o.card_id === 'string' ? o.card_id.trim() : ''
  const rating = typeof o.rating === 'number' ? o.rating : Number(o.rating)
  if (!card_id || !Number.isFinite(rating) || !FLASHCARD_REVIEW_RATINGS.has(rating)) {
    return null
  }
  const topic_key = typeof o.topic_key === 'string' ? o.topic_key.trim() : undefined
  const area_key = typeof o.area_key === 'string' ? o.area_key.trim() : undefined
  return { card_id, topic_key, area_key, rating }
}

export type MaterialChunkMetadata = {
  page_number?: number
  section_title?: string
  file_name?: string
}

export type MaterialEmbedChunk = {
  text: string
  tokens?: number
  metadata?: MaterialChunkMetadata
}

export type MaterialEmbedBody = {
  material_id: string
  class_id: string
  chunks: MaterialEmbedChunk[]
}

const SEMANTIC_SEARCH_DEFAULT_LIMIT = 5
const SEMANTIC_SEARCH_MAX_LIMIT = 20
/** Corte inicial; abaixo disso ainda tentamos fallback com top-k (turmas com poucos chunks). */
const SEMANTIC_SEARCH_DEFAULT_THRESHOLD = 0.5
const SEMANTIC_SEARCH_FALLBACK_THRESHOLD = 0.32

export {
  SEMANTIC_SEARCH_DEFAULT_LIMIT,
  SEMANTIC_SEARCH_DEFAULT_THRESHOLD,
  SEMANTIC_SEARCH_FALLBACK_THRESHOLD,
  SEMANTIC_SEARCH_MAX_LIMIT,
}

export type SemanticSearchBody = {
  query: string
  class_id: string
  limit: number
  similarity_threshold: number
}

export function parseMaterialEmbedBody(raw: unknown): MaterialEmbedBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const material_id = typeof o.material_id === 'string' ? o.material_id.trim() : ''
  const class_id = typeof o.class_id === 'string' ? o.class_id.trim() : ''
  if (!material_id || !class_id) return null
  const chunksRaw = o.chunks
  if (!Array.isArray(chunksRaw) || chunksRaw.length === 0) return null
  const chunks: MaterialEmbedChunk[] = []
  for (const item of chunksRaw) {
    if (!isRecord(item)) return null
    const text = typeof item.text === 'string' ? item.text.trim() : ''
    if (!text) return null
    const tokensRaw = item.tokens
    const tokens =
      typeof tokensRaw === 'number' && Number.isFinite(tokensRaw)
        ? Math.max(0, Math.floor(tokensRaw))
        : undefined
    const metadataRaw = item.metadata
    const metadata =
      metadataRaw !== null &&
      metadataRaw !== undefined &&
      typeof metadataRaw === 'object' &&
      !Array.isArray(metadataRaw)
        ? (metadataRaw as Record<string, unknown>)
        : undefined
    chunks.push({ text, tokens, metadata })
  }
  return { material_id, class_id, chunks }
}

export function parseSemanticSearchBody(raw: unknown): SemanticSearchBody | null {
  const o = parseJsonBody(raw)
  if (!o) return null
  const query = typeof o.query === 'string' ? o.query.trim() : ''
  const class_id = typeof o.class_id === 'string' ? o.class_id.trim() : ''
  if (!query || !class_id) return null
  const limitRaw = o.limit
  const limit =
    typeof limitRaw === 'number' && Number.isFinite(limitRaw)
      ? Math.min(SEMANTIC_SEARCH_MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : SEMANTIC_SEARCH_DEFAULT_LIMIT
  const thresholdRaw = o.similarity_threshold
  const similarity_threshold =
    typeof thresholdRaw === 'number' && Number.isFinite(thresholdRaw)
      ? Math.min(1, Math.max(0, thresholdRaw))
      : SEMANTIC_SEARCH_DEFAULT_THRESHOLD
  return { query, class_id, limit, similarity_threshold }
}
