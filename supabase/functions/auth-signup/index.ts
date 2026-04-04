import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'
import { createServiceRoleClientUnsafe } from '../_shared/authz.ts'
import { checkSignupRateLimit, getClientIp } from './rate-limit.ts'
import { mapCreateUserError, parseSignupBody } from './validate.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') {
      if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
      return new Response('ok', { headers: cors })
    }
    if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, cors)

    const clientIp = getClientIp(req)

    let body: ReturnType<typeof parseSignupBody>
    try {
      const raw = await req.json().catch(() => null)
      body = parseSignupBody(raw)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Dados inválidos'
      return json(400, { error: msg }, cors)
    }

    const rl = checkSignupRateLimit(clientIp, body.email)
    if (!rl.ok) {
      return json(
        429,
        { error: 'Muitas tentativas. Aguarde e tente novamente.', retryAfter: rl.retryAfterSec },
        { ...cors, 'Retry-After': String(rl.retryAfterSec) },
      )
    }

    const userMetadata: Record<string, string> = {
      full_name: body.nome,
    }
    if (body.telefone) userMetadata.telefone = body.telefone
    if (body.cpf) userMetadata.cpf = body.cpf
    if (body.cidade) userMetadata.cidade = body.cidade
    if (body.estado) userMetadata.estado = body.estado

    const admin = createServiceRoleClientUnsafe()
    const { data, error } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: userMetadata,
    })

    if (error) {
      console.error('[auth-signup] createUser:', error.message)
      const mapped = mapCreateUserError(error.message)
      return json(mapped.status, { error: mapped.message }, cors)
    }
    if (!data.user?.id) {
      return json(500, { error: 'Resposta inválida do servidor de autenticação' }, cors)
    }

    return json(200, { userId: data.user.id }, cors)
  } catch (err) {
    console.error('[auth-signup]', err)
    return json(500, { error: String(err) }, cors)
  }
})
