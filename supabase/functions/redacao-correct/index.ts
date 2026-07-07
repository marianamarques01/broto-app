import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe, requireUser } from '../_shared/authz.ts'
import { assertRedacaoAccess } from '../_shared/redacao-access.ts'
import { runRedacaoCorrect } from '../_shared/redacao-correct-core.ts'
import { isValidUuid } from '../_shared/redacao-repertorio-validation.ts'

const SERVICE_SECRET =
  Deno.env.get('SERVICE_SECRET') ?? Deno.env.get('NOTEBOOKLM_INTERNAL_SECRET') ?? ''

function isInternalServiceCall(req: Request): boolean {
  if (!SERVICE_SECRET) return false
  const auth = req.headers.get('Authorization')?.trim()
  return auth === `Bearer ${SERVICE_SECRET}`
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

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const redacaoId = typeof body?.redacao_id === 'string' ? body.redacao_id.trim() : ''
    redacaoIdForError = isValidUuid(redacaoId) ? redacaoId : null

    const internal = isInternalServiceCall(req)
    let callerUserId: string | null = null

    if (!internal) {
      const authResult = await requireUser(req)
      if (authResult.error) {
        return json(authResult.error.status, { error: authResult.error.message }, cors)
      }
      callerUserId = authResult.data.user.id
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return json(500, { error: 'OPENAI_API_KEY não configurada' }, cors)
    }

    if (!isValidUuid(redacaoId)) {
      return json(400, { error: 'redacao_id deve ser UUID válido' }, cors)
    }

    const admin = createServiceRoleClientUnsafe()

    if (!internal && callerUserId) {
      const access = await assertRedacaoAccess(admin, redacaoId, callerUserId)
      if (!access.ok) {
        return json(access.status, { error: access.message }, cors)
      }
    }

    const result = await runRedacaoCorrect({
      adminClient: admin,
      openAiKey,
      redacaoId,
    })

    return json(
      200,
      {
        ok: true,
        correcao: result.correcao,
        skipped_llm: result.skipped_llm,
      },
      cors,
    )
  } catch (err) {
    console.error('[redacao-correct]', err)

    const message = err instanceof Error ? err.message : String(err)

    if (redacaoIdForError) {
      try {
        const admin = createServiceRoleClientUnsafe()
        await admin.from('redacoes').update({ status: 'erro' }).eq('id', redacaoIdForError)
      } catch {
        // não bloquear resposta de erro
      }
    }

    return json(500, { error: message }, cors)
  }
})
