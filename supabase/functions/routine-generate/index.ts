import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { legacyUnauthorizedMessage, requireUser } from '../_shared/authz.ts'
import {
  buildFastApiPayload,
  buildLocalFallbackRoutine,
  fetchFastApiRoutine,
  resolveFastApiServiceUrl,
} from '../_shared/routine-generate.ts'
import type { TopicPerformanceInput } from '../_shared/routine-generate.ts'

const FASTAPI_URL = resolveFastApiServiceUrl(
  Deno.env.get('FASTAPI_URL'),
  Deno.env.get('NOTEBOOKLM_SERVICE_URL'),
)
const SERVICE_SECRET =
  Deno.env.get('SERVICE_SECRET') ?? Deno.env.get('NOTEBOOKLM_INTERNAL_SECRET') ?? ''

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user, supabaseAuthed } = authResult.data

    const { data: performanceRows, error: perfError } = await supabaseAuthed
      .from('topic_performance')
      .select('topico_value, area_key, p_know, accuracy_pct, total_answered')
      .eq('user_id', user.id)

    if (perfError) {
      console.error('[routine-generate] topic_performance:', perfError)
      return json(500, { error: perfError.message }, cors)
    }

    const { data: profile, error: profileError } = await supabaseAuthed
      .from('users')
      .select('hours_per_day, exam_date, target_score, strong_areas, weak_areas')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[routine-generate] users:', profileError)
      return json(500, { error: profileError.message }, cors)
    }

    const performance = (performanceRows ?? []) as TopicPerformanceInput[]
    const hoursPerDay = profile?.hours_per_day ?? 2
    const payload = buildFastApiPayload(user.id, profile, performance)

    let routine = null
    let source: 'fastapi' | 'local_fallback' = 'local_fallback'

    if (FASTAPI_URL) {
      const fastApiRoutine = await fetchFastApiRoutine(FASTAPI_URL, payload, {
        serviceSecret: SERVICE_SECRET,
      })
      if (fastApiRoutine) {
        routine = fastApiRoutine
        source = 'fastapi'
      }
    }

    if (!routine) {
      routine = buildLocalFallbackRoutine(performance, hoursPerDay)
      source = 'local_fallback'
    }

    return json(200, { ...routine, _source: source }, cors)
  } catch (err) {
    console.error('[routine-generate]', err)
    return json(500, { error: String(err) }, cors)
  }
})
