import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  assertCorrecaoBlindSemNotasIa,
  buildCalibracaoComparacao,
  computeCalibracaoMetricas,
  stripCorrecaoIaScores,
} from '@broto/shared/redacao/calibracao.ts'
import { getNotaCompetencia } from '@broto/shared/redacao/competencia-labels.ts'
import { REDACAO_COMPETENCIAS } from '@broto/shared/types/redacao.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { requireRedacaoCalibrationStaff } from '../_shared/redacao-calibracao-access.ts'
import {
  parseCalibracaoListLimit,
  parseRedacaoCalibracaoSubmitBody,
} from '../_shared/redacao-calibracao-validation.ts'
import { mapCorrecaoRow, mapRedacaoRow } from '../_shared/redacao-map.ts'
import { mapTemaRow } from '../_shared/redacao-tema-map.ts'
import { isValidUuid } from '../_shared/redacao-repertorio-validation.ts'
import { parseRequestQueryParams } from '../_shared/parse-request-query.ts'
import type {
  RedacaoCorrecoesRow,
  RedacaoRevisoesHumanasRow,
  RedacaoTemasRow,
  RedacoesRow,
} from '../../database.types.ts'

function mapRevisaoRow(row: RedacaoRevisoesHumanasRow) {
  return {
    id: row.id,
    correcao_id: row.correcao_id,
    revisor_id: row.revisor_id,
    nota_humana_i: row.nota_humana_i,
    nota_humana_ii: row.nota_humana_ii,
    nota_humana_iii: row.nota_humana_iii,
    nota_humana_iv: row.nota_humana_iv,
    nota_humana_v: row.nota_humana_v,
    notas_ia_reveladas_em: row.notas_ia_reveladas_em,
    comentario: row.comentario,
    created_at: row.created_at,
  }
}

