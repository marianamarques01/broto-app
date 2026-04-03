import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'

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

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, nome, email, image, onboarding_done, data_enem, horas_disponiveis_por_dia')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('user-me:', error)
      return json(500, { error: error.message }, cors)
    }
    if (!data) {
      return json(404, { error: 'Perfil não encontrado' }, cors)
    }

    const dataEnem = data.data_enem != null ? String(data.data_enem).slice(0, 10) : null

    return json(
      200,
      {
        id: data.id,
        nome: data.nome ?? '',
        email: data.email ?? '',
        image: data.image,
        onboardingDone: Boolean(data.onboarding_done),
        dataEnem,
        horasDisponiveisPorDia: data.horas_disponiveis_por_dia ?? 2,
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
