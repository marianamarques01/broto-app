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

const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Marca 401 emitido no cliente (sessão ainda não lida do storage) — não deve disparar signOut. */
const CLIENT_NO_SESSION = '__clientNoSession'

function isClientSessionNotReady401(e: ApiError): boolean {
  const b = e.body
  return !!(b && typeof b === 'object' && CLIENT_NO_SESSION in b)
}

function functionsBaseUrl(): string {
  const u = import.meta.env.VITE_SUPABASE_URL
  if (typeof u !== 'string' || !u.trim()) {
    throw new ApiError(
      'Defina VITE_SUPABASE_URL em apps/web/.env (veja .env.example). Sem isso o app não alcança as Edge Functions.',
      0,
      { error: 'missing_supabase_url' },
    )
  }
  return `${u.replace(/\/$/, '')}/functions/v1`
}

/** Firefox: DOMException "NetworkError"; Chrome: TypeError "Failed to fetch" — em geral rede ou CORS. */
function isLikelyBrowserNetworkFailure(e: unknown): boolean {
  if (e instanceof TypeError && /fetch|network|abort/i.test(e.message)) return true
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'NetworkError') {
    return true
  }
  const msg = e instanceof Error ? e.message : String(e)
  return /NetworkError when attempting|Failed to fetch|Load failed|Network request failed|ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(
    msg,
  )
}

async function invokeOnce<T>(path: string, options: InvokeOptions): Promise<T> {
  const fnName = pathToFunctionName(path)
  const method = options.method ?? 'POST'
  const functionsUrl = functionsBaseUrl()

  /** After refreshSession(), force this session on the next fetch (avoids stale getSession). */
  let sessionOverride: Session | null = null

  async function resolveAccessToken(): Promise<string> {
    if (sessionOverride) {
      const t = sessionOverride.access_token
      sessionOverride = null
      if (t) return t
    }
    // Várias chamadas em paralelo logo após o login podem rodar antes do persist da sessão no storage.
    const maxAttempts = 6
    for (let i = 0; i < maxAttempts; i++) {
      let {
        data: { session },
      } = await supabase.auth.getSession()
      let token = session?.access_token
      if (!token) {
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session?.access_token) {
          token = data.session.access_token
        }
      }
      if (token) return token
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 80))
      }
    }
    throw new ApiError('Não autenticado', 401, {
      error: 'Não autenticado',
      [CLIENT_NO_SESSION]: true,
    })
  }

  const executeFetch = async () => {
    const token = await resolveAccessToken()

    const body = mergeParamsIntoBody(options.body, options.params)

    const res = await fetch(`${functionsUrl}/${fnName}`, {
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
      let msg = extractErrorMessage(data, res.status)
      if (res.status === 401 && /invalid jwt/i.test(msg)) {
        msg =
          'Invalid JWT: as Edge Functions precisam estar publicadas com verify_jwt desligado (tokens ES256 do Auth). Use `supabase functions deploy --no-verify-jwt` ou o arquivo supabase/config.toml do repositório, depois faça deploy de novo.'
      }
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

      // Só deslogar em 401 confirmado pela Edge (JWT inválido/expirado), não na corrida pós-login.
      if (e.status === 401 && !isClientSessionNotReady401(e)) {
        await supabase.auth.signOut().catch(() => {})
        window.location.href = '/login'
      }
      throw e
    }

    if (isLikelyBrowserNetworkFailure(e)) {
      const raw = e instanceof Error ? e.message : String(e)
      console.error('[api-client]', fnName, 'rede/cors', raw)
      throw new ApiError(
        'Não foi possível conectar ao Supabase. Verifique a internet. Em desenvolvimento, no Supabase (Edge Functions → Secrets), defina ALLOWED_ORIGINS com a origem exata do app, por exemplo http://localhost:5173 (inclua a porta). Em produção, inclua a URL do site. Confirme se a função foi publicada (ex.: practice-session-create) e se VITE_SUPABASE_URL está correta.',
        0,
        { error: 'network_or_cors', detail: raw },
      )
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
