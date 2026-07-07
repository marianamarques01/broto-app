import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { assertRedacaoAccess } from '../_shared/redacao-access.ts'
import { mapCorrecaoRow, mapRedacaoRow } from '../_shared/redacao-map.ts'
import { mapTemaRow } from '../_shared/redacao-tema-map.ts'
import { isValidUuid } from '../_shared/redacao-repertorio-validation.ts'
import { parseRequestQueryParams } from '../_shared/parse-request-query.ts'
import type { RedacaoCorrecoesRow, RedacaoTemasRow, RedacoesRow } from '../../database.types.ts'

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
    const userId = authResult.data.user.id

    const query = await parseRequestQueryParams(req)
    const redacaoId = query.get('redacao_id')?.trim() ?? ''
    if (!isValidUuid(redacaoId)) {
      return json(400, { error: 'redacao_id deve ser UUID válido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()
    const access = await assertRedacaoAccess(admin, redacaoId, userId)
    if (!access.ok) {
      return json(access.status, { error: access.message }, cors)
    }

    const { data: redacaoRow, error: redacaoError } = await admin
      .from('redacoes')
      .select('*, redacao_temas(*)')
      .eq('id', redacaoId)
      .maybeSingle()

    if (redacaoError) {
      console.error('[redacao-get] redacao:', redacaoError)
      return json(500, { error: 'Erro ao carregar redação' }, cors)
    }
    if (!redacaoRow) {
      return json(404, { error: 'Redação não encontrada' }, cors)
    }

    const row = redacaoRow as RedacoesRow & {
      redacao_temas: RedacaoTemasRow | RedacaoTemasRow[] | null
    }
    const temaRaw = row.redacao_temas
    const temaRow = Array.isArray(temaRaw) ? temaRaw[0] : temaRaw
    if (!temaRow) {
      return json(500, { error: 'Tema da redação não encontrado' }, cors)
    }

    const { data: correcaoRow, error: correcaoError } = await admin
      .from('redacao_correcoes')
      .select('*')
      .eq('redacao_id', redacaoId)
      .maybeSingle()

    if (correcaoError) {
      console.error('[redacao-get] correcao:', correcaoError)
      return json(500, { error: 'Erro ao carregar correção' }, cors)
    }

    return json(
      200,
      {
        redacao: mapRedacaoRow(row),
        tema: mapTemaRow(temaRow),
        correcao: correcaoRow ? mapCorrecaoRow(correcaoRow as RedacaoCorrecoesRow) : null,
      },
      cors,
    )
  } catch (err) {
    console.error('[redacao-get]', err)
    return json(500, { error: String(err) }, cors)
  }
})
