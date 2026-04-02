export type AreaKey =
  | 'matematica'
  | 'linguagens'
  | 'ciencias-humanas'
  | 'ciencias-natureza'
  | string

type DailyAreaStats = Record<AreaKey, { answered: number; correct: number }>

export interface DailyMissionsState {
  date: string
  byArea: DailyAreaStats
}

const STORAGE_KEY = 'broto:daily-missions:v1'

const listeners = new Set<() => void>()

export function subscribeDailyMissions(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notifyDailyMissions(): void {
  listeners.forEach(l => l())
}

function todayLocalISO(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function emptyState(date: string): DailyMissionsState {
  return { date, byArea: {} }
}

export function getDailyMissionsState(): DailyMissionsState {
  const date = todayLocalISO()
  if (typeof localStorage === 'undefined') return emptyState(date)

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyState(date)

  try {
    const parsed = JSON.parse(raw) as DailyMissionsState
    if (!parsed?.date || typeof parsed.date !== 'string') return emptyState(date)
    if (parsed.date !== date) return emptyState(date)
    if (!parsed.byArea || typeof parsed.byArea !== 'object') return emptyState(date)
    return parsed
  } catch {
    return emptyState(date)
  }
}

export function incrementDailyAreaAnswer(params: {
  areaKey: AreaKey
  isCorrect: boolean
}): DailyMissionsState {
  const { areaKey, isCorrect } = params
  const current = getDailyMissionsState()
  const prev = current.byArea[areaKey] ?? { answered: 0, correct: 0 }
  const next: DailyMissionsState = {
    ...current,
    byArea: {
      ...current.byArea,
      [areaKey]: {
        answered: prev.answered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      },
    },
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  notifyDailyMissions()
  return next
}
