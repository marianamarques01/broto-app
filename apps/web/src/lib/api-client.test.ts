import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSession = vi.fn()
const refreshSession = vi.fn()
const signOut = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      refreshSession: (...args: unknown[]) => refreshSession(...args),
      signOut: (...args: unknown[]) => signOut(...args),
    },
  },
}))

import { api, ApiError } from './api-client'

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('api-client', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let locationHref: string

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    getSession.mockResolvedValue({
      data: { session: { access_token: 'user-jwt' } },
    })
    refreshSession.mockResolvedValue({
      data: { session: { access_token: 'refreshed-jwt' } },
      error: null,
    })
    signOut.mockResolvedValue({ error: null })
    locationHref = 'http://localhost:5173/home'
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'http://localhost:5173',
        get href() {
          return locationHref
        },
        set href(value: string) {
          locationHref = value
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('post: retorna JSON em sucesso', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'u1' }))

    await expect(api.post('/api/user/me')).resolves.toEqual({ id: 'u1' })
  })

  it('post: chama Edge Function com JWT do usuário', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))

    await api.post('/api/answer/question', { questionId: 'q1' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/answer-question',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer user-jwt',
          apikey: 'test-anon-key',
        }),
        body: JSON.stringify({ questionId: 'q1' }),
      }),
    )
  })

  it('postPublic: usa anon key como Bearer', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))

    await api.postPublic('/api/auth/signup', { email: 'a@b.com' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/auth-signup',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-anon-key',
        }),
      }),
    )
    expect(getSession).not.toHaveBeenCalled()
  })

  it('get: envia GET sem body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { pets: [] }))

    await api.get('/api/pet/me')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/pet-me',
      expect.objectContaining({ method: 'GET', body: undefined }),
    )
  })

  it('patch: envia PATCH com body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))

    await api.patch('/api/pet/me', { nome: 'Broto' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/pet-me',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ nome: 'Broto' }),
      }),
    )
  })

  it('getWithParams: inclui _query no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [] }))

    await api.getWithParams('/api/user/progress', { period: 'week' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/user-progress',
      expect.objectContaining({
        body: JSON.stringify({ _query: 'period=week' }),
      }),
    )
  })

  it('401 da Edge: refresh e retenta com sucesso', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await expect(api.post('/api/user/me')).resolves.toEqual({ ok: true })

    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(signOut).not.toHaveBeenCalled()
  })

  it('401 sem sessão local: não desloga (corrida pós-login)', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'no session' },
    })

    await expect(api.post('/api/user/me')).rejects.toMatchObject({
      status: 401,
      body: expect.objectContaining({ __clientNoSession: true }),
    })
    expect(signOut).not.toHaveBeenCalled()
    expect(locationHref).toBe('http://localhost:5173/home')
  })

  it('401 confirmado pela Edge: signOut e redirect /login', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'JWT expired' }))
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'refresh failed' },
    })

    await expect(api.post('/api/user/me')).rejects.toBeInstanceOf(ApiError)
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(locationHref).toBe('/login')
  })

  it('403 da Edge: não desloga', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Forbidden' }))

    await expect(api.post('/api/user/me')).rejects.toMatchObject({ status: 403 })
    expect(signOut).not.toHaveBeenCalled()
  })

  it('falha de rede: ApiError network_or_cors', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(api.post('/api/user/me')).rejects.toMatchObject({
      status: 0,
      body: expect.objectContaining({ error: 'network_or_cors' }),
    })
  })

  it('invalid jwt: mensagem orienta deploy --no-verify-jwt', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Invalid JWT' }))

    await expect(api.post('/api/user/me')).rejects.toMatchObject({
      message: expect.stringContaining('--no-verify-jwt'),
    })
  })
})
