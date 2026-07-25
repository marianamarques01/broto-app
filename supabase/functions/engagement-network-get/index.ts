import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireNetworkAdmin,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import {
  buildNetworkEngagementResponse,
  parseNetworkFilters,
} from '../_shared/engagement-network-core.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' }, cors)

    const url = new URL(req.url)
    const networkOrgId = url.searchParams.get('networkOrgId')?.trim() ?? ''

    if (!networkOrgId || !isValidUuid(networkOrgId)) {
      return json(400, { error: 'networkOrgId inválido' }, cors)
    }

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data
    const supabaseAdmin = createServiceRoleClientUnsafe()

    const networkAuth = await requireNetworkAdmin(supabaseAdmin, user.id, networkOrgId)
    if (networkAuth.error) {
      return json(networkAuth.error.status, { error: networkAuth.error.message }, cors)
    }

    const filters = parseNetworkFilters({
      regional: url.searchParams.get('regional'),
      grade: url.searchParams.get('grade'),
      periodDays: url.searchParams.get('periodDays'),
    })

    const payload = await buildNetworkEngagementResponse(supabaseAdmin, networkOrgId, filters)

    return json(200, payload, cors)
  } catch (err) {
    console.error('[engagement-network-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
