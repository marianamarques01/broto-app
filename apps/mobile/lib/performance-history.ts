/**
 * Local performance by day (mirrors web `performance-history.ts`; uses AsyncStorage).
 * Key matches web so behavior stays consistent if we ever unify storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'broto:perf-days:v1'

interface Store {
  days: Record<string, { answered: number; correct: number }>
}

function todayLocalISO(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function readStore(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return { days: {} }
    const p = JSON.parse(raw) as Store
    if (!p?.days || typeof p.days !== 'object') return { days: {} }
    return p
  } catch {
    return { days: {} }
  }
}

async function writeStore(s: Store): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export async function bumpPerformanceDay(isCorrect: boolean): Promise<void> {
  const k = todayLocalISO()
  const store = await readStore()
  const cur = store.days[k] ?? { answered: 0, correct: 0 }
  store.days[k] = {
    answered: cur.answered + 1,
    correct: cur.correct + (isCorrect ? 1 : 0),
  }
  await writeStore(store)
}
