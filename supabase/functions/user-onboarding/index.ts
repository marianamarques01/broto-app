import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { deriveStrongWeakAreas } from '../_shared/onboarding-cold-start.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { requireUser, createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { isRecord, parseUserOnboardingBody } from '../_shared/edge-api-types.ts'

const HORARIO_SET = new Set(['manha', 'tarde', 'noite'])

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}

function isMissingPetsNomeError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase()
  if (!m.includes('nome') || !m.includes('pets')) return false
  if (m.includes('schema cache')) return true
  if (m.includes('does not exist') || m.includes('undefined column')) return true
  return false
}

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
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const raw = parseUserOnboardingBody(await req.json().catch(() => null))
    if (!raw) {
      return json(400, { error: 'JSON inválido' }, cors)
    }

    const faculdade = typeof raw.faculdade === 'string' ? raw.faculdade.trim().slice(0, 500) : ''
    const curso = typeof raw.curso === 'string' ? raw.curso.trim().slice(0, 200) : ''
    const metaNota = clampInt(
      typeof raw.metaNota === 'number' ? raw.metaNota : Number(raw.metaNota),
      0,
      1000,
    )
    const horasPorDia = clampInt(
      typeof raw.horasPorDia === 'number' ? raw.horasPorDia : Number(raw.horasPorDia),
      1,
      12,
    )

    const niveis: Record<string, string | null> = {}
    if (raw.niveis && isRecord(raw.niveis)) {
      for (const [k, v] of Object.entries(raw.niveis)) {
        const key = String(k).slice(0, 64)
        if (v === null || v === undefined) {
          niveis[key] = null
        } else if (v === 'iniciante' || v === 'intermediario' || v === 'avancado') {
          niveis[key] = v
        }
      }
    }

    const horarios: string[] = []
    if (Array.isArray(raw.horarios)) {
      for (const h of raw.horarios) {
        if (typeof h === 'string' && HORARIO_SET.has(h) && !horarios.includes(h)) {
          horarios.push(h)
        }
      }
    }

    const brotoNomeRaw = typeof raw.brotoNome === 'string' ? raw.brotoNome.trim().slice(0, 32) : ''
    const brotoNome = brotoNomeRaw.length > 0 ? brotoNomeRaw : 'Broto'

    const onboardingProfile = {
      faculdade,
      curso,
      metaNota,
      niveis,
      horarios,
    }

    const { strongAreas, weakAreas } = deriveStrongWeakAreas(niveis)

    const admin = createServiceRoleClientUnsafe()
    const { data: existingRow } = await admin
      .from('users')
      .select('data_enem')
      .eq('id', user.id)
      .maybeSingle()
    const examDate =
      existingRow?.data_enem != null ? String(existingRow.data_enem).slice(0, 10) : null

    const { error } = await admin
      .from('users')
      .update({
        horas_disponiveis_por_dia: horasPorDia,
        hours_per_day: horasPorDia,
        target_score: metaNota > 0 ? metaNota : null,
        exam_date: examDate,
        strong_areas: strongAreas,
        weak_areas: weakAreas,
        onboarding_profile: onboardingProfile,
        onboarding_done: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_routine_banner_shown: false,
      })
      .eq('id', user.id)

    if (error) {
      console.error('[user-onboarding]', error)
      return json(500, { error: 'Não foi possível salvar o onboarding' }, cors)
    }

    const { data: petRow, error: petSelErr } = await admin
      .from('pets')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (petSelErr) {
      console.error('[user-onboarding] pet select', petSelErr)
    } else if (petRow) {
      const { error: petUpdErr } = await admin
        .from('pets')
        .update({ nome: brotoNome })
        .eq('user_id', user.id)
      if (petUpdErr) {
        if (isMissingPetsNomeError(petUpdErr)) {
          console.error('[user-onboarding] coluna pets.nome ausente', petUpdErr)
          return json(
            500,
            {
              error:
                'Coluna pets.nome ausente no banco. Aplique a migração pets_broto_nome (ou supabase db push) e tente de novo.',
            },
            cors,
          )
        }
        console.error('[user-onboarding] pet update', petUpdErr)
        return json(500, { error: 'Não foi possível salvar o nome do Broto' }, cors)
      }
    } else {
      let petInsErr = (
        await admin.from('pets').insert({
          user_id: user.id,
          nome: brotoNome,
        })
      ).error
      if (petInsErr && isMissingPetsNomeError(petInsErr)) {
        petInsErr = (await admin.from('pets').insert({ user_id: user.id })).error
      }
      if (petInsErr) {
        if (isMissingPetsNomeError(petInsErr)) {
          console.error('[user-onboarding] coluna pets.nome ausente (insert)', petInsErr)
          return json(
            500,
            {
              error:
                'Coluna pets.nome ausente no banco. Aplique a migração pets_broto_nome (ou supabase db push) e tente de novo.',
            },
            cors,
          )
        }
        console.error('[user-onboarding] pet insert', petInsErr)
        return json(500, { error: 'Não foi possível criar o registro do Broto' }, cors)
      }
    }

    return json(200, { ok: true, onboardingProfile, brotoNome }, cors)
  } catch (err) {
    console.error('[user-onboarding]', err)
    return json(500, { error: String(err) }, cors)
  }
})
