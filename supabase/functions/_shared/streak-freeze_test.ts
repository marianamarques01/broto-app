import { assertEquals } from 'jsr:@std/assert@1'
import { planStreakUpdate } from './streak-freeze.ts'

const base = {
  streak: 6,
  lastStudyDate: '2026-06-20',
  streakFreezes: 0,
  totalFreezesEarned: 0,
}

Deno.test('streak-freeze: 7 dias consecutivos ganha 1 freeze', () => {
  const plan = planStreakUpdate(
    { ...base, streak: 6, lastStudyDate: '2026-06-21', streakFreezes: 0 },
    '2026-06-22',
  )
  assertEquals(plan.shouldUpdate, true)
  assertEquals(plan.newStreak, 7)
  assertEquals(plan.newStreakFreezes, 1)
  assertEquals(plan.newTotalFreezesEarned, 1)
  assertEquals(plan.consumeFreeze, false)
})

Deno.test('streak-freeze: 1 dia perdido com freeze disponível mantém streak', () => {
  const plan = planStreakUpdate(
    { streak: 10, lastStudyDate: '2026-06-20', streakFreezes: 2, totalFreezesEarned: 2 },
    '2026-06-22',
  )
  assertEquals(plan.shouldUpdate, true)
  assertEquals(plan.newStreak, 11)
  assertEquals(plan.consumeFreeze, true)
  assertEquals(plan.newStreakFreezes, 1)
  assertEquals(plan.freezeNumber, 1)
})

Deno.test('streak-freeze: 1 dia perdido sem freeze reseta streak', () => {
  const plan = planStreakUpdate(
    { streak: 10, lastStudyDate: '2026-06-20', streakFreezes: 0, totalFreezesEarned: 0 },
    '2026-06-22',
  )
  assertEquals(plan.shouldUpdate, true)
  assertEquals(plan.newStreak, 1)
  assertEquals(plan.consumeFreeze, false)
  assertEquals(plan.newStreakFreezes, 0)
})

Deno.test('streak-freeze: com 3 freezes não acumula 4º ao completar 7 dias', () => {
  const plan = planStreakUpdate(
    { streak: 6, lastStudyDate: '2026-06-21', streakFreezes: 3, totalFreezesEarned: 5 },
    '2026-06-22',
  )
  assertEquals(plan.newStreak, 7)
  assertEquals(plan.newStreakFreezes, 3)
  assertEquals(plan.newTotalFreezesEarned, 5)
})
