/** Missão diária mínima para texto de XP na timeline (web / mobile). */
export type MissionTimelineXpHintInput = {
  title: string
  xp: number
}

/**
 * Texto curto de XP para cards da timeline (ex.: "10 XP por questão").
 */
export function missionTimelineXpHint(m: MissionTimelineXpHintInput): string {
  const match = /^(\d+)\s+questões\b/i.exec(m.title.trim())
  if (match) {
    const n = Number(match[1])
    if (n > 0 && m.xp % n === 0) {
      const per = m.xp / n
      return `${per} XP por questão`
    }
  }
  return `${m.xp} XP ao concluir`
}
