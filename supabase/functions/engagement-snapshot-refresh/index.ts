import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireOrgStaffOrBrotoAdmin,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import { refreshEngagementSnapshots } from '../_shared/engagement-snapshot-core.ts'

function isServiceRoleRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')?.trim() ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!serviceKey) return false
  return authHeader === `Bearer ${serviceKey}`
}

function isCronSecretRequest(req: Request): boolean {
  const cronSecret = Deno.env.get('ENGAGEMENT_CRON_SECRET')?.trim()
  if (!cronSecret) return false
  const header = req.headers.get('x-engagement-cron-secret')?.trim() ?? ''
  return header.length > 0 && header === cronSecret
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const serverAuth = isServiceRoleRequest(req) || isCronSecretRequest(req)

  try {
    if (req.method === 'OPTIONS') {
      if (!serverAuth && isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: serverAuth ? {} : cors })
    }
    if (!serverAuth && isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organizationId')?.trim() ?? undefined

    if (organizationId && !isValidUuid(organizationId)) {
      return json(400, { error: 'organizationId inválido' }, cors)
    }

    const supabaseAdmin = createServiceRoleClientUnsafe()

    if (!isServiceRoleRequest(req) && !isCronSecretRequest(req)) {
      const authResult = await requireUser(req)
      if (authResult.error) {
        return json(
          authResult.error.status,
          { error: legacyUnauthorizedMessage(authResult.error.message) },
          cors,
        )
      }
      const { user } = authResult.data

      if (!organizationId) {
        return json(400, { error: 'organizationId é obrigatório para refresh manual' }, cors)
      }

      const membership = await requireOrgStaffOrBrotoAdmin(
        supabaseAdmin,
        user.id,
        organizationId,
        'org_admin',
      )
      if (membership.error) {
        return json(membership.error.status, { error: membership.error.message }, cors)
      }
    }

    const result = await refreshEngagementSnapshots(supabaseAdmin, organizationId)

    return json(
      200,
      {
        success: true,
        organizationsProcessed: result.organizationsProcessed,
        classesProcessed: result.classesProcessed,
        computedAt: result.computedAt,
      },
      cors,
    )
  } catch (err) {
    console.error('[engagement-snapshot-refresh]', err)
    return json(500, { error: String(err) }, cors)
  }
})
