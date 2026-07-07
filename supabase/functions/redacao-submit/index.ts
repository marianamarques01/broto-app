import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import {
  createServiceRoleClientUnsafe,
  requireUser,
  resolveActiveContext,
} from '../_shared/authz.ts'
import { runRedacaoCorrect } from '../_shared/redacao-correct-core.ts'
import { mapRedacaoRow } from '../_shared/redacao-map.ts'
import { isValidUuid } from '../_shared/redacao-repertorio-validation.ts'
import {
  parseRedacaoSubmitBody,
  validateLinhaCountForSubmit,
} from '../_shared/redacao-submit-validation.ts'
import type { RedacaoTemasRow, RedacoesRow } from '../../database.types.ts'

const CORRECT_TIMEOUT_MS = 45_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} excedeu ${ms / 1000}s`))
    }, ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function assertTemaAccessible(
  admin: ReturnType<typeof createServiceRoleClientUnsafe>,
  temaId: string,
  organizationId: string,
): Promise<{ ok: true; tema: RedacaoTemasRow } | { ok: false; status: number; message: string }> {
  const { data: tema, error } = await admin
    .from('redacao_temas')
    .select('*')
    .eq('id', temaId)
    .eq('ativo', true)
    .maybeSingle()

  if (error) {
    console.error('[redacao-submit] tema:', error)
    return { ok: false, status: 500, message: 'Erro ao carregar tema' }
  }
  if (!tema) {
    return { ok: false, status: 404, message: 'Tema não encontrado' }
  }

  const temaRow = tema as RedacaoTemasRow
  if (temaRow.organization_id !== null && temaRow.organization_id !== organizationId) {
    return { ok: false, status: 403, message: 'Tema indisponível para sua organização' }
  }

  return { ok: true, tema: temaRow }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  let redacaoIdForError: string | null = null

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
    const userId = authResult.data.user.id

    const parsed = parseRedacaoSubmitBody(await req.json().catch(() => null))
    if (!parsed.ok) {
      return json(400, { error: parsed.error }, cors)
    }

    const linhaCheck = validateLinhaCountForSubmit(parsed.data.texto)
    if (!linhaCheck.ok) {
      return json(400, { error: linhaCheck.error }, cors)
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return json(500, { error: 'OPENAI_API_KEY não configurada' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()
    const contextResult = await resolveActiveContext(admin, userId)
    if (contextResult.error) {
      return json(contextResult.error.status, { error: contextResult.error.message }, cors)
    }

    const ctx = contextResult.data
    if (!ctx.isValid || !ctx.organizationId) {
      return json(403, { error: 'Organização ativa não configurada' }, cors)
    }

    const temaAccess = await assertTemaAccessible(admin, parsed.data.tema_id, ctx.organizationId)
    if (!temaAccess.ok) {
      return json(temaAccess.status, { error: temaAccess.message }, cors)
    }

    const classId =
      parsed.data.class_id !== undefined ? parsed.data.class_id : (ctx.classId ?? null)

    const persistPayload = {
      texto: parsed.data.texto,
      linha_count: linhaCheck.linha_count,
      tempo_segundos: parsed.data.tempo_segundos,
      modo: parsed.data.modo,
      status: 'enviada' as const,
      organization_id: ctx.organizationId,
      class_id: classId,
      user_id: userId,
      tema_id: parsed.data.tema_id,
    }

    let redacaoRow: RedacoesRow

    if (parsed.data.redacao_id) {
      const { data: existing, error: existingError } = await admin
        .from('redacoes')
        .select('*')
        .eq('id', parsed.data.redacao_id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingError) {
        console.error('[redacao-submit] draft load:', existingError)
        return json(500, { error: 'Erro ao carregar rascunho' }, cors)
      }
      if (!existing) {
        return json(404, { error: 'Rascunho não encontrado' }, cors)
      }

      const draft = existing as RedacoesRow
      if (draft.status !== 'rascunho') {
        return json(409, { error: 'Esta redação já foi enviada' }, cors)
      }
      if (draft.tema_id !== parsed.data.tema_id) {
        return json(400, { error: 'Rascunho pertence a outro tema' }, cors)
      }

      const { data: updated, error: updateError } = await admin
        .from('redacoes')
        .update(persistPayload)
        .eq('id', draft.id)
        .select('*')
        .single()

      if (updateError || !updated) {
        console.error('[redacao-submit] update:', updateError)
        return json(500, { error: 'Erro ao enviar redação' }, cors)
      }

      redacaoRow = updated as RedacoesRow
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('redacoes')
        .insert(persistPayload)
        .select('*')
        .single()

      if (insertError || !inserted) {
        console.error('[redacao-submit] insert:', insertError)
        return json(500, { error: 'Erro ao enviar redação' }, cors)
      }

      redacaoRow = inserted as RedacoesRow
    }

    redacaoIdForError = redacaoRow.id

    const correctResult = await withTimeout(
      runRedacaoCorrect({
        adminClient: admin,
        openAiKey,
        redacaoId: redacaoRow.id,
      }),
      CORRECT_TIMEOUT_MS,
      'Correção',
    )

    const { data: finalRow, error: finalError } = await admin
      .from('redacoes')
      .select('*')
      .eq('id', redacaoRow.id)
      .single()

    if (finalError || !finalRow) {
      console.error('[redacao-submit] final status:', finalError)
    }

    const redacao = mapRedacaoRow((finalRow ?? redacaoRow) as RedacoesRow)

    return json(
      200,
      {
        ok: true,
        redacao,
        correcao: correctResult.correcao,
        status: redacao.status,
      },
      cors,
    )
  } catch (err) {
    console.error('[redacao-submit]', err)

    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = message.includes('excedeu')

    if (redacaoIdForError && isValidUuid(redacaoIdForError)) {
      try {
        const admin = createServiceRoleClientUnsafe()
        await admin.from('redacoes').update({ status: 'erro' }).eq('id', redacaoIdForError)
      } catch {
        // não bloquear resposta de erro
      }
    }

    return json(isTimeout ? 504 : 500, { error: message }, cors)
  }
})
