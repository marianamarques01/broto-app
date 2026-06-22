import { describe, it, expect, vi, afterEach } from 'vitest'
import { hojeIdx } from './generate-routine'

function expectedHojeIdxFromUtc(date: Date): number {
  const d = date.getUTCDay()
  return d === 0 ? 6 : d - 1
}

describe('hojeIdx', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna índice Seg=0..Dom=6 derivado de getUTCDay()', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-22T12:00:00Z'))
    const now = new Date()
    expect(hojeIdx()).toBe(expectedHojeIdxFromUtc(now))
  })

  it('usa UTC, não timezone local — meia-noite UTC é segunda (idx 0)', () => {
    vi.useFakeTimers()
    // 2026-06-22T00:00:00Z = domingo 21h em BRT; streak/rotina usam dia UTC
    vi.setSystemTime(new Date('2026-06-22T00:00:00Z'))
    const now = new Date()
    expect(hojeIdx()).toBe(0)
    expect(hojeIdx()).toBe(expectedHojeIdxFromUtc(now))
  })
})
