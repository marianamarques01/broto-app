import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTypedServiceRoleClient } from '../_shared/database.ts'
import { isRecord } from '../_shared/edge-api-types.ts'
import type { UsersRow } from '../../database.types.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { legacyUnauthorizedMessage, requireUser } from '../_shared/authz.ts'

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

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, nome, email, image, onboarding_done, data_enem, horas_disponiveis_por_dia, onboarding_profile, hours_per_day, exam_date, target_score, strong_areas, weak_areas, onboarding_routine_banner_shown, onboarding_completed_at',
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
      | 'hours_per_day'
      | 'exam_date'
      | 'target_score'
      | 'strong_areas'
      | 'weak_areas'
      | 'onboarding_routine_banner_shown'
      | 'onboarding_completed_at'
    >

    const dataEnem = profileRow.data_enem != null ? String(profileRow.data_enem).slice(0, 10) : null
    const examDate =
      profileRow.exam_date != null ? String(profileRow.exam_date).slice(0, 10) : dataEnem

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
        hoursPerDay: profileRow.hours_per_day ?? profileRow.horas_disponiveis_por_dia ?? 2,
        examDate,
        targetScore: profileRow.target_score ?? null,
        strongAreas: Array.isArray(profileRow.strong_areas)
          ? profileRow.strong_areas.filter((a): a is string => typeof a === 'string')
          : [],
        weakAreas: Array.isArray(profileRow.weak_areas)
          ? profileRow.weak_areas.filter((a): a is string => typeof a === 'string')
          : [],
        onboardingRoutineBannerShown: Boolean(profileRow.onboarding_routine_banner_shown),
        onboardingCompletedAt: profileRow.onboarding_completed_at ?? null,
        onboardingProfile,
      },
      cors,
    )
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})
