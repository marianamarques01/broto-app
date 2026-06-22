export const FREEZE_REWARD_DAYS = 7
export const MAX_FREEZES = 3

export interface StreakUserState {
  streak: number
  lastStudyDate: string | null
  streakFreezes: number
  totalFreezesEarned: number
}

export interface StreakUpdatePlan {
  shouldUpdate: boolean
  newStreak: number
  newStreakFreezes: number
  newTotalFreezesEarned: number
  consumeFreeze: boolean
  freezeNumber: number | null
}

export function daysBetweenUtc(lastIso: string, todayIso: string): number {
  const last = new Date(`${lastIso}T00:00:00.000Z`)
  const today = new Date(`${todayIso}T00:00:00.000Z`)
  return Math.round((today.getTime() - last.getTime()) / 86_400_000)
}

/** Plano de atualização de streak + freezes para answer-question (UTC). */
export function planStreakUpdate(user: StreakUserState, todayStr: string): StreakUpdatePlan {
  const last = user.lastStudyDate != null ? String(user.lastStudyDate).slice(0, 10) : null

  if (last === todayStr) {
    return {
      shouldUpdate: false,
      newStreak: user.streak,
      newStreakFreezes: user.streakFreezes,
      newTotalFreezesEarned: user.totalFreezesEarned,
      consumeFreeze: false,
      freezeNumber: null,
    }
  }

  let newStreak = user.streak
  let consumeFreeze = false
  let freezeNumber: number | null = null
  let newStreakFreezes = user.streakFreezes
  let newTotalFreezesEarned = user.totalFreezesEarned

  if (last === null) {
    newStreak = 1
  } else {
    const daysSinceLastStudy = daysBetweenUtc(last, todayStr)
    if (daysSinceLastStudy === 1) {
      newStreak = newStreak + 1
    } else if (daysSinceLastStudy === 2 && user.streakFreezes > 0) {
      consumeFreeze = true
      freezeNumber = user.totalFreezesEarned - user.streakFreezes + 1
      newStreakFreezes = user.streakFreezes - 1
      newStreak = newStreak + 1
    } else {
      newStreak = 1
    }
  }

  if (newStreak > 0 && newStreak % FREEZE_REWARD_DAYS === 0 && newStreakFreezes < MAX_FREEZES) {
    newStreakFreezes += 1
    newTotalFreezesEarned += 1
  }

  return {
    shouldUpdate: true,
    newStreak,
    newStreakFreezes,
    newTotalFreezesEarned,
    consumeFreeze,
    freezeNumber,
  }
}
