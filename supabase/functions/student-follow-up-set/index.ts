import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  legacyUnauthorizedMessage,
  requireClassAccess,
  requireUser,
} from '../_shared/authz.ts'
import { isValidUuid } from '../_shared/uuid-validation.ts'
import type {
  StudentFollowUpSetRequest,
  StudentFollowUpSetResponse,
} from '@broto/shared/types/engagement.ts'

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

    const body = (await req.json()) as StudentFollowUpSetRequest
    const { classId, studentId, action, note } = body

    if (!classId || !isValidUuid(classId)) {
      return json(400, { error: 'classId inválido' }, cors)
    }
    if (!studentId || !isValidUuid(studentId)) {
      return json(400, { error: 'studentId inválido' }, cors)
    }
    if (action !== 'mark' && action !== 'resolve') {
      return json(400, { error: 'action deve ser mark ou resolve' }, cors)
    }

    const supabaseAdmin = createServiceRoleClientUnsafe()
    const access = await requireClassAccess(supabaseAdmin, user.id, classId, 'teacher')
    if (access.error) {
      return json(access.error.status, { error: access.error.message }, cors)
    }

    const organizationId = access.data!.classData.organization_id

    const { data: enrollment, error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle()

    if (enrollErr) {
      return json(500, { error: 'Erro ao verificar matrícula' }, cors)
    }
    if (!enrollment) {
      return json(404, { error: 'Aluno não matriculado nesta turma' }, cors)
    }

    if (action === 'mark') {
      const { data: existing } = await supabaseAdmin
        .from('student_follow_ups')
        .select('id, status')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .maybeSingle()

      if (existing) {
        const payload: StudentFollowUpSetResponse = {
          success: true,
          followUpId: existing.id as string,
          status: 'active',
        }
        return json(200, payload, cors)
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('student_follow_ups')
        .insert({
          organization_id: organizationId,
          class_id: classId,
          student_id: studentId,
          marked_by: user.id,
          note: note?.trim() || null,
          status: 'active',
        })
        .select('id')
        .single()

      if (insertErr) {
        console.error('[student-follow-up-set] insert:', insertErr)
        return json(500, { error: 'Erro ao marcar acompanhamento' }, cors)
      }

      const payload: StudentFollowUpSetResponse = {
        success: true,
        followUpId: inserted.id as string,
        status: 'active',
      }
      return json(200, payload, cors)
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('student_follow_ups')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .select('id')
      .maybeSingle()

    if (updateErr) {
      console.error('[student-follow-up-set] resolve:', updateErr)
      return json(500, { error: 'Erro ao resolver acompanhamento' }, cors)
    }

    if (!updated) {
      return json(404, { error: 'Nenhum acompanhamento ativo encontrado' }, cors)
    }

    const payload: StudentFollowUpSetResponse = {
      success: true,
      followUpId: updated.id as string,
      status: 'resolved',
    }
    return json(200, payload, cors)
  } catch (err) {
    console.error('[student-follow-up-set]', err)
    return json(500, { error: String(err) }, cors)
  }
})
