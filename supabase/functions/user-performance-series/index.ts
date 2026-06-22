import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedServiceRoleClient } from '../_shared/database.ts'
import { parsePerformanceSeriesBody } from '../_shared/edge-api-types.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import type { UserQuestionAnswerRow } from '../../database.types.ts'
import { legacyUnauthorizedMessage, requireUser } from '../_shared/authz.ts'

type PerformancePeriod = 'week' | 'month' | 'all'

interface PerformanceBucket {
  key: string
  label: string
  answered: number
  correct: number
  accuracyPct: number | null
}

const WD_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function dayLabelUtc(d: Date): string {
  return WD_SHORT[d.getUTCDay()]
}

function dateISOUtc(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

function buildByDayMap(
  rows: { created_at: string; acertou: boolean }[],
): Map<string, { answered: number; correct: number }> {
  const byDay = new Map<string, { answered: number; correct: number }>()
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    const cur = byDay.get(day) ?? { answered: 0, correct: 0 }
    cur.answered += 1
    if (r.acertou) cur.correct += 1
    byDay.set(day, cur)
  }
  return byDay
}

function daysRecord(
  byDay: Map<string, { answered: number; correct: number }>,
): Record<string, { answered: number; correct: number }> {
  return Object.fromEntries(byDay.entries())
}

function aggregateRows(
  byDay: Map<string, { answered: number; correct: number }>,
  period: PerformancePeriod,
): PerformanceBucket[] {
  const today = new Date()
  const todayNoon = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0, 0),
  )

  if (period === 'week') {
    const out: PerformanceBucket[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayNoon)
      d.setUTCDate(d.getUTCDate() - i)
      const iso = dateISOUtc(d)
      const v = byDay.get(iso) ?? { answered: 0, correct: 0 }
      out.push(bucket(iso, dayLabelUtc(d), v.answered, v.correct))
    }
    return out
  }

  if (period === 'month') {
    const out: PerformanceBucket[] = []
    for (let w = 3; w >= 0; w--) {
      let a = 0
      let c = 0
      for (let dOff = 0; dOff < 7; dOff++) {
        const d = new Date(todayNoon)
        d.setUTCDate(d.getUTCDate() - (w * 7 + dOff))
        const iso = dateISOUtc(d)
        const v = byDay.get(iso) ?? { answered: 0, correct: 0 }
        a += v.answered
        c += v.correct
      }
      const label = w === 0 ? 'Atual' : `−${w} sem`
      out.push(bucket(`roll-w${w}`, label, a, c))
    }
    return out
  }

  const keys = [...byDay.keys()].filter((k) => byDay.get(k)!.answered > 0).sort()
  if (keys.length === 0) return []

  const first = new Date(keys[0] + 'T12:00:00Z')
  const end = new Date(todayNoon)
  const months: string[] = []
  const cur = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1, 12, 0, 0, 0))
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1, 12, 0, 0, 0))
  while (cur <= endMonth && months.length < 12) {
    months.push(`${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`)
    cur.setUTCMonth(cur.getUTCMonth() + 1)
  }

  return months.map((ym) => {
    let a = 0
    let corr = 0
    const [yy, mm] = ym.split('-').map(Number)
    const lastDay = new Date(Date.UTC(yy, mm, 0)).getUTCDate()
    for (let day = 1; day <= lastDay; day++) {
      const iso = `${yy}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const v = byDay.get(iso) ?? { answered: 0, correct: 0 }
      a += v.answered
      corr += v.correct
    }
    return bucket(ym, monthShortLabel(ym), a, corr)
  })
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data

    const { period } = parsePerformanceSeriesBody(await req.json().catch(() => null))

    const admin = createTypedServiceRoleClient()

    const today = new Date()
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0),
    )
    let fetchFrom: Date
    if (period === 'week') {
      fetchFrom = new Date(start)
      fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 6)
    } else if (period === 'month') {
      fetchFrom = new Date(start)
      fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 27)
    } else {
      fetchFrom = new Date(start)
      fetchFrom.setUTCFullYear(fetchFrom.getUTCFullYear() - 2)
    }

    const { data: rows, error } = await admin
      .from('user_question_answers')
      .select('created_at, acertou')
      .eq('user_id', user.id)
      .gte('created_at', fetchFrom.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('user-performance-series:', error)
      return json(500, { error: error.message }, cors)
    }

    const list = (rows ?? []) as Pick<UserQuestionAnswerRow, 'created_at' | 'acertou'>[]
    const byDay = buildByDayMap(list)
    const buckets = aggregateRows(byDay, period)
    const days = daysRecord(byDay)

    return json(200, { period, buckets, days }, cors)
  } catch (err) {
    console.error('user-performance-series:', err)
    return json(500, { error: String(err) }, cors)
  }
})
