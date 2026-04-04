import { supabase } from './supabase'
import {
  ApiError,
  pathToFunctionName,
  mergeParamsIntoBody,
  extractErrorMessage,
  type InvokeOptions,
} from '@broto/shared'

export { ApiError } from '@broto/shared'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function invoke<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const method = options.method ?? 'POST'

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const body = mergeParamsIntoBody(options.body, options.params)

  const res = await fetch(`${FUNCTIONS_URL}/${fnName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      Authorization: `Bearer ${token ?? API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = extractErrorMessage(data, res.status)
    console.error('[api-client]', fnName, res.status, msg)

    if (res.status === 401) {
      await supabase.auth.signOut().catch(() => {})
      window.location.href = '/login'
    }

    throw new ApiError(msg, res.status, data)
  }

  return data as T
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
