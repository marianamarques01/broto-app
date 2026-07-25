import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireUser,
} from '../_shared/authz.ts'
import { requireBrotoOnboardingStaff } from '../_shared/broto-onboarding-staff.ts'
import { generateClassCode } from '@broto/shared/utils/class-code.ts'
import { appendSlugSuffix, slugifyOrganizationName } from '@broto/shared/utils/org-slug.ts'
import type {
  InstitutionType,
  OrgOnboardCreateRequest,
  OrgOnboardCreateResponse,
} from '@broto/shared/types/institutional-onboarding.ts'

const INSTITUTION_TYPES: InstitutionType[] = ['escola_privada', 'cursinho', 'outro']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_CONFIG = {
  mascot_name: 'Broto',
  primary_color: '#4CAF50',
  features: {
    chat: true,
    flashcards: true,
    mind_map: true,
    routine: true,
    audio_overview: false,
  },
}

function randomTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 24)
}

async function resolveUniqueSlug(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  name: string,
): Promise<string> {
  const base = slugifyOrganizationName(name)
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = appendSlugSuffix(base, attempt)
    const { data } = await admin.from('organizations').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function ensureOrgAdminMembership(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  organizationId: string,
  userId: string,
  invitedBy: string | null,
): Promise<void> {
  const { data: existing } = await admin
    .from('organization_memberships')
    .select('id, status, role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!existing) {
    await admin.from('organization_memberships').insert({
      user_id: userId,
      organization_id: organizationId,
      role: 'org_admin',
      status: 'active',
      invited_by: invitedBy,
      joined_at: new Date().toISOString(),
    })
    return
  }

  if (existing.status !== 'active' || existing.role !== 'org_admin') {
    await admin
      .from('organization_memberships')
      .update({
        role: 'org_admin',
        status: 'active',
        left_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  }
}

async function resolveCoordinatorUserId(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  email: string,
): Promise<{ userId: string | null; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: existing, error: lookupErr } = await admin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lookupErr) return { userId: null, error: 'Erro ao buscar coordenador' }
  if (existing?.id) return { userId: existing.id as string }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: randomTempPassword(),
    email_confirm: true,
  })

  if (createErr) {
    return { userId: null, error: createErr.message }
  }

  return { userId: created.user?.id ?? null }
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
      return json(
        authResult.error.status,
        { error: legacyUnauthorizedMessage(authResult.error.message) },
        cors,
      )
    }
    const { user } = authResult.data
    const supabaseAdmin = createServiceRoleClientUnsafe()

    const staff = await requireBrotoOnboardingStaff(supabaseAdmin, user.id)
    if (staff.error) {
      return json(staff.error.status, { error: staff.error.message }, cors)
    }

    const body = (await req.json()) as OrgOnboardCreateRequest
    const name = body.name?.trim() ?? ''
    const institutionType = body.institutionType
    const coordinatorEmail = body.coordinatorEmail?.trim().toLowerCase() ?? ''
    const createDefaultClass = body.createDefaultClass !== false

    if (name.length < 2) {
      return json(400, { error: 'Nome da instituição é obrigatório (mín. 2 caracteres)' }, cors)
    }
    if (!INSTITUTION_TYPES.includes(institutionType)) {
      return json(400, { error: 'institutionType inválido' }, cors)
    }
    if (coordinatorEmail && !EMAIL_RE.test(coordinatorEmail)) {
      return json(400, { error: 'E-mail do coordenador inválido' }, cors)
    }

    const slug = await resolveUniqueSlug(supabaseAdmin, name)
    const teacherInviteCode = generateClassCode()

    const config = {
      ...DEFAULT_CONFIG,
      institution_type: institutionType,
      teacher_invite_code: teacherInviteCode,
    }

    const { data: orgRow, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        is_public: false,
        owner_id: user.id,
        config,
      })
      .select('id, name, slug')
      .single()

    if (orgErr || !orgRow) {
      console.error('[org-onboard-create] insert org:', orgErr)
      return json(500, { error: 'Falha ao criar organização' }, cors)
    }

    const organizationId = orgRow.id as string

    await ensureOrgAdminMembership(supabaseAdmin, organizationId, user.id, null)

    if (coordinatorEmail) {
      const coord = await resolveCoordinatorUserId(supabaseAdmin, coordinatorEmail)
      if (!coord.userId) {
        return json(400, { error: coord.error ?? 'Não foi possível criar coordenador' }, cors)
      }
      await ensureOrgAdminMembership(supabaseAdmin, organizationId, coord.userId, user.id)
    }

    let defaultClassAccessCode: string | undefined

    if (createDefaultClass) {
      defaultClassAccessCode = generateClassCode()
      const { error: classErr } = await supabaseAdmin.from('classes').insert({
        organization_id: organizationId,
        name: 'Turma 1',
        description: 'Turma inicial criada no onboarding',
        access_code: defaultClassAccessCode,
        created_by: user.id,
        is_active: true,
      })

      if (classErr) {
        console.error('[org-onboard-create] insert class:', classErr)
        return json(500, { error: 'Organização criada, mas falha ao criar turma padrão' }, cors)
      }
    }

    const payload: OrgOnboardCreateResponse = {
      success: true,
      organizationId,
      organizationName: orgRow.name as string,
      slug: orgRow.slug as string,
      teacherInviteCode,
      defaultClassAccessCode,
    }

    return json(200, payload, cors)
  } catch (err) {
    console.error('[org-onboard-create]', err)
    return json(500, { error: String(err) }, cors)
  }
})
