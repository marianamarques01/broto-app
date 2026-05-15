import type { MockExamAnswerResult } from './types'
import type { PracticeSessionProgressState } from './types'

/**
 * Interpreta `practice_sessions.progress` (jsonb) vindo da API.
 */
export function parsePracticeSessionProgress(raw: unknown): PracticeSessionProgressState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const ci = o.currentIndex
  const sk = o.skippedQuestionIds
  if (typeof ci !== 'number' || !Number.isFinite(ci) || ci < 0) return null
  const skips = Array.isArray(sk) && sk.every((x) => typeof x === 'string') ? sk : []
  return {
    currentIndex: Math.floor(ci),
    skippedQuestionIds: skips.map((s) => String(s).trim()).filter(Boolean),
  }
}

export type PracticeSessionAnswerSnapshot = { questionId: string; isCorrect: boolean }

/** Monta `results` mínimos a partir do snapshot da sessão (retomada). */
export function mockExamResultsFromSessionAnswers(
  rows: PracticeSessionAnswerSnapshot[],
): MockExamAnswerResult[] {
  return rows.map((r) => ({
    questionId: r.questionId,
    isCorrect: r.isCorrect,
  }))
}
