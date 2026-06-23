/**
 * Reindexa todos os materiais de uma turma RAG via edge material-index.
 *
 * Uso:
 *   export SUPABASE_SERVICE_ROLE_KEY="..."
 *   export SUPABASE_URL="https://lfhsugwhnjqudqomzegp.supabase.co"
 *   export SUPABASE_ANON_KEY="..."  # ou VITE_SUPABASE_ANON_KEY
 *   deno run --allow-net --allow-env supabase/scripts/reindex-rag-class.ts \
 *     b0c00000-0000-4000-8000-000000000001
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const classId = Deno.args[0] ?? 'b0c00000-0000-4000-8000-000000000001'

const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anonKey =
  Deno.env.get('SUPABASE_ANON_KEY') ??
  Deno.env.get('VITE_SUPABASE_ANON_KEY') ??
  Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')!

if (!url || !serviceKey || !anonKey) {
  console.error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY')
  Deno.exit(1)
}

const sb = createClient(url, serviceKey)
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://www.brotoenem.com.br'

function edgeHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
    Origin: ALLOWED_ORIGIN,
  }
}

async function teacherAccessToken(targetClassId: string): Promise<string> {
  const { data: cls, error: clsErr } = await sb
    .from('classes')
    .select('organization_id, name, rag_enabled')
    .eq('id', targetClassId)
    .single()
  if (clsErr || !cls) throw new Error(`Turma não encontrada: ${clsErr?.message ?? ''}`)

  console.log(`[turma] ${cls.name} rag_enabled=${cls.rag_enabled}`)
  if (!cls.rag_enabled) {
    throw new Error('rag_enabled=false — habilite RAG antes de reindexar')
  }

  const { data: membership, error: memErr } = await sb
    .from('organization_memberships')
    .select('user_id, role')
    .eq('organization_id', cls.organization_id)
    .eq('status', 'active')
    .in('role', ['teacher', 'org_admin', 'owner'])
    .limit(1)
    .maybeSingle()
  if (memErr || !membership) throw new Error('Nenhum professor ativo na org da turma')

  const { data: userData, error: userErr } = await sb.auth.admin.getUserById(membership.user_id)
  if (userErr || !userData.user?.email) throw new Error('Email do professor não encontrado')

  const email = userData.user.email
  const { data: link, error: linkErr } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkErr || !link.properties?.hashed_token) {
    throw new Error(`generateLink falhou: ${linkErr?.message ?? 'sem token'}`)
  }

  const authClient = createClient(url, anonKey)
  const { data: sessionData, error: otpErr } = await authClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  if (otpErr || !sessionData.session?.access_token) {
    throw new Error(`verifyOtp falhou: ${otpErr?.message ?? 'sem session'}`)
  }

  console.log(`[auth] professor ${email} (${membership.role})`)
  return sessionData.session.access_token
}

async function studentAccessToken(targetClassId: string): Promise<string | null> {
  const { data: enrollment } = await sb
    .from('enrollments')
    .select('student_id')
    .eq('class_id', targetClassId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (!enrollment?.student_id) return null

  const { data: userData } = await sb.auth.admin.getUserById(enrollment.student_id)
  const email = userData.user?.email
  if (!email) return null

  const { data: link } = await sb.auth.admin.generateLink({ type: 'magiclink', email })
  if (!link?.properties?.hashed_token) return null

  const authClient = createClient(url, anonKey)
  const { data: sessionData } = await authClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  return sessionData.session?.access_token ?? null
}

const teacherToken = await teacherAccessToken(classId)

const { data: materials, error: matErr } = await sb
  .from('materials')
  .select('id, title, index_status, type')
  .eq('class_id', classId)
  .order('created_at', { ascending: true })

if (matErr) {
  console.error('Erro ao listar materiais:', matErr.message)
  Deno.exit(1)
}

if (!materials?.length) {
  console.log('Nenhum material na turma.')
  Deno.exit(0)
}

console.log(`[reindex] ${materials.length} material(is)`)

let ok = 0
let fail = 0

for (const mat of materials) {
  await sb.from('materials').update({ index_status: 'pending' }).eq('id', mat.id)

  const res = await fetch(`${url}/functions/v1/material-index`, {
    method: 'POST',
    headers: edgeHeaders(teacherToken),
    body: JSON.stringify({ material_id: mat.id, class_id: classId }),
  })

  const body = await res.json().catch(() => ({}))
  const indexed = (body as { indexed?: number }).indexed
  const errMsg = (body as { error?: string }).error

  if (res.ok) {
    ok++
    console.log(`  ✓ ${mat.title} (${mat.type}) → ${res.status} indexed=${indexed ?? '?'}`)
  } else {
    fail++
    console.error(`  ✗ ${mat.title} → ${res.status} ${errMsg ?? JSON.stringify(body)}`)
  }
}

const { data: summary } = await sb
  .rpc('match_material_chunks', {
    query_embedding: `[${new Array(1536).fill(0).join(',')}]`,
    match_class_id: classId,
    match_count: 1,
    similarity_threshold: 0,
  })
  .catch(() => ({ data: null }))

const { count } = await sb
  .from('material_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', classId)

console.log('')
console.log(`[resultado] ok=${ok} fail=${fail} chunks_totais=${count ?? 0}`)

const studentToken = await studentAccessToken(classId)
if (studentToken) {
  const chatRes = await fetch(`${url}/functions/v1/broto-chat`, {
    method: 'POST',
    headers: edgeHeaders(studentToken),
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Em uma frase: do que falam os materiais desta turma?' }],
      sessionId: crypto.randomUUID(),
      turnIndex: 0,
      classId,
    }),
  })
  const chatBody = await chatRes.json().catch(() => ({}))
  if (chatRes.ok && (chatBody as { message?: string }).message) {
    console.log('[broto-chat] OK:', String((chatBody as { message: string }).message).slice(0, 200))
  } else {
    console.error('[broto-chat]', chatRes.status, chatBody)
  }
} else {
  console.log('[broto-chat] skip — nenhum aluno matriculado para smoke test')
}

if (fail > 0 || (count ?? 0) === 0) Deno.exit(1)
