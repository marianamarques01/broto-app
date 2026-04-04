import { ApiError } from './api-client'

export type RetryOptions = {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

const DEFAULT_ATTEMPTS = 3
const DEFAULT_INITIAL_MS = 250
const DEFAULT_MAX_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isLikelyTransientError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 429 || err.status === 502 || err.status === 503 || err.status === 504
  }
  const msg = err instanceof Error ? err.message : String(err)
  return /network|fetch failed|Failed to fetch|timeout|ECONNRESET|ETIMEDOUT|network request failed/i.test(
    msg,
  )
}

/**
 * Retries a function on transient failures (network / 502–504 / 429).
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_ATTEMPTS
  const initialDelayMs = options?.initialDelayMs ?? DEFAULT_INITIAL_MS
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_MS

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (attempt >= maxAttempts) throw e
      const canRetry = options?.shouldRetry
        ? options.shouldRetry(e, attempt)
        : isLikelyTransientError(e)
      if (!canRetry) throw e
      const delay = Math.min(initialDelayMs * 2 ** (attempt - 1) + Math.random() * 80, maxDelayMs)
      await sleep(delay)
    }
  }
  throw lastErr
}
