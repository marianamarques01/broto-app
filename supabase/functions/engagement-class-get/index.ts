import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireClassAccess,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import {
  computeAndPersistClassSnapshot,
  loadActiveFollowUps,
  loadLatestClassSnapshot,
} from '../_shared/engagement-snapshot-core.ts'
import { parseClassSnapshotFromRow } from '@broto/shared/engagement/compute-engagement-snapshot.ts'
import type { EngagementClassGetResponse } from '@broto/shared/types/engagement.ts'

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
    const classId = url.searchParams.get('classId')?.trim() ?? ''

    if (!classId || !isValidUuid(classId)) {
      return json(400, { error: 'classId inválido' }, cors)
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

    const access = await requireClassAccess(supabaseAdmin, user.id, classId, 'teacher')
    if (access.error) {
      return json(access.error.status, { error: access.error.message }, cors)
    }

    let computedInline = false
    let snapshotRow = await loadLatestClassSnapshot(supabaseAdmin, classId)

    if (!snapshotRow) {
      computedInline = true
      await computeAndPersistClassSnapshot(
        supabaseAdmin,
        access.data!.classData,
        new Date().toISOString(),
      )
      snapshotRow = await loadLatestClassSnapshot(supabaseAdmin, classId)
    }

    const followUpRows = await loadActiveFollowUps(supabaseAdmin, classId)

    const payload: EngagementClassGetResponse = {
      snapshot: snapshotRow
        ? parseClassSnapshotFromRow(snapshotRow as Parameters<typeof parseClassSnapshotFromRow>[0])
        : null,
      computedInline,
      followUps: followUpRows.map((row) => ({
        studentId: row.student_id as string,
        note: (row.note as string | null) ?? null,
        markedBy: row.marked_by as string,
        createdAt: row.created_at as string,
      })),
    }

    return json(200, payload, cors)
  } catch (err) {
    console.error('[engagement-class-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
