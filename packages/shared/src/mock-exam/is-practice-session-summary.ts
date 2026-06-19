import { isRecord } from '../utils/is-record'
import type { PracticeTopicStat, PracticeSessionSummary } from './types'

function isPracticeTopicStat(raw: unknown): raw is PracticeTopicStat {
  if (!isRecord(raw)) return false
  return (
    typeof raw.corretas === 'number' &&
    typeof raw.total === 'number' &&
    typeof raw.percentual === 'number'
  )
}

/** Valida snapshot JSON de `practice_sessions.summary`. */
export function isPracticeSessionSummary(raw: unknown): raw is PracticeSessionSummary {
  if (!isRecord(raw)) return false
  if (typeof raw.percentualGeral !== 'number') return false
  if (typeof raw.totalQuestoes !== 'number') return false
  if (typeof raw.totalCorretas !== 'number') return false
  if (!isRecord(raw.porArea)) return false
  if (!isRecord(raw.porTopico)) return false
  for (const v of Object.values(raw.porArea)) {
    if (!isPracticeTopicStat(v)) return false
  }
  for (const v of Object.values(raw.porTopico)) {
    if (!isPracticeTopicStat(v)) return false
  }
  return true
}
