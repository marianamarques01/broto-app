import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  requireUser,
  resolveActiveContext,
} from '../_shared/authz.ts'
import { parseRequestQueryParams } from '../_shared/parse-request-query.ts'
import { mapRepertorioRow } from '../_shared/redacao-repertorio-map.ts'
import {
  isValidCompetencia,
  isValidEixoTematico,
  isValidUuid,
} from '../_shared/redacao-repertorio-validation.ts'
import type { RedacaoRepertoriosRow } from '../../database.types.ts'

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
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const { user } = authResult.data

    const query = await parseRequestQueryParams(req)
    const eixoFilter = query.get('eixo_tematico')
    const competenciaFilter = query.get('competencia_alvo')
    const classIdParam = query.get('class_id')

    if (eixoFilter && !isValidEixoTematico(eixoFilter)) {
      return json(400, { error: 'eixo_tematico inválido' }, cors)
    }
    if (competenciaFilter && !isValidCompetencia(competenciaFilter)) {
      return json(400, { error: 'competencia_alvo inválida' }, cors)
    }
    if (classIdParam && !isValidUuid(classIdParam)) {
      return json(400, { error: 'class_id deve ser UUID válido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()
    const contextResult = await resolveActiveContext(admin, user.id)
    if (contextResult.error) {
      return json(contextResult.error.status, { error: contextResult.error.message }, cors)
    }

    const ctx = contextResult.data
    if (!ctx.isValid || !ctx.organizationId) {
      return json(403, { error: 'Organização ativa não configurada' }, cors)
    }

    const effectiveClassId = classIdParam ?? ctx.classId

    let query = admin
      .from('redacao_repertorios')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .eq('ativo', true)
      .order('updated_at', { ascending: false })

    if (effectiveClassId) {
      query = query.or(`class_id.is.null,class_id.eq.${effectiveClassId}`)
    } else {
      query = query.is('class_id', null)
    }

    if (eixoFilter) {
      query = query.or(`eixo_tematico.is.null,eixo_tematico.eq.${eixoFilter}`)
    }

    if (competenciaFilter) {
      query = query.or(`competencia_alvo.is.null,competencia_alvo.eq.${competenciaFilter}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[redacao-repertorio-list] select:', error)
      return json(500, { error: 'Erro ao listar repertórios' }, cors)
    }

    const repertorios = (data as RedacaoRepertoriosRow[]).map(mapRepertorioRow)
    return json(200, { repertorios }, cors)
  } catch (err) {
    console.error('[redacao-repertorio-list]', err)
    return json(500, { error: String(err) }, cors)
  }
})
