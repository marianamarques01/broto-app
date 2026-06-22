import { assertEquals } from 'jsr:@std/assert@1'
import { todayUtcISO, yesterdayUtcISO, startOfUtcDayIso } from './calendar-day.ts'

Deno.test('calendar-day: paridade UTC com shared', () => {
  const fixed = new Date('2026-06-21T23:30:00-03:00')
  const realDate = Date
  // @ts-expect-error mock Date for test
  globalThis.Date = class extends realDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(fixed.getTime())
      } else {
        // @ts-expect-error spread
        super(...args)
      }
    }
    static override now() {
      return fixed.getTime()
    }
  }

  try {
    assertEquals(todayUtcISO(), '2026-06-22')
    assertEquals(yesterdayUtcISO(), '2026-06-21')
    assertEquals(startOfUtcDayIso(), '2026-06-22T00:00:00.000Z')
  } finally {
    globalThis.Date = realDate
  }
})
