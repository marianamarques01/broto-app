/**
 * Contratos HTTP das edge functions — espelho de `packages/shared/src/types/edge-functions.ts`.
 * Manter sincronizado ao alterar payloads/respostas.
 */

export type EnemAreaKey = 'linguagens' | 'ciencias-humanas' | 'ciencias-natureza' | 'matematica'

export type BrotoChatMessage = { role: 'user' | 'assistant'; content: string }

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

export function parseBrotoChatBody(raw: unknown): BrotoChatMessage[] | null {
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
  return out
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
