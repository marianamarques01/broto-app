import { describe, it, expect, vi } from 'vitest'
import { runAfterAnswerSubmitted } from './after-submit'

describe('runAfterAnswerSubmitted', () => {
  it('runs bump, then increment, then refresh hooks', async () => {
    const order: string[] = []
    const bumpPerformanceDay = vi.fn(async () => {
      order.push('bump')
    })
    const incrementDailyAreaAnswer = vi.fn(async () => {
      order.push('increment')
    })
    const refreshPet = vi.fn(() => {
      order.push('pet')
    })
    const refreshProgress = vi.fn(() => {
      order.push('progress')
    })

    await runAfterAnswerSubmitted(
      { questionId: 'q1', isCorrect: true, areaKey: 'matematica' },
      {
        bumpPerformanceDay,
        incrementDailyAreaAnswer,
        refreshPet,
        refreshProgress,
      },
    )

    expect(order).toEqual(['bump', 'increment', 'pet', 'progress'])
    expect(incrementDailyAreaAnswer).toHaveBeenCalledWith({
      areaKey: 'matematica',
      isCorrect: true,
    })
  })

  it('skips increment when areaKey is missing', async () => {
    const incrementDailyAreaAnswer = vi.fn()
    await runAfterAnswerSubmitted(
      { questionId: 'q1', isCorrect: false },
      {
        incrementDailyAreaAnswer,
        refreshPet: vi.fn(),
        refreshProgress: vi.fn(),
      },
    )
    expect(incrementDailyAreaAnswer).not.toHaveBeenCalled()
  })

  it('surfaces increment failures', async () => {
    await expect(
      runAfterAnswerSubmitted(
        { questionId: 'q1', isCorrect: true, areaKey: 'x' },
        {
          incrementDailyAreaAnswer: async () => {
            throw new Error('storage failed')
          },
          refreshPet: vi.fn(),
          refreshProgress: vi.fn(),
        },
      ),
    ).rejects.toThrow('storage failed')
  })
})
