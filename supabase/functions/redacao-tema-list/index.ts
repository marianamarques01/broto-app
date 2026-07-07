import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  requireUser,
  resolveActiveContext,
} from '../_shared/authz.ts'
import { mapTemaRow } from '../_shared/redacao-tema-map.ts'
import { parseRequestQueryParams } from '../_shared/parse-request-query.ts'
import { isValidEixoTematico } from '../_shared/redacao-repertorio-validation.ts'
import type { RedacaoTemasRow } from '../../database.types.ts'

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

    const query = await parseRequestQueryParams(req)
    const eixoFilter = query.get('eixo_tematico')
    if (eixoFilter && !isValidEixoTematico(eixoFilter)) {
      return json(400, { error: 'eixo_tematico inválido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()
    const contextResult = await resolveActiveContext(admin, authResult.data.user.id)
    if (contextResult.error) {
      return json(contextResult.error.status, { error: contextResult.error.message }, cors)
    }

    const ctx = contextResult.data
    if (!ctx.isValid || !ctx.organizationId) {
      return json(403, { error: 'Organização ativa não configurada' }, cors)
    }

    let globalQuery = admin
      .from('redacao_temas')
      .select('*')
      .is('organization_id', null)
      .eq('ativo', true)

    let orgQuery = admin
      .from('redacao_temas')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .eq('ativo', true)

    if (eixoFilter) {
      globalQuery = globalQuery.eq('eixo_tematico', eixoFilter)
      orgQuery = orgQuery.eq('eixo_tematico', eixoFilter)
    }

    const [globalRes, orgRes] = await Promise.all([globalQuery, orgQuery])

    if (globalRes.error) {
      console.error('[redacao-tema-list] global:', globalRes.error)
      return json(500, { error: 'Erro ao listar temas' }, cors)
    }
    if (orgRes.error) {
      console.error('[redacao-tema-list] org:', orgRes.error)
      return json(500, { error: 'Erro ao listar temas' }, cors)
    }

    const byId = new Map<string, RedacaoTemasRow>()
    for (const row of [...(globalRes.data ?? []), ...(orgRes.data ?? [])] as RedacaoTemasRow[]) {
      byId.set(row.id, row)
    }

    const temas = [...byId.values()]
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
      .map(mapTemaRow)

    return json(200, { temas }, cors)
  } catch (err) {
    console.error('[redacao-tema-list]', err)
    return json(500, { error: String(err) }, cors)
  }
})
