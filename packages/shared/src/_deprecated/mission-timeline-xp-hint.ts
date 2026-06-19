/** @deprecated Sem consumidores — removido da API pública em 2026-06. */
export type MissionTimelineXpHintInput = {
  title: string
  xp: number
}

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
