import type { AreaStat } from '../types/dashboard-progress'

export type RoutineGenerateSession = {
  day: number
  topic: string
  area: string
  duration_minutes: number
  p_know: number
  rationale?: string
}

export type RoutineGenerateResponse = {
  source?: string
  generated_at?: string
  sessions: RoutineGenerateSession[]
  _source?: 'fastapi' | 'local_fallback'
}

export function pKnowConfidenceFromObservations(totalAnswered: number): 'high' | 'medium' | 'low' {
  if (totalAnswered >= 8) return 'high'
  if (totalAnswered >= 3) return 'medium'
  return 'low'
}

/** Reordena áreas conforme prioridade retornada pela edge / FastAPI. */
export function applySessionPriorityToAreas(
  areas: AreaStat[],
  sessions: Pick<RoutineGenerateSession, 'area'>[],
): AreaStat[] {
  const priority = sessions.map((s) => s.area)
  return [...areas].sort((a, b) => {
    const ia = priority.indexOf(a.value)
    const ib = priority.indexOf(b.value)
    if (ia === -1 && ib === -1) return a.accuracyPct - b.accuracyPct
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
