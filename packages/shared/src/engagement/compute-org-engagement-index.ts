/**
 * Índice de risco de abandono (0–100) — fórmula v1 documentada em docs/instituicoes-arquitetura.md
 */
export function computeAbandonmentRiskIndex(params: {
  active7dPct: number
  missingPct: number
  streakBrokenPct: number
}): number {
  const { active7dPct, missingPct, streakBrokenPct } = params
  const inactivePct = Math.max(0, Math.min(100, 100 - active7dPct))
  const missing = Math.max(0, Math.min(100, missingPct))
  const streakBroken = Math.max(0, Math.min(100, streakBrokenPct))

  const raw = 0.4 * inactivePct + 0.35 * missing + 0.25 * streakBroken

  return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100
}

export function pct(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 10_000) / 100
}
