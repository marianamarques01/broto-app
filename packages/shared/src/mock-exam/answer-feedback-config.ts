import type { MockExamAnswerFeedbackMode } from './types'

export const MOCK_EXAM_ANSWER_FEEDBACK_MODE_DEFAULT: MockExamAnswerFeedbackMode = 'immediate'

/** Lê `answerFeedbackMode` gravado em `practice_sessions.config` (JSON). */
export function answerFeedbackModeFromPracticeConfig(
  config: unknown,
): MockExamAnswerFeedbackMode {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return MOCK_EXAM_ANSWER_FEEDBACK_MODE_DEFAULT
  }

  const raw = (config as Record<string, unknown>).answerFeedbackMode
  return raw === 'final' ? 'final' : MOCK_EXAM_ANSWER_FEEDBACK_MODE_DEFAULT
}
