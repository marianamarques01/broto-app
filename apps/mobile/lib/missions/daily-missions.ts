import AsyncStorage from '@react-native-async-storage/async-storage'

export type AreaKey =
  | 'matematica'
  | 'linguagens'
  | 'ciencias-humanas'
  | 'ciencias-natureza'
  | string

type DailyAreaStats = Record<AreaKey, { answered: number; correct: number }>

export interface DailyMissionsState {
  date: string // YYYY-MM-DD (local)
  byArea: DailyAreaStats
}

const STORAGE_KEY = 'broto:daily-missions:v1'

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

export async function getDailyMissionsState(): Promise<DailyMissionsState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  const date = todayLocalISO()
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

export async function incrementDailyAreaAnswer(params: {
  areaKey: AreaKey
  isCorrect: boolean
}): Promise<DailyMissionsState> {
  const { areaKey, isCorrect } = params
  const current = await getDailyMissionsState()
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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export async function resetDailyMissionsState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}
