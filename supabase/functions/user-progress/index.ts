import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedServiceRoleClient } from '../_shared/database.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { computeUserProgressPayload } from '../_shared/user-progress-aggregate-from-answers.ts'
import { legacyUnauthorizedMessage, requireUser } from '../_shared/authz.ts'

const AREA_ORDER: { value: string; label: string }[] = [
  { value: 'linguagens', label: 'Linguagens' },
  { value: 'ciencias-humanas', label: 'Ciencias Humanas' },
  { value: 'ciencias-natureza', label: 'Ciencias da Natureza' },
  { value: 'matematica', label: 'Matematica' },
]

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
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data

    const supabaseAdmin = createTypedServiceRoleClient()

    const payload = await computeUserProgressPayload(supabaseAdmin, user.id, AREA_ORDER)
    return json(200, payload, cors)
  } catch (err) {
    console.error('[user-progress]', err)
    return json(500, { error: String(err) }, cors)
  }
})
