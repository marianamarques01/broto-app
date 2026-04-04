/**
 * Shared API client core — ApiError, pathToFunctionName, and types.
 * Platform-specific `invoke` implementations live in each app.
 */

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

export interface InvokeOptions {
  method?: HttpMethod
  body?: Record<string, unknown>
  params?: Record<string, string | number | undefined>
}

/**
 * Converts an `/api/foo/bar` style path to a Supabase Edge Function name `foo-bar`.
 * If the path doesn't start with `/api/`, it is returned unchanged.
 */
export function pathToFunctionName(path: string): string {
  if (!path.startsWith('/api/')) return path
  return path.replace(/^\/api\//, '').replace(/\//g, '-')
}

/**
 * Merge `params` into the body as a `_query` string — shared convention
 * used by both web (fetch) and mobile (supabase.functions.invoke).
 */
export function mergeParamsIntoBody(
  body: Record<string, unknown> | undefined,
  params: Record<string, string | number | undefined> | undefined,
): Record<string, unknown> | undefined {
  if (!params) return body
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v))
  }
  const query = search.toString()
  if (!query) return body
  return { ...(body ?? {}), _query: query }
}

/**
 * Extract a human-readable error message from a parsed response body.
 */
export function extractErrorMessage(data: unknown, fallbackStatus: number): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.error === 'string') return d.error
    if (typeof d.message === 'string') return d.message
    if (typeof d.msg === 'string') return d.msg
  }
  return `Erro ${fallbackStatus}`
}
