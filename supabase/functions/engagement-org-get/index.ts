import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireOrgStaffOrBrotoAdmin,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import {
  loadLatestOrgSnapshot,
  refreshEngagementSnapshots,
} from '../_shared/engagement-snapshot-core.ts'
import { parseOrgSnapshotFromRow } from '@broto/shared/engagement/compute-engagement-snapshot.ts'
import type { EngagementOrgGetResponse } from '@broto/shared/types/engagement.ts'

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
    const organizationId = url.searchParams.get('organizationId')?.trim() ?? ''

    if (!organizationId || !isValidUuid(organizationId)) {
      return json(400, { error: 'organizationId inválido' }, cors)
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

    const membership = await requireOrgStaffOrBrotoAdmin(
      supabaseAdmin,
      user.id,
      organizationId,
      'org_admin',
    )
    if (membership.error) {
      return json(membership.error.status, { error: membership.error.message }, cors)
    }

    let computedInline = false
    let snapshotRow = await loadLatestOrgSnapshot(supabaseAdmin, organizationId)

    if (!snapshotRow) {
      computedInline = true
      await refreshEngagementSnapshots(supabaseAdmin, organizationId)
      snapshotRow = await loadLatestOrgSnapshot(supabaseAdmin, organizationId)
    }

    const payload: EngagementOrgGetResponse = {
      snapshot: snapshotRow
        ? parseOrgSnapshotFromRow(snapshotRow as Parameters<typeof parseOrgSnapshotFromRow>[0])
        : null,
      computedInline,
    }

    return json(200, payload, cors)
  } catch (err) {
    console.error('[engagement-org-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
