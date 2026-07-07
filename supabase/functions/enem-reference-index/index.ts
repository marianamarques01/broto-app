import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import {
  CARTILHA_DEFAULT_TITLE,
  CARTILHA_DOCUMENT_SLUG,
  indexEnemReferenceFromPdfBuffer,
  indexEnemReferenceFromUrl,
} from '../_shared/enem-reference-index.ts'
import { fetchBytesForUrl } from '../_shared/material-storage-fetch.ts'

const SLUG_RE = /^[a-z0-9-]{3,80}$/

async function requireOrgAdminOrOwner(
  adminClient: ReturnType<typeof createServiceRoleClientUnsafe>,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { data, error } = await adminClient
    .from('organization_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('role', ['org_admin', 'owner'])
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[enem-reference-index] membership check:', error)
    return { ok: false, status: 500, message: 'Erro ao verificar permissões' }
  }
  if (!data) {
    return { ok: false, status: 403, message: 'Acesso restrito a administradores da organização' }
  }
  return { ok: true }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const adminClient = createServiceRoleClientUnsafe()
    const adminCheck = await requireOrgAdminOrOwner(adminClient, user.id)
    if (!adminCheck.ok) {
      return json(adminCheck.status, { error: adminCheck.message }, cors)
    }

    const contentType = req.headers.get('Content-Type') ?? ''
    const isPdfUpload = contentType.includes('application/pdf')

    let slug = CARTILHA_DOCUMENT_SLUG
    let title = CARTILHA_DEFAULT_TITLE
    let version = '2025.1'
    let sourceUrl: string | null = null

    if (!isPdfUpload) {
      const body = await req.json().catch(() => ({}))
      slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : slug
      title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : title
      version =
        typeof body.version === 'string' && body.version.trim() ? body.version.trim() : version
      sourceUrl =
        typeof body.source_url === 'string' && body.source_url.trim()
          ? body.source_url.trim()
          : null
    }

    if (!SLUG_RE.test(slug)) {
      return json(400, { error: 'slug inválido — use letras minúsculas, números e hífens' }, cors)
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return json(500, { error: 'OPENAI_API_KEY não configurada' }, cors)
    }

    const input = { slug, title, version, source_url: sourceUrl }

    let result
    if (sourceUrl) {
      result = await indexEnemReferenceFromUrl(
        adminClient,
        { ...input, source_url: sourceUrl },
        openAiKey,
        (url) => fetchBytesForUrl(url, adminClient),
      )
    } else if (isPdfUpload) {
      const buffer = await req.arrayBuffer()
      if (buffer.byteLength === 0) {
        return json(400, { error: 'Corpo PDF vazio' }, cors)
      }
      result = await indexEnemReferenceFromPdfBuffer(adminClient, input, buffer, openAiKey)
    } else {
      return json(
        400,
        {
          error:
            'Informe source_url (PDF) no body JSON ou envie o PDF com Content-Type: application/pdf',
        },
        cors,
      )
    }

    if (!result.ok) {
      return json(422, { error: result.error, slug }, cors)
    }

    return json(
      200,
      {
        success: true,
        slug,
        document_id: result.document_id,
        indexed: result.indexed,
        cost_estimate_usd: result.cost_estimate_usd,
      },
      cors,
    )
  } catch (err) {
    console.error('[enem-reference-index]', err)
    return json(500, { error: String(err) }, cors)
  }
})
