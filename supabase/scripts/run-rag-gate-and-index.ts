import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anonKey =
  Deno.env.get('SUPABASE_ANON_KEY') ??
  Deno.env.get('VITE_SUPABASE_ANON_KEY') ??
  Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')!

const sb = createClient(url, serviceKey)

const ALLOWED_ORIGIN =
  Deno.env.get('ALLOWED_ORIGIN') ?? 'https://www.brotoenem.com.br'

function edgeHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
    Origin: ALLOWED_ORIGIN,
  }
}

async function teacherAccessToken(classId: string): Promise<string> {
  const { data: cls, error: clsErr } = await sb
    .from('classes')
    .select('organization_id')
    .eq('id', classId)
    .single()
  if (clsErr || !cls) throw new Error('Turma não encontrada')

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

// --- 1) Turma com RAG habilitado + material ---
const { data: ragClass, error: ragClassErr } = await sb
  .from('classes')
  .select('id, name, rag_enabled')
  .eq('rag_enabled', true)
  .limit(1)
  .maybeSingle()

if (ragClassErr || !ragClass) {
  console.error('Nenhuma turma com rag_enabled=true. Habilite no passo 3.')
  Deno.exit(1)
}

console.log(`[turma] ${ragClass.name} (${ragClass.id})`)

const { data: mat, error: matErr } = await sb
  .from('materials')
  .select('id, title, class_id, organization_id')
  .eq('class_id', ragClass.id)
  .limit(1)
  .maybeSingle()

if (matErr || !mat) {
  console.error('Nenhum material na turma RAG. Faça upload de um material primeiro.')
  Deno.exit(1)
}

console.log(`[material] ${mat.title} (${mat.id})`)

// --- 2) Indexar via material-embed (passo 5) ---
const token = await teacherAccessToken(ragClass.id)

const chunks = [
  {
    text: 'A fotossíntese é o processo pelo qual plantas convertem luz solar, água e dióxido de carbono em glicose e oxigênio. Ocorre principalmente nos cloroplastos das folhas.',
    tokens: 42,
    metadata: { page_number: 1, section_title: 'Fotossíntese', file_name: 'gate-test' },
  },
  {
    text: 'A clorofila absorve energia luminosa na faixa azul-violeta e vermelha do espectro eletromagnético, sendo essencial para a fase clara da fotossíntese.',
    tokens: 28,
    metadata: { page_number: 2, section_title: 'Clorofila', file_name: 'gate-test' },
  },
]

const embedRes = await fetch(`${url}/functions/v1/material-embed`, {
  method: 'POST',
  headers: edgeHeaders(token),
  body: JSON.stringify({
    material_id: mat.id,
    class_id: ragClass.id,
    chunks,
  }),
})

const embedBody = await embedRes.json()
console.log('[material-embed]', embedRes.status, embedBody)

if (!embedRes.ok) {
  console.error('material-embed falhou')
  Deno.exit(1)
}

// --- 3) Gate: count por class_id (passo 4) ---
const { count, error: countErr } = await sb
  .from('material_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', ragClass.id)

if (countErr) {
  console.error('count error:', countErr.message)
  Deno.exit(1)
}

console.log(`[gate] count(*) material_embeddings class_id=${ragClass.id}:`, count)

// --- 4) Gate: semantic-search ---
const searchRes = await fetch(`${url}/functions/v1/semantic-search`, {
  method: 'POST',
  headers: edgeHeaders(token),
  body: JSON.stringify({
    query: 'Como as plantas produzem oxigênio?',
    class_id: ragClass.id,
    limit: 3,
    similarity_threshold: 0.3,
  }),
})

const searchBody = await searchRes.json()
console.log('[semantic-search]', searchRes.status, JSON.stringify(searchBody, null, 2))

const chunksFound = Array.isArray(searchBody.chunks) ? searchBody.chunks.length : 0
const gateOk = (count ?? 0) >= 1 && searchRes.ok && chunksFound >= 1

console.log('GATE_OK:', gateOk)
if (!gateOk) Deno.exit(1)
