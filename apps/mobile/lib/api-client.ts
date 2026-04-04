import { createClient } from '@/lib/supabase/client'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { router } from 'expo-router'
import {
  ApiError,
  pathToFunctionName,
  mergeParamsIntoBody,
  extractErrorMessage,
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

async function invoke<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const supabase = createClient()

  const invokeOptions: { method?: HttpMethod; body?: Record<string, unknown> } = {}
  if (options.method) invokeOptions.method = options.method

  const body = mergeParamsIntoBody(options.body, options.params)
  if (body !== undefined) invokeOptions.body = body

  try {
    const { data, error } = await supabase.functions.invoke(fnName, invokeOptions)

    if (error) {
      throw error
    }

    return data as T
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
