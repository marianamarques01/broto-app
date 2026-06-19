import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedAnonClient, createTypedServiceRoleClient } from '../_shared/database.ts'
import { isRecord } from '../_shared/edge-api-types.ts'
import type { UsersRow } from '../../database.types.ts'
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

    const supabaseAuthed = createTypedAnonClient(authHeader)

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser()
    if (authError || !user) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAdmin = createTypedServiceRoleClient()

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

    const profileRow = data as Pick<
      UsersRow,
      | 'id'
      | 'nome'
      | 'email'
      | 'image'
      | 'onboarding_done'
      | 'data_enem'
      | 'horas_disponiveis_por_dia'
      | 'onboarding_profile'
    >

    const dataEnem = profileRow.data_enem != null ? String(profileRow.data_enem).slice(0, 10) : null

    const rawProfile = profileRow.onboarding_profile
    let onboardingProfile: unknown = null
    if (rawProfile && isRecord(rawProfile)) {
      const p = rawProfile
      const faculdade = typeof p.faculdade === 'string' ? p.faculdade : ''
      const curso = typeof p.curso === 'string' ? p.curso : ''
      const metaNota = typeof p.metaNota === 'number' ? p.metaNota : Number(p.metaNota) || 0
      const horarios = Array.isArray(p.horarios)
        ? (p.horarios as unknown[]).filter((h): h is string => typeof h === 'string')
        : []
      let niveis: Record<string, string | null> = {}
      if (p.niveis && isRecord(p.niveis)) {
        niveis = Object.fromEntries(
          Object.entries(p.niveis).map(([k, v]) => [
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
        id: profileRow.id,
        nome: profileRow.nome ?? '',
        email: profileRow.email ?? '',
        image: profileRow.image,
        onboardingDone: Boolean(profileRow.onboarding_done),
        dataEnem,
        horasDisponiveisPorDia: profileRow.horas_disponiveis_por_dia ?? 2,
        onboardingProfile,
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
