import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'

const MAX_CODE_LENGTH = 20

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    // Auth — validates JWT and returns authenticated user
    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    // Input validation
    const { access_code } = await req.json()
    if (!access_code?.trim()) return json(400, { error: 'access_code é obrigatório' }, cors)
    if (typeof access_code !== 'string' || access_code.length > MAX_CODE_LENGTH) {
      return json(400, { error: 'access_code inválido' }, cors)
    }

    // Transactional class join via RPC — all-or-nothing:
    // validates class → creates/reactivates membership → creates/reactivates enrollment → updates context
    const supabaseAdmin = createServiceRoleClientUnsafe()
    const { data, error: rpcError } = await supabaseAdmin.rpc('rpc_class_join', {
      p_user_id: user.id,
      p_access_code: access_code,
    })

    if (rpcError) {
      const hint = (rpcError as Record<string, unknown>).hint ?? ''
      if (hint === 'INVALID_INPUT') return json(400, { error: rpcError.message }, cors)
      if (hint === 'CLASS_NOT_FOUND') return json(404, { error: rpcError.message }, cors)
      if (hint === 'USER_NOT_FOUND') return json(404, { error: rpcError.message }, cors)
      if (hint === 'CLASS_NO_ORG') return json(500, { error: rpcError.message }, cors)
      console.error('[class-join] rpc error:', rpcError)
      return json(500, { error: 'Erro ao entrar na turma' }, cors)
    }

    return json(200, { success: true, class: data }, cors)
  } catch (err) {
    console.error('[class-join]', err)
    return json(500, { error: String(err) }, cors)
  }
})
