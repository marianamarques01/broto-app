import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  requireUser,
  requireClassAccess,
  createServiceRoleClientUnsafe,
} from '../_shared/authz.ts'

const SERVICE_URL = Deno.env.get('NOTEBOOKLM_SERVICE_URL')!
const SERVICE_SECRET =
  Deno.env.get('SERVICE_SECRET') ?? Deno.env.get('NOTEBOOKLM_INTERNAL_SECRET') ?? ''

const INDEX_TIMEOUT_MS = 55_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(SERVICE_SECRET ? { Authorization: `Bearer ${SERVICE_SECRET}` } : {}),
  }
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

    // ---- 1. Authentication (mandatory) ----
    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    // ---- 2. Input validation ----
    const { material_id, class_id } = await req.json()

    if (!material_id || !class_id) {
      return json(400, { error: 'material_id e class_id são obrigatórios' }, cors)
    }
    if (!UUID_RE.test(material_id) || !UUID_RE.test(class_id)) {
      return json(400, { error: 'IDs devem ser UUIDs válidos' }, cors)
    }

    // ---- 3. Authorization: user must be teacher+ in the class's organization ----
    const adminClient = createServiceRoleClientUnsafe()
    const classAccessResult = await requireClassAccess(adminClient, user.id, class_id, 'teacher')
    if (classAccessResult.error) {
      return json(
        classAccessResult.error.status,
        { error: classAccessResult.error.message },
        cors,
      )
    }
    const { classData } = classAccessResult.data

    // ---- 4. Fetch material and verify cross-tenant isolation ----
    const { data: material, error: matError } = await adminClient
      .from('materials')
      .select('title, type, source_url, class_id, organization_id')
      .eq('id', material_id)
      .single()

    if (matError || !material) {
      return json(404, { error: 'Material não encontrado' }, cors)
    }

    // Belt-and-suspenders: material must belong to the authorized class AND same org
    if (material.class_id !== class_id) {
      console.error(
        '[material-index] cross-tenant attempt: material.class_id',
        material.class_id,
        '!== requested class_id',
        class_id,
        'by user',
        user.id,
      )
      return json(403, { error: 'Material não pertence à turma informada' }, cors)
    }
    if (material.organization_id !== classData.organization_id) {
      console.error(
        '[material-index] org mismatch: material.organization_id',
        material.organization_id,
        '!== class.organization_id',
        classData.organization_id,
        'by user',
        user.id,
      )
      return json(403, { error: 'Material não pertence à organização da turma' }, cors)
    }

    // ---- 5. Authorized — proceed with indexing ----

    // Mark as indexing
    await adminClient.from('materials').update({ index_status: 'indexing' }).eq('id', material_id)

    // Fetch class notebook state
    const { data: cls } = await adminClient
      .from('classes')
      .select('notebook_id, notebook_status, name')
      .eq('id', class_id)
      .single()

    if (!cls) {
      await adminClient
        .from('materials')
        .update({ index_status: 'failed' })
        .eq('id', material_id)
      return json(404, { error: 'Turma não encontrada' }, cors)
    }

    // Create notebook if class doesn't have one yet
    if (!cls.notebook_id) {
      const createRes = await fetch(`${SERVICE_URL}/notebook/create`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ class_id, class_name: cls.name }),
      })

      if (!createRes.ok) {
        await adminClient
          .from('materials')
          .update({ index_status: 'failed' })
          .eq('id', material_id)
        return json(500, { error: 'Erro ao criar notebook' }, cors)
      }

      const { notebook_id } = await createRes.json()
      await adminClient
        .from('classes')
        .update({ notebook_id, notebook_status: 'indexing' })
        .eq('id', class_id)
    }

    // Build indexing payload
    const sourcePayload: Record<string, string> = { class_id }

    if (material.type === 'text') {
      sourcePayload.source_type = 'text'
      sourcePayload.text = material.source_url
      sourcePayload.title = material.title
    } else {
      sourcePayload.source_type = 'url'
      sourcePayload.url = material.source_url
    }

    // Send for indexing with timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), INDEX_TIMEOUT_MS)

    try {
      const indexRes = await fetch(`${SERVICE_URL}/notebook/add-source`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify(sourcePayload),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!indexRes.ok) {
        await adminClient
          .from('materials')
          .update({ index_status: 'failed' })
          .eq('id', material_id)
        return json(500, { error: 'Erro ao indexar' }, cors)
      }

      await adminClient
        .from('materials')
        .update({ index_status: 'indexed' })
        .eq('id', material_id)
      await adminClient
        .from('classes')
        .update({ notebook_status: 'ready' })
        .eq('id', class_id)

      return json(200, { success: true }, cors)
    } catch (err) {
      clearTimeout(timer)

      if (err instanceof DOMException && err.name === 'AbortError') {
        // Timeout — mark as pending (not indexed) so it can be retried
        await adminClient
          .from('materials')
          .update({ index_status: 'pending' })
          .eq('id', material_id)

        return json(
          202,
          {
            success: false,
            error: 'Timeout — indexação pode estar em andamento. Material voltou para pendente.',
          },
          cors,
        )
      }
      throw err
    }
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
