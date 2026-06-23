import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type StorageObjectRef = {
  bucket: string
  path: string
}

const MAX_FETCH_BYTES = 20 * 1024 * 1024
/** Limite de páginas por PDF — evita timeout da edge em livros inteiros. */
export const MAX_PDF_PAGES = 80

/** Extrai bucket/path de URLs public/sign/authenticated do Supabase Storage. */
export function parseSupabaseStorageObjectUrl(url: string): StorageObjectRef | null {
  try {
    const u = new URL(url)
    const marker = '/storage/v1/object/'
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null

    const rest = u.pathname.slice(idx + marker.length)
    const parts = rest.split('/').filter(Boolean)
    if (parts.length < 3) return null

    const access = parts[0]
    if (access !== 'public' && access !== 'sign' && access !== 'authenticated') {
      return null
    }

    const bucket = parts[1]
    const path = decodeURIComponent(parts.slice(2).join('/'))
    if (!bucket || !path) return null

    return { bucket, path }
  } catch {
    return null
  }
}

export async function downloadStorageObject(
  adminClient: SupabaseClient,
  ref: StorageObjectRef,
): Promise<ArrayBuffer> {
  const { data, error } = await adminClient.storage.from(ref.bucket).download(ref.path)
  if (error || !data) {
    throw new Error(
      `Storage download falhou (${ref.bucket}/${ref.path}): ${error?.message ?? 'sem dados'}`,
    )
  }

  const buf = await data.arrayBuffer()
  if (buf.byteLength > MAX_FETCH_BYTES) {
    throw new Error('Arquivo excede limite de 20MB para indexação RAG')
  }

  return buf
}

export async function fetchBytesForUrl(
  url: string,
  adminClient?: SupabaseClient,
): Promise<ArrayBuffer> {
  const storageRef = parseSupabaseStorageObjectUrl(url)
  if (storageRef && adminClient) {
    try {
      return await downloadStorageObject(adminClient, storageRef)
    } catch (err) {
      console.warn('[material-storage-fetch] fallback HTTP após falha no Storage:', err)
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao buscar ${url}`)
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_FETCH_BYTES) {
      throw new Error('Arquivo excede limite de 20MB para indexação RAG')
    }
    return buf
  } finally {
    clearTimeout(timer)
  }
}
