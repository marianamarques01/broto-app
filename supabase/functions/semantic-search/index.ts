import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, requireClassAccess, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { parseSemanticSearchBody } from '../_shared/edge-api-types.ts'
import { searchMaterialChunks } from '../_shared/semantic-search-core.ts'

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

    const parsed = parseSemanticSearchBody(await req.json().catch(() => null))
    if (!parsed) {
      return json(400, { error: 'query e class_id são obrigatórios' }, cors)
    }
    const { query, class_id, limit, similarity_threshold } = parsed

    if (!UUID_RE.test(class_id)) {
      return json(400, { error: 'class_id deve ser UUID válido' }, cors)
    }

    const adminClient = createServiceRoleClientUnsafe()

    const classAccessResult = await requireClassAccess(adminClient, user.id, class_id, 'student')
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

    const chunks = await searchMaterialChunks(adminClient, {
      query,
      class_id,
      openAiKey,
      limit,
      similarity_threshold,
    })

    return json(200, { chunks, class_id, query }, cors)
  } catch (err) {
    console.error('[semantic-search]', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('Erro na busca semântica')) {
      return json(500, { error: 'Erro na busca semântica' }, cors)
    }
    return json(500, { error: message }, cors)
  }
})
