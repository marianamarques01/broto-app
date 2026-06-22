import { describe, it, expect, vi, afterEach } from 'vitest'
import { todayUtcISO, yesterdayUtcISO, startOfUtcDayIso } from './today-utc-iso'

describe('todayUtcISO', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns UTC calendar date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T23:30:00-03:00'))
    expect(todayUtcISO()).toBe('2026-06-22')
  })

  it('yesterdayUtcISO is one UTC day before todayUtcISO', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T12:00:00Z'))
    expect(yesterdayUtcISO()).toBe('2026-06-20')
  })

  it('startOfUtcDayIso is midnight UTC for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T15:45:00Z'))
    expect(startOfUtcDayIso()).toBe('2026-06-21T00:00:00.000Z')
  })
})
