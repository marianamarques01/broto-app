import { DEFAULT_AT_RISK_WINDOW_DAYS, DEFAULT_INACTIVE_DAYS } from './constants.ts'
import type { StudentEngagementState } from '../types/engagement.ts'

export type StudentEngagementInput = {
  streak: number
  lastActivityAt: string | null
  activeInLast7d: boolean
  activeInLast14d: boolean
}

export function computeStudentEngagementState(
  input: StudentEngagementInput,
): StudentEngagementState {
  const { streak, activeInLast7d, activeInLast14d } = input

  if (!activeInLast7d) {
    return activeInLast14d ? 'at_risk' : 'missing'
  }

  if (streak <= 0) {
    return 'at_risk'
  }

  return 'engaged'
}

export function buildActiveStudentSets(params: {
  studentIds: readonly string[]
  activityTimestampsByUser: ReadonlyMap<string, readonly string[]>
  nowMs?: number
  inactiveDays?: number
  atRiskWindowDays?: number
}): {
  active7d: ReadonlySet<string>
  active14d: ReadonlySet<string>
} {
  const {
    studentIds,
    activityTimestampsByUser,
    nowMs = Date.now(),
    inactiveDays = DEFAULT_INACTIVE_DAYS,
    atRiskWindowDays = DEFAULT_AT_RISK_WINDOW_DAYS,
  } = params

  const ms7d = inactiveDays * 86_400_000
  const ms14d = atRiskWindowDays * 86_400_000
  const active7d = new Set<string>()
  const active14d = new Set<string>()

  for (const studentId of studentIds) {
    const timestamps = activityTimestampsByUser.get(studentId) ?? []
    const latestMs = timestamps.reduce((max, iso) => {
      const t = Date.parse(iso)
      return Number.isFinite(t) && t > max ? t : max
    }, 0)

    if (latestMs <= 0) continue

    const age = nowMs - latestMs
    if (age <= ms7d) active7d.add(studentId)
    if (age <= ms14d) active14d.add(studentId)
  }

  return { active7d, active14d }
}
