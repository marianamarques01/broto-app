/**
 * Runs `attempt` up to two times: on the first failure, if `isUnauthorized401(err)` is true
 * and `refreshJwt()` succeeds, the operation is retried once with the new session.
 * Callers map the final error to ApiError / UI handling after this returns or throws.
 */
export async function withJwtRefreshRetry<T>(
  attempt: () => Promise<T>,
  refreshJwt: () => Promise<boolean>,
  isUnauthorized401: (err: unknown) => boolean,
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < 2; i++) {
    try {
      return await attempt()
    } catch (e) {
      lastErr = e
      if (i === 0 && isUnauthorized401(e)) {
        const refreshed = await refreshJwt()
        if (refreshed) continue
      }
      throw e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('JWT refresh retry exhausted')
}
