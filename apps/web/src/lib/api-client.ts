import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import {
  ApiError,
  pathToFunctionName,
  mergeParamsIntoBody,
  extractErrorMessage,
  withExponentialBackoff,
  withJwtRefreshRetry,
  type InvokeOptions,
} from '@broto/shared'

export { ApiError } from '@broto/shared'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function invokeOnce<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const method = options.method ?? 'POST'

  /** After refreshSession(), force this session on the next fetch (avoids stale getSession). */
  let sessionOverride: Session | null = null

  async function resolveAccessToken(): Promise<string> {
    if (sessionOverride) {
      const t = sessionOverride.access_token
      sessionOverride = null
      if (t) return t
    }
    let {
      data: { session },
    } = await supabase.auth.getSession()
    let token = session?.access_token
    if (!token) {
      const { data, error } = await supabase.auth.refreshSession()
      if (!error && data.session?.access_token) {
        session = data.session
        token = data.session.access_token
      }
    }
    if (!token) {
      throw new ApiError('Não autenticado', 401, { error: 'Não autenticado' })
    }
    return token
  }

  const executeFetch = async () => {
    const token = await resolveAccessToken()

    const body = mergeParamsIntoBody(options.body, options.params)

    const res = await fetch(`${FUNCTIONS_URL}/${fnName}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: API_KEY,
        // Never send anon key as Bearer — Edge getUser() would reject (401 on answer-question, etc.).
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const msg = extractErrorMessage(data, res.status)
      throw new ApiError(msg, res.status, data)
    }

    return data as T
  }

  try {
    return await withJwtRefreshRetry(
      executeFetch,
      async () => {
        const { data, error } = await supabase.auth.refreshSession()
        if (error || !data.session?.access_token) return false
        sessionOverride = data.session
        return true
      },
      (e) => e instanceof ApiError && e.status === 401,
    )
  } catch (e) {
    if (e instanceof ApiError) {
      console.error('[api-client]', fnName, e.status, e.message)

      if (e.status === 401) {
        await supabase.auth.signOut().catch(() => {})
        window.location.href = '/login'
      }
    }
    throw e
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
