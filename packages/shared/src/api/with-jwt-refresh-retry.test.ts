import { describe, it, expect, vi } from 'vitest'
import { withJwtRefreshRetry } from './with-jwt-refresh-retry'

class E401 extends Error {
  readonly status = 401
}

describe('withJwtRefreshRetry', () => {
  it('retries once after refresh when first attempt returns 401', async () => {
    let n = 0
    const attempt = vi.fn(async () => {
      n++
      if (n === 1) throw new E401()
      return 'ok'
    })
    const refresh = vi.fn(async () => true)

    await expect(withJwtRefreshRetry(attempt, refresh, (e) => e instanceof E401)).resolves.toBe(
      'ok',
    )

    expect(attempt).toHaveBeenCalledTimes(2)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does not retry when refresh returns false', async () => {
    const attempt = vi.fn(async () => {
      throw new E401()
    })
    const refresh = vi.fn(async () => false)

    await expect(
      withJwtRefreshRetry(attempt, refresh, (e) => e instanceof E401),
    ).rejects.toBeInstanceOf(E401)

    expect(attempt).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does not retry non-401 errors', async () => {
    const attempt = vi.fn(async () => {
      throw new Error('nope')
    })
    const refresh = vi.fn(async () => true)

    await expect(withJwtRefreshRetry(attempt, refresh, (e) => e instanceof E401)).rejects.toThrow(
      'nope',
    )

    expect(attempt).toHaveBeenCalledTimes(1)
    expect(refresh).not.toHaveBeenCalled()
  })
})
