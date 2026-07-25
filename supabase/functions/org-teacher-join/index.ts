import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireUser,
} from '../_shared/authz.ts'
import { findOrganizationByTeacherInviteCode } from '../_shared/broto-onboarding-staff.ts'
import type {
  OrgTeacherJoinRequest,
  OrgTeacherJoinResponse,
} from '@broto/shared/types/institutional-onboarding.ts'

const MAX_CODE_LENGTH = 32

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
    const { user } = authResult.data

    const body = (await req.json()) as OrgTeacherJoinRequest
    const inviteCode = body.inviteCode?.trim().toUpperCase() ?? ''

    if (!inviteCode) {
      return json(400, { error: 'inviteCode é obrigatório' }, cors)
    }
    if (inviteCode.length > MAX_CODE_LENGTH) {
      return json(400, { error: 'inviteCode inválido' }, cors)
    }

    const supabaseAdmin = createServiceRoleClientUnsafe()
    const org = await findOrganizationByTeacherInviteCode(supabaseAdmin, inviteCode)

    if (!org) {
      return json(404, { error: 'Código de convite inválido ou expirado' }, cors)
    }

    const { data: existing } = await supabaseAdmin
      .from('organization_memberships')
      .select('id, status, role')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .maybeSingle()

    if (!existing) {
      const { error: insertErr } = await supabaseAdmin.from('organization_memberships').insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'teacher',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      if (insertErr) {
        console.error('[org-teacher-join] insert membership:', insertErr)
        return json(500, { error: 'Falha ao vincular professor' }, cors)
      }
    } else if (existing.status !== 'active') {
      const { error: updateErr } = await supabaseAdmin
        .from('organization_memberships')
        .update({
          role: 'teacher',
          status: 'active',
          left_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (updateErr) {
        console.error('[org-teacher-join] reactivate membership:', updateErr)
        return json(500, { error: 'Falha ao reativar vínculo' }, cors)
      }
    } else if (existing.role === 'student') {
      const { error: promoteErr } = await supabaseAdmin
        .from('organization_memberships')
        .update({ role: 'teacher', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (promoteErr) {
        console.error('[org-teacher-join] promote membership:', promoteErr)
        return json(500, { error: 'Falha ao promover para professor' }, cors)
      }
    }
    // org_admin/owner/teacher ativo: mantém role existente

    await supabaseAdmin.from('users').update({ current_organization_id: org.id }).eq('id', user.id)

    const payload: OrgTeacherJoinResponse = {
      success: true,
      organizationId: org.id,
      organizationName: org.name,
    }

    return json(200, payload, cors)
  } catch (err) {
    console.error('[org-teacher-join]', err)
    return json(500, { error: String(err) }, cors)
  }
})
