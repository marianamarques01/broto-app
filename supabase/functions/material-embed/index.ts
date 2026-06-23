import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, requireClassAccess, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { persistMaterialEmbeddings } from '../_shared/material-embed-core.ts'
import { parseMaterialEmbedBody } from '../_shared/edge-api-types.ts'
import type { MaterialsRow } from '../../database.types.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return json(500, { error: 'OPENAI_API_KEY não configurada' }, cors)
    }

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const parsed = parseMaterialEmbedBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'material_id, class_id e chunks são obrigatórios' }, cors)
    }
    const { material_id, class_id, chunks } = parsed

    if (!UUID_RE.test(material_id) || !UUID_RE.test(class_id)) {
      return json(400, { error: 'IDs devem ser UUIDs válidos' }, cors)
    }

    const adminClient = createServiceRoleClientUnsafe()

    const classAccessResult = await requireClassAccess(adminClient, user.id, class_id, 'teacher')
    if (classAccessResult.error) {
      return json(classAccessResult.error.status, { error: classAccessResult.error.message }, cors)
    }

    const { data: cls, error: clsError } = await adminClient
      .from('classes')
      .select('rag_enabled')
      .eq('id', class_id)
      .single()

    if (clsError || !cls) {
      return json(404, { error: 'Turma não encontrada' }, cors)
    }

    if (!cls.rag_enabled) {
      return json(403, { error: 'RAG não habilitado para esta turma' }, cors)
    }

    const { data: material, error: matError } = await adminClient
      .from('materials')
      .select('class_id, organization_id')
      .eq('id', material_id)
      .single()

    if (matError || !material) {
      return json(404, { error: 'Material não encontrado' }, cors)
    }

    const materialRow = material as Pick<MaterialsRow, 'class_id' | 'organization_id'>

    if (materialRow.class_id !== class_id) {
      return json(403, { error: 'Material não pertence à turma informada' }, cors)
    }

    const { indexed, cost_estimate_usd } = await persistMaterialEmbeddings(adminClient, {
      material_id,
      class_id,
      organization_id: materialRow.organization_id,
      chunks,
      openAiKey,
    })

    return json(
      200,
      {
        indexed,
        material_id,
        cost_estimate_usd,
      },
      cors,
    )
  } catch (err) {
    console.error('[material-embed]', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('Erro ao persistir embeddings')) {
      return json(500, { error: 'Erro ao persistir embeddings' }, cors)
    }
    return json(500, { error: message }, cors)
  }
})