async function handleList(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  revisorId: string,
  limit: number,
) {
  const { data: correcoes, error } = await admin
    .from('redacao_correcoes')
    .select(
      `
      id,
      redacao_id,
      created_at,
      redacoes!inner (
        id,
        status,
        linha_count,
        created_at,
        redacao_temas (
          titulo,
          eixo_tematico
        )
      )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[redacao-revisao-humana] list:', error)
    return json(500, { error: 'Erro ao listar correções' }, {})
  }

  const correcaoIds = (correcoes ?? []).map((c) => c.id as string)
  const { data: revisoes, error: revError } =
    correcaoIds.length > 0
      ? await admin
          .from('redacao_revisoes_humanas')
          .select('correcao_id, revisor_id, notas_ia_reveladas_em')
          .in('correcao_id', correcaoIds)
      : { data: [], error: null }

  if (revError) {
    console.error('[redacao-revisao-humana] revisoes:', revError)
    return json(500, { error: 'Erro ao carregar revisões' }, {})
  }

  const revisaoByCorrecao = new Map(
    (revisoes ?? []).map((r) => [
      r.correcao_id as string,
      {
        revisor_id: r.revisor_id as string,
        revelada: Boolean(r.notas_ia_reveladas_em),
      },
    ]),
  )

  const items = (correcoes ?? [])
    .filter((row) => {
      const redacao = row.redacoes as { status?: string } | { status?: string }[] | null
      const status = Array.isArray(redacao) ? redacao[0]?.status : redacao?.status
      return status === 'corrigida'
    })
    .map((row) => {
      const redacaoRaw = row.redacoes as
        | (RedacoesRow & { redacao_temas: RedacaoTemasRow | RedacaoTemasRow[] | null })
        | (RedacoesRow & { redacao_temas: RedacaoTemasRow | RedacaoTemasRow[] | null })[]
      const redacao = Array.isArray(redacaoRaw) ? redacaoRaw[0] : redacaoRaw
      const temaRaw = redacao?.redacao_temas
      const tema = Array.isArray(temaRaw) ? temaRaw[0] : temaRaw
      const revisao = revisaoByCorrecao.get(row.id as string)
      const reviewedByMe = revisao?.revisor_id === revisorId && revisao.revelada

      return {
        correcao_id: row.id as string,
        redacao_id: row.redacao_id as string,
        corrigida_em: row.created_at as string,
        linha_count: redacao?.linha_count ?? 0,
        tema_titulo: tema?.titulo ?? '',
        eixo_tematico: tema?.eixo_tematico ?? '',
        revisado: Boolean(revisao?.revelada),
        revisado_por_mim: reviewedByMe,
      }
    })

  return json(200, { items }, {})
}

async function handleGetBlind(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  revisorId: string,
  correcaoId: string,
) {
  const { data: correcaoRow, error: correcaoError } = await admin
    .from('redacao_correcoes')
    .select('*')
    .eq('id', correcaoId)
    .maybeSingle()

  if (correcaoError) {
    console.error('[redacao-revisao-humana] get correcao:', correcaoError)
    return json(500, { error: 'Erro ao carregar correção' }, {})
  }
  if (!correcaoRow) {
    return json(404, { error: 'Correção não encontrada' }, {})
  }

  const correcao = mapCorrecaoRow(correcaoRow as RedacaoCorrecoesRow)

  const { data: redacaoRow, error: redacaoError } = await admin
    .from('redacoes')
    .select('*, redacao_temas(*)')
    .eq('id', correcao.redacao_id)
    .maybeSingle()

  if (redacaoError) {
    console.error('[redacao-revisao-humana] get redacao:', redacaoError)
    return json(500, { error: 'Erro ao carregar redação' }, {})
  }
  if (!redacaoRow) {
    return json(404, { error: 'Redação não encontrada' }, {})
  }

  const row = redacaoRow as RedacoesRow & {
    redacao_temas: RedacaoTemasRow | RedacaoTemasRow[] | null
  }
  const temaRaw = row.redacao_temas
  const temaRow = Array.isArray(temaRaw) ? temaRaw[0] : temaRaw
  if (!temaRow) {
    return json(500, { error: 'Tema não encontrado' }, {})
  }

  const { data: revisaoRow, error: revisaoError } = await admin
    .from('redacao_revisoes_humanas')
    .select('*')
    .eq('correcao_id', correcaoId)
    .eq('revisor_id', revisorId)
    .maybeSingle()

  if (revisaoError) {
    console.error('[redacao-revisao-humana] get revisao:', revisaoError)
    return json(500, { error: 'Erro ao carregar revisão' }, {})
  }

  const revisao = revisaoRow ? mapRevisaoRow(revisaoRow as RedacaoRevisoesHumanasRow) : null
  const iaRevelada = Boolean(revisao?.notas_ia_reveladas_em)

  const blindCorrecao = stripCorrecaoIaScores(correcao)
  if (!assertCorrecaoBlindSemNotasIa(blindCorrecao as unknown as Record<string, unknown>)) {
    console.error('[redacao-revisao-humana] blind leak detected')
    return json(500, { error: 'Erro interno na resposta cega' }, {})
  }

  const response: Record<string, unknown> = {
    redacao: mapRedacaoRow(row),
    tema: mapTemaRow(temaRow),
    correcao: blindCorrecao,
    revisao,
    ia_revelada: iaRevelada,
  }

  if (iaRevelada && revisao) {
    response.comparacao = buildCalibracaoComparacao(correcao, revisao)
    response.correcao_ia = correcao
  }

  return json(200, response, {})
}

async function handleSubmit(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  revisorId: string,
  body: unknown,
) {
  const parsed = parseRedacaoCalibracaoSubmitBody(body)
  if (!parsed.ok) {
    return json(400, { error: parsed.message }, {})
  }

  const { data: correcaoRow, error: correcaoError } = await admin
    .from('redacao_correcoes')
    .select('*')
    .eq('id', parsed.data.correcao_id)
    .maybeSingle()

  if (correcaoError) {
    console.error('[redacao-revisao-humana] submit correcao:', correcaoError)
    return json(500, { error: 'Erro ao carregar correção' }, {})
  }
  if (!correcaoRow) {
    return json(404, { error: 'Correção não encontrada' }, {})
  }

  const now = new Date().toISOString()
  const insertRow = {
    correcao_id: parsed.data.correcao_id,
    revisor_id: revisorId,
    nota_humana_i: parsed.data.nota_humana_i,
    nota_humana_ii: parsed.data.nota_humana_ii,
    nota_humana_iii: parsed.data.nota_humana_iii,
    nota_humana_iv: parsed.data.nota_humana_iv,
    nota_humana_v: parsed.data.nota_humana_v,
    comentario: parsed.data.comentario,
    notas_ia_reveladas_em: now,
  }

  const { data: existing, error: existingError } = await admin
    .from('redacao_revisoes_humanas')
    .select('id, notas_ia_reveladas_em')
    .eq('correcao_id', parsed.data.correcao_id)
    .eq('revisor_id', revisorId)
    .maybeSingle()

  if (existingError) {
    console.error('[redacao-revisao-humana] existing:', existingError)
    return json(500, { error: 'Erro ao verificar revisão existente' }, {})
  }

  if (existing?.notas_ia_reveladas_em) {
    return json(409, { error: 'Revisão já submetida para esta correção' }, {})
  }

  let saved: RedacaoRevisoesHumanasRow | null = null
  if (existing?.id) {
    const { data: updated, error: updateError } = await admin
      .from('redacao_revisoes_humanas')
      .update(insertRow)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (updateError) {
      console.error('[redacao-revisao-humana] update:', updateError)
      return json(500, { error: 'Erro ao salvar revisão' }, {})
    }
    saved = updated as RedacaoRevisoesHumanasRow
  } else {
    const { data: inserted, error: insertError } = await admin
      .from('redacao_revisoes_humanas')
      .insert(insertRow)
      .select('*')
      .single()
    if (insertError) {
      console.error('[redacao-revisao-humana] insert:', insertError)
      return json(500, { error: 'Erro ao salvar revisão' }, {})
    }
    saved = inserted as RedacaoRevisoesHumanasRow
  }

  const correcao = mapCorrecaoRow(correcaoRow as RedacaoCorrecoesRow)
  const revisao = mapRevisaoRow(saved)

  return json(
    200,
    {
      ok: true,
      revisao,
      comparacao: buildCalibracaoComparacao(correcao, revisao),
      correcao_ia: correcao,
    },
    {},
  )
}

async function handleMetrics(admin: ReturnType<typeof createServiceRoleClientUnsafe>) {
  const { data: revisoes, error } = await admin
    .from('redacao_revisoes_humanas')
    .select('*, redacao_correcoes(*)')
    .not('notas_ia_reveladas_em', 'is', null)

  if (error) {
    console.error('[redacao-revisao-humana] metrics:', error)
    return json(500, { error: 'Erro ao calcular métricas' }, {})
  }

  const pares: Array<{
    competencia: (typeof REDACAO_COMPETENCIAS)[number]
    nota_ia: number
    nota_humana: number
  }> = []

  for (const row of revisoes ?? []) {
    const correcaoRaw = row.redacao_correcoes as RedacaoCorrecoesRow | RedacaoCorrecoesRow[] | null
    const correcaoRow = Array.isArray(correcaoRaw) ? correcaoRaw[0] : correcaoRaw
    if (!correcaoRow) continue

    const correcao = mapCorrecaoRow(correcaoRow)
    const revisao = mapRevisaoRow(row as RedacaoRevisoesHumanasRow)

    for (const competencia of REDACAO_COMPETENCIAS) {
      const nota_humana =
        competencia === 'I'
          ? revisao.nota_humana_i
          : competencia === 'II'
            ? revisao.nota_humana_ii
            : competencia === 'III'
              ? revisao.nota_humana_iii
              : competencia === 'IV'
                ? revisao.nota_humana_iv
                : revisao.nota_humana_v

      if (typeof nota_humana !== 'number') continue

      pares.push({
        competencia,
        nota_ia: getNotaCompetencia(correcao, competencia),
        nota_humana,
      })
    }
  }

  const por_competencia = computeCalibracaoMetricas(pares)
  const total_revisoes = (revisoes ?? []).length

  return json(
    200,
    {
      total_revisoes,
      por_competencia,
    },
    {},
  )
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})

    const authResult = await requireUser(req)
    if (authResult.error) {
      return json(authResult.error.status, { error: authResult.error.message }, cors)
    }
    const userId = authResult.data.user.id

    const admin = createServiceRoleClientUnsafe()
    const staff = await requireRedacaoCalibrationStaff(admin, userId)
    if (staff.error) {
      return json(staff.error.status, { error: staff.error.message }, cors)
    }

    if (req.method === 'GET') {
      const query = await parseRequestQueryParams(req)
      const action = query.get('action')?.trim() ?? 'list'

      if (action === 'list') {
        const limit = parseCalibracaoListLimit(query.get('limit'))
        const result = await handleList(admin, userId, limit)
        return new Response(result.body, {
          status: result.status,
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'get') {
        const correcaoId = query.get('correcao_id')?.trim() ?? ''
        if (!isValidUuid(correcaoId)) {
          return json(400, { error: 'correcao_id deve ser UUID válido' }, cors)
        }
        const result = await handleGetBlind(admin, userId, correcaoId)
        return new Response(result.body, {
          status: result.status,
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'metrics') {
        const result = await handleMetrics(admin)
        return new Response(result.body, {
          status: result.status,
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }

      return json(400, { error: 'action inválida' }, cors)
    }

    if (req.method === 'POST') {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return json(400, { error: 'JSON inválido' }, cors)
      }

      const action =
        body && typeof body === 'object' && 'action' in body
          ? String((body as { action?: unknown }).action ?? 'submit')
          : 'submit'

      if (action !== 'submit') {
        return json(400, { error: 'action inválida' }, cors)
      }

      const result = await handleSubmit(admin, userId, body)
      return new Response(result.body, {
        status: result.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return json(405, { error: 'Method not allowed' }, cors)
  } catch (err) {
    console.error('[redacao-revisao-humana]', err)
    return json(500, { error: String(err) }, cors)
  }
})
