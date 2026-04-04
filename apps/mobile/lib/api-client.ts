import { createClient } from '@/lib/supabase/client'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { router } from 'expo-router'
import {
  ApiError,
  pathToFunctionName,
  mergeParamsIntoBody,
  extractErrorMessage,
  withExponentialBackoff,
  withJwtRefreshRetry,
  type HttpMethod,
  type InvokeOptions,
} from '@broto/shared'

export { ApiError } from '@broto/shared'

/** Single pipeline for 401: dedupes parallel failures without resetting mid-flight. */
let unauthorizedPipeline: Promise<void> | null = null

function scheduleUnauthorizedRedirect(): void {
  unauthorizedPipeline ??= (async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut().catch(() => {})
      router.replace('/(auth)/login')
    } finally {
      unauthorizedPipeline = null
    }
  })()
}

function isEdgeFunction401(e: unknown): boolean {
  return (
    e instanceof FunctionsHttpError && !!e.context && (e.context as Response).status === 401
  )
}

async function invokeOnce<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const supabase = createClient()

  const buildInvokeOptions = () => {
    const invokeOpts: { method?: HttpMethod; body?: Record<string, unknown> } = {}
    if (options.method) invokeOpts.method = options.method
    const merged = mergeParamsIntoBody(options.body, options.params)
    if (merged !== undefined) invokeOpts.body = merged
    return invokeOpts
  }

  try {
    return await withJwtRefreshRetry(
      async () => {
        const { data, error } = await supabase.functions.invoke(fnName, buildInvokeOptions())
        if (error) throw error
        return data as T
      },
      async () => {
        const { data, error } = await supabase.auth.refreshSession()
        return !error && !!data.session
      },
      isEdgeFunction401,
    )
  } catch (e) {
    if (e instanceof FunctionsHttpError && e.context) {
      const res = e.context as Response
      const resBody = await res.json().catch(() => ({}))
      const msg = extractErrorMessage(resBody, res.status)
      if (res.status === 401) {
        scheduleUnauthorizedRedirect()
      }
      throw new ApiError(msg, res.status, resBody)
    }
    if (e instanceof ApiError) throw e
    throw new ApiError(e instanceof Error ? e.message : 'Erro na requisição', 500, e)
  }
}

function invoke<T>(path: string, options: InvokeOptions): Promise<T> {
  return withExponentialBackoff(() => invokeOnce<T>(path, options))
}

export const api = {
  async get<T>(path: string): Promise<T> {
    return invoke<T>(path, { method: 'GET' })
  },

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return invoke<T>(path, { method: 'POST', body })
  },

  async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return invoke<T>(path, { method: 'PATCH', body })
  },

  async getWithParams<T>(
    path: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    return invoke<T>(path, { method: 'GET', params })
  },
}
