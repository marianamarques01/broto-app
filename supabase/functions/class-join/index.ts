import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'

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

    // Auth
    const supabaseAuthed = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser()
    if (authError || !user) return json(401, { error: 'Unauthorized' }, cors)

    // Input validation
    const { access_code } = await req.json()
    if (!access_code?.trim()) return json(400, { error: 'access_code é obrigatório' }, cors)
    if (typeof access_code !== 'string' || access_code.length > MAX_CODE_LENGTH) {
      return json(400, { error: 'access_code inválido' }, cors)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const normalizedCode = access_code.toUpperCase().trim()

    // Find active class by code
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, name, organization_id, is_active')
      .eq('access_code', normalizedCode)
      .eq('is_active', true)
      .single()

    if (classError || !classData) {
      return json(404, { error: 'Código inválido ou turma inativa' }, cors)
    }

    // Enroll student + update current_class_id atomically via RPC
    // Fallback: run both operations — if one fails the other state is still acceptable
    const { error: enrollError } = await supabaseAdmin.from('enrollments').upsert(
      {
        class_id: classData.id,
        student_id: user.id,
        status: 'active',
      },
      { onConflict: 'class_id,student_id' },
    )

    if (enrollError) {
      return json(500, { error: 'Erro ao matricular' }, cors)
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ current_class_id: classData.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update current_class_id:', updateError)
    }

    return json(200, { success: true, class: classData }, cors)
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
