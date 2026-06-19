import { isRecord } from '../utils/is-record'
import { MOCK_EXAM_TIME_LIMIT_MINUTES_MAX, MOCK_EXAM_TIME_LIMIT_MINUTES_MIN } from './constants'

export function clampMockExamTimeLimitMinutes(n: number): number {
  const v = Math.round(Number.isFinite(n) ? n : MOCK_EXAM_TIME_LIMIT_MINUTES_MIN)
  return Math.min(MOCK_EXAM_TIME_LIMIT_MINUTES_MAX, Math.max(MOCK_EXAM_TIME_LIMIT_MINUTES_MIN, v))
}

/** Lê `timeLimitMinutes` gravado em `practice_sessions.config` (JSON). */
export function timeLimitMinutesFromPracticeConfig(config: unknown): number | null {
  if (!isRecord(config)) return null
  const raw = config.timeLimitMinutes
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return clampMockExamTimeLimitMinutes(n)
}
