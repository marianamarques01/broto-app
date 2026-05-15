import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { computeUserProgressPayload } from '../_shared/user-progress-aggregate-from-answers.ts'

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAuthed = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser()
    if (authError || !user) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const payload = await computeUserProgressPayload(supabaseAdmin, user.id, AREA_ORDER)
    return json(200, payload, cors)
  } catch (err) {
    console.error('[user-progress]', err)
    return json(500, { error: String(err) }, cors)
  }
})
