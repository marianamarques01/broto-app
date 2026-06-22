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

  it('usa UTC, não timezone local — 21h BRT ainda é "hoje" no streak', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T21:00:00-03:00'))
    const now = new Date()
    expect(now.getDay()).not.toBe(now.getUTCDay())
    expect(hojeIdx()).toBe(expectedHojeIdxFromUtc(now))
  })
})
