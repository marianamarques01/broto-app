/** Mescla query string da URL com `_query` no body (convenção do api-client web). */
export async function parseRequestQueryParams(req: Request): Promise<URLSearchParams> {
  const params = new URL(req.url).searchParams

  if (req.method !== 'GET') return params

  try {
    const body = await req.clone().json()
    if (body && typeof body === 'object' && '_query' in body) {
      const raw = (body as { _query?: unknown })._query
      if (typeof raw === 'string' && raw.length > 0) {
        const fromBody = new URLSearchParams(raw)
        fromBody.forEach((value, key) => {
          if (!params.has(key)) params.set(key, value)
        })
      }
    }
  } catch {
    // GET sem body — ok
  }

  return params
}
