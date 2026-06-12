export type { PerformancePeriod, PerformanceBucket } from '@broto/shared'
import type { PerformanceBucket, PerformancePeriod } from '@broto/shared'

const STORAGE_KEY = 'broto:perf-days:v1'

interface Store {
  days: Record<string, { answered: number; correct: number }>
}

const listeners = new Set<() => void>()

export function subscribePerformanceHistory(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(): void {
  listeners.forEach((l) => l())
}

function todayLocalISO(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function readStore(): Store {
  if (typeof localStorage === 'undefined') return { days: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { days: {} }
    const p = JSON.parse(raw) as Store
    if (!p?.days || typeof p.days !== 'object') return { days: {} }
    return p
  } catch {
    return { days: {} }
  }
}

/** Mapa dia ISO → contagens (para heatmap / consistência na web). */
export function getPerformanceDayMap(): Record<string, { answered: number; correct: number }> {
  return { ...readStore().days }
}

let cachedDayMapJson = ''
let cachedDayMapSnapshot: Readonly<Record<string, { answered: number; correct: number }>> =
  Object.freeze({})

const EMPTY_DAY_MAP_SERVER = Object.freeze(
  {} as Readonly<Record<string, { answered: number; correct: number }>>,
)

/**
 * Snapshot estável para `useSyncExternalStore`: mesma referência enquanto o JSON do store não muda.
 * Evita loop infinito de re-renders (objeto novo a cada getSnapshot).
 */
export function getPerformanceDayMapSnapshot(): Readonly<
  Record<string, { answered: number; correct: number }>
> {
  const store = readStore()
  const json = JSON.stringify(store.days)
  if (json !== cachedDayMapJson) {
    cachedDayMapJson = json
    cachedDayMapSnapshot = Object.freeze({ ...store.days })
  }
  return cachedDayMapSnapshot
}

export function getPerformanceDayMapServerSnapshot(): Readonly<
  Record<string, { answered: number; correct: number }>
> {
  return EMPTY_DAY_MAP_SERVER
}

function writeStore(s: Store): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

/** Zera o histórico diário local (heatmap); use após resetar prática na conta no servidor. */
export function clearPerformanceHistoryLocal(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  cachedDayMapJson = ''
  cachedDayMapSnapshot = Object.freeze({})
  notify()
}

export function bumpPerformanceDay(isCorrect: boolean): void {
  const k = todayLocalISO()
  const store = readStore()
  const cur = store.days[k] ?? { answered: 0, correct: 0 }
  store.days[k] = {
    answered: cur.answered + 1,
    correct: cur.correct + (isCorrect ? 1 : 0),
  }
  writeStore(store)
  notify()
}

function dateISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Letras curtas alinhadas ao mobile (domingo = D) */
const WD_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function dayLabel(d: Date): string {
  return WD_SHORT[d.getDay()]
}

function monthShortLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  if (!m || m < 1 || m > 12) return ym
  return `${names[m - 1]}/${String(y).slice(2)}`
}

function bucket(key: string, label: string, answered: number, correct: number): PerformanceBucket {
  return {
    key,
    label,
    answered,
    correct,
    accuracyPct: answered > 0 ? Math.round((correct / answered) * 100) : null,
  }
}

export function getPerformanceBuckets(period: PerformancePeriod): PerformanceBucket[] {
  const store = readStore()
  const getDay = (iso: string) => store.days[iso] ?? { answered: 0, correct: 0 }

  const today = new Date()
  today.setHours(12, 0, 0, 0)

  if (period === 'week') {
    const out: PerformanceBucket[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = dateISO(d)
      const v = getDay(iso)
      out.push(bucket(iso, dayLabel(d), v.answered, v.correct))
    }
    return out
  }

  if (period === 'month') {
    const out: PerformanceBucket[] = []
    for (let w = 3; w >= 0; w--) {
      let a = 0
      let c = 0
      for (let dOff = 0; dOff < 7; dOff++) {
        const d = new Date(today)
        d.setDate(d.getDate() - (w * 7 + dOff))
        const v = getDay(dateISO(d))
        a += v.answered
        c += v.correct
      }
      const label = w === 0 ? 'Atual' : `−${w} sem`
      out.push(bucket(`roll-w${w}`, label, a, c))
    }
    /* w vai de 3 → 0: mais antiga à esquerda, semana atual à direita */
    return out
  }

  // all — por mês civil, desde o primeiro dia com dado até hoje (máx. 12 meses)
  const keys = Object.keys(store.days)
    .filter((k) => store.days[k].answered > 0)
    .sort()
  if (keys.length === 0) return []

  const first = new Date(keys[0] + 'T12:00:00')
  const end = new Date(today)
  const months: string[] = []
  const cur = new Date(first.getFullYear(), first.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= endMonth && months.length < 12) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }

  return months.map((ym) => {
    let a = 0
    let c = 0
    const [yy, mm] = ym.split('-').map(Number)
    const lastDay = new Date(yy, mm, 0).getDate()
    for (let day = 1; day <= lastDay; day++) {
      const iso = `${yy}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const v = getDay(iso)
      a += v.answered
      c += v.correct
    }
    return bucket(ym, monthShortLabel(ym), a, c)
  })
}
