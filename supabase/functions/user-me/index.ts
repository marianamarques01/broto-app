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
      .select(
        'id, nome, email, image, onboarding_done, data_enem, horas_disponiveis_por_dia, onboarding_profile',
      )
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

    const rawProfile = (data as { onboarding_profile?: unknown }).onboarding_profile
    let onboardingProfile: unknown = null
    if (rawProfile && typeof rawProfile === 'object' && !Array.isArray(rawProfile)) {
      const p = rawProfile as Record<string, unknown>
      const faculdade = typeof p.faculdade === 'string' ? p.faculdade : ''
      const curso = typeof p.curso === 'string' ? p.curso : ''
      const metaNota = typeof p.metaNota === 'number' ? p.metaNota : Number(p.metaNota) || 0
      const horarios = Array.isArray(p.horarios)
        ? (p.horarios as unknown[]).filter((h): h is string => typeof h === 'string')
        : []
      let niveis: Record<string, string | null> = {}
      if (p.niveis && typeof p.niveis === 'object' && !Array.isArray(p.niveis)) {
        niveis = Object.fromEntries(
          Object.entries(p.niveis as Record<string, unknown>).map(([k, v]) => [
            k,
            v === null || v === undefined ? null : typeof v === 'string' ? v : null,
          ]),
        )
      }
      onboardingProfile = { faculdade, curso, metaNota, niveis, horarios }
    }

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
        onboardingProfile,
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
