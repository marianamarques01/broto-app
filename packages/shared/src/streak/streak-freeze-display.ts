export const STREAK_FREEZE_REWARD_DAYS = 7
export const STREAK_FREEZE_MAX = 3

/** Dias até ganhar o próximo freeze (null se já tem o máximo disponível). */
export function daysUntilNextStreakFreeze(
  streak: number,
  streakFreezes: number,
): number | null {
  if (streakFreezes >= STREAK_FREEZE_MAX) return null
  if (streak <= 0) return STREAK_FREEZE_REWARD_DAYS
  const mod = streak % STREAK_FREEZE_REWARD_DAYS
  return mod === 0 ? STREAK_FREEZE_REWARD_DAYS : STREAK_FREEZE_REWARD_DAYS - mod
}

export function streakFreezeDisplayLabel(streak: number, streakFreezes: number): string {
  if (streakFreezes > 0) {
    return `🧊 ${streakFreezes} freeze${streakFreezes > 1 ? 's' : ''}`
  }
  const days = daysUntilNextStreakFreeze(streak, streakFreezes)
  if (days == null) {
    return `🧊 ${STREAK_FREEZE_MAX}/${STREAK_FREEZE_MAX} freezes`
  }
  return `🧊 0/${STREAK_FREEZE_MAX} · próximo em ${days} ${days === 1 ? 'dia' : 'dias'}`
}
