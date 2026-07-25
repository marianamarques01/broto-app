import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
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

const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function functionsBaseUrl(): string {
  const u = import.meta.env.VITE_SUPABASE_URL
  if (typeof u !== 'string' || !u.trim()) {
    throw new ApiError('Defina VITE_SUPABASE_URL em apps/admin/.env', 0, {
      error: 'missing_supabase_url',
    })
  }
  return `${u.replace(/\/$/, '')}/functions/v1`
}

function buildGetQueryString(
  params: Record<string, string | number | undefined> | undefined,
): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return search.toString()
}

function buildFunctionUrl(
  functionsUrl: string,
  fnName: string,
  method: HttpMethod,
  params: Record<string, string | number | undefined> | undefined,
): string {
  const base = `${functionsUrl}/${fnName}`
  if (method !== 'GET') return base
  const query = buildGetQueryString(params)
  return query ? `${base}?${query}` : base
}

async function invokeOnce<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const method = options.method ?? 'POST'
  const functionsUrl = functionsBaseUrl()
  let sessionOverride: Session | null = null

  async function resolveAccessToken(): Promise<string> {
    if (sessionOverride) {
      const t = sessionOverride.access_token
      sessionOverride = null
      if (t) return t
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) return session.access_token
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session?.access_token) {
      throw new ApiError('Não autenticado', 401, { error: 'Não autenticado' })
    }
    return data.session.access_token
  }

  const executeFetch = async () => {
    const token = await resolveAccessToken()
    const requestBody =
      method === 'GET' ? options.body : mergeParamsIntoBody(options.body, options.params)
    const url = buildFunctionUrl(functionsUrl, fnName, method, options.params)

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new ApiError(extractErrorMessage(data, res.status), res.status, data)
    }
    return data as T
  }

  return withJwtRefreshRetry(
    executeFetch,
    async () => {
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session?.access_token) return false
      sessionOverride = data.session
      return true
    },
    (e) => e instanceof ApiError && e.status === 401,
  )
}

function invoke<T>(path: string, options: InvokeOptions): Promise<T> {
  return withExponentialBackoff(() => invokeOnce<T>(path, options))
}

export const api = {
  async getWithParams<T>(
    path: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    return invoke<T>(path, { method: 'GET', params })
  },
  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return invoke<T>(path, { method: 'POST', body })
  },
}
