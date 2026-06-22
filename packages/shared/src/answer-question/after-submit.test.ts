import { describe, it, expect, vi } from 'vitest'
import { runAfterAnswerSubmitted } from './after-submit'

describe('runAfterAnswerSubmitted', () => {
  it('refreshes pet and progress caches', async () => {
    const order: string[] = []
    const refreshPet = vi.fn(() => {
      order.push('pet')
    })
    const refreshProgress = vi.fn(() => {
      order.push('progress')
    })

    await runAfterAnswerSubmitted(
      { questionId: 'q1', isCorrect: true, areaKey: 'matematica' },
      { refreshPet, refreshProgress },
    )

    expect(order).toEqual(['pet', 'progress'])
  })
})
