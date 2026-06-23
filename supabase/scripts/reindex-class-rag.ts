/**
 * Reindexa todos os materiais de uma turma com rag_enabled via edge material-index.
 *
 * Uso:
 *   export SUPABASE_URL=https://lfhsugwhnjqudqomzegp.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   export SUPABASE_ANON_KEY=...
 *   deno run --allow-net --allow-env supabase/scripts/reindex-class-rag.ts
 *
 * Opcional:
 *   CLASS_ID=b0c00000-... deno run ...
 *   SKIP_CHAT=1  — não testa broto-chat
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLASS_ID = Deno.env.get('CLASS_ID') ?? 'b0c00000-0000-4000-8000-000000000001'
const SKIP_CHAT = Deno.env.get('SKIP_CHAT') === '1'

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

async function accessTokenForRole(
  classId: string,
  roles: string[],
  label: string,
): Promise<string> {
  const { data: cls, error: clsErr } = await sb
    .from('classes')
    .select('organization_id, rag_enabled, name')
    .eq('id', classId)
    .single()
  if (clsErr || !cls) throw new Error('Turma não encontrada')

  console.log(`[turma] ${cls.name} rag_enabled=${cls.rag_enabled}`)

  const { data: membership, error: memErr } = await sb
    .from('organization_memberships')
    .select('user_id, role')
    .eq('organization_id', cls.organization_id)
    .eq('status', 'active')
    .in('role', roles)
    .limit(1)
    .maybeSingle()
  if (memErr || !membership) throw new Error(`Nenhum ${label} ativo na org`)

  const { data: userData, error: userErr } = await sb.auth.admin.getUserById(membership.user_id)
  if (userErr || !userData.user?.email) throw new Error(`Email do ${label} não encontrado`)

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

  console.log(`[auth] ${label} ${email} (${membership.role})`)
  return sessionData.session.access_token
}

async function studentTokenForClass(classId: string): Promise<string> {
  const { data: enrollment, error: enrollErr } = await sb
    .from('enrollments')
    .select('student_id')
    .eq('class_id', classId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (enrollErr || !enrollment) throw new Error('Nenhum aluno matriculado na turma')

  const { data: userData, error: userErr } = await sb.auth.admin.getUserById(enrollment.student_id)
  if (userErr || !userData.user?.email) throw new Error('Email do aluno não encontrado')

  const email = userData.user.email
  const { data: link, error: linkErr } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkErr || !link.properties?.hashed_token) {
    throw new Error(`generateLink aluno falhou: ${linkErr?.message ?? 'sem token'}`)
  }

  const authClient = createClient(url, anonKey)
  const { data: sessionData, error: otpErr } = await authClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  if (otpErr || !sessionData.session?.access_token) {
    throw new Error(`verifyOtp aluno falhou: ${otpErr?.message ?? 'sem session'}`)
  }

  console.log(`[auth] aluno ${email}`)
  return sessionData.session.access_token
}

const { data: materials, error: matErr } = await sb
  .from('materials')
  .select('id, title, index_status, type')
  .eq('class_id', CLASS_ID)
  .order('created_at', { ascending: true })

if (matErr) {
  console.error('Erro ao listar materiais:', matErr.message)
  Deno.exit(1)
}

if (!materials?.length) {
  console.log('Nenhum material na turma. Faça upload no admin primeiro.')
  Deno.exit(0)
}

console.log(`[materiais] ${materials.length} encontrado(s)`)
for (const m of materials) {
  console.log(`  - ${m.title} (${m.id}) status=${m.index_status} type=${m.type}`)
}

const teacherToken = await accessTokenForRole(
  CLASS_ID,
  ['teacher', 'org_admin', 'owner'],
  'professor',
)

let ok = 0
let fail = 0

for (const m of materials) {
  await sb.from('materials').update({ index_status: 'pending' }).eq('id', m.id)

  const res = await fetch(`${url}/functions/v1/material-index`, {
    method: 'POST',
    headers: edgeHeaders(teacherToken),
    body: JSON.stringify({ material_id: m.id, class_id: CLASS_ID }),
  })
  const body = await res.json().catch(() => ({}))
  console.log(`[material-index] ${m.title}: HTTP ${res.status}`, body)

  const { data: row } = await sb.from('materials').select('index_status').eq('id', m.id).single()
  const { count } = await sb
    .from('material_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('material_id', m.id)

  console.log(`  → index_status=${row?.index_status} chunks=${count ?? 0}`)

  if (res.ok && row?.index_status === 'indexed' && (count ?? 0) > 0) ok++
  else fail++
}

const { count: totalChunks } = await sb
  .from('material_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', CLASS_ID)

console.log(`\n[resumo] ok=${ok} fail=${fail} total_chunks=${totalChunks ?? 0}`)

if (!SKIP_CHAT && ok > 0) {
  try {
    const studentToken = await studentTokenForClass(CLASS_ID)
    const chatRes = await fetch(`${url}/functions/v1/broto-chat`, {
      method: 'POST',
      headers: edgeHeaders(studentToken),
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Em uma frase: do que fala o material da turma?' }],
        sessionId: crypto.randomUUID(),
        turnIndex: 0,
        classId: CLASS_ID,
      }),
    })
    const chatBody = await chatRes.json().catch(() => ({}))
    console.log(`\n[broto-chat] HTTP ${chatRes.status}`)
    if (chatBody.message) {
      console.log('resposta:', String(chatBody.message).slice(0, 300))
    } else {
      console.log('body:', chatBody)
    }
    if (!chatRes.ok) fail++
  } catch (err) {
    console.warn('[broto-chat] skip:', err instanceof Error ? err.message : err)
  }
}

Deno.exit(fail > 0 ? 1 : 0)
