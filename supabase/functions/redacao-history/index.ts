import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { buildRedacaoEvolucaoPayload } from '../_shared/redacao-evolucao.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const userId = authResult.data.user.id

    const admin = createServiceRoleClientUnsafe()

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('meta_redacao, nivel_redacao')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('[redacao-history] profile:', profileError)
      return json(500, { error: 'Erro ao carregar perfil' }, cors)
    }

    const payload = await buildRedacaoEvolucaoPayload(admin, userId, profile)

    return json(200, payload, cors)
  } catch (err) {
    console.error('[redacao-history]', err)
    return json(500, { error: String(err) }, cors)
  }
})
