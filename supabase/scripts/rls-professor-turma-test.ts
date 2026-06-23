#!/usr/bin/env -S deno run --allow-env --allow-net
/**
 * Testes RLS professor → turma → aluno (topic_performance + chat_logs).
 *
 * Pré-requisitos:
 *   export SUPABASE_URL="https://<ref>.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="..."
 *   export SUPABASE_ANON_KEY="..."
 *
 * Uso:
 *   deno run --allow-env --allow-net supabase/scripts/rls-professor-turma-test.ts
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('VITE_SUPABASE_ANON_KEY')

if (!url || !serviceKey || !anonKey) {
  console.error('SKIP: defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY')
  Deno.exit(0)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PREFIX = `rls-test-${Date.now()}`
const PASSWORD = `Test-${crypto.randomUUID().slice(0, 8)}!`

type Persona = { id: string; email: string; label: string }

async function createUser(email: string, label: string): Promise<Persona> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message ?? 'no user'}`)
  return { id: data.user.id, email, label }
}

async function signInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`signIn ${email}: ${error.message}`)
  return client
}

function assertCount(label: string, actual: number | null, expected: number): void {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${label}: esperado ${expected}, obteve ${actual ?? 'null'}`)
  }
  console.log(`[PASS] ${label} (count=${actual})`)
}

async function cleanup(ids: {
  org1: string
  org2: string
  class1: string
  class2: string
  tpA: string
  tpB: string
  clA: string
  clB: string
  users: string[]
}): Promise<void> {
  await admin.from('chat_logs').delete().in('id', [ids.clA, ids.clB])
  await admin.from('topic_performance').delete().in('id', [ids.tpA, ids.tpB])
  await admin.from('enrollments').delete().in('class_id', [ids.class1, ids.class2])
  await admin.from('organization_memberships').delete().in('organization_id', [ids.org1, ids.org2])
  await admin.from('classes').delete().in('id', [ids.class1, ids.class2])
  await admin.from('organizations').delete().in('id', [ids.org1, ids.org2])
  await admin.from('users').delete().in('id', ids.users)
  for (const userId of ids.users) {
    await admin.auth.admin.deleteUser(userId)
  }
}

const ids = {
  org1: crypto.randomUUID(),
  org2: crypto.randomUUID(),
  class1: crypto.randomUUID(),
  class2: crypto.randomUUID(),
  tpA: crypto.randomUUID(),
  tpB: crypto.randomUUID(),
  clA: crypto.randomUUID(),
  clB: crypto.randomUUID(),
  users: [] as string[],
}

let alunoA: Persona
let alunoB: Persona
let profX: Persona

try {
  alunoA = await createUser(`${TEST_PREFIX}-aluno-a@broto.invalid`, 'aluno_a')
  alunoB = await createUser(`${TEST_PREFIX}-aluno-b@broto.invalid`, 'aluno_b')
  profX = await createUser(`${TEST_PREFIX}-prof-x@broto.invalid`, 'prof_x')
  ids.users = [alunoA.id, alunoB.id, profX.id]

  const { error: orgErr } = await admin.from('organizations').insert([
    {
      id: ids.org1,
      name: 'RLS Test Org 1',
      slug: `${TEST_PREFIX}-org1`,
      owner_id: profX.id,
      is_public: false,
    },
    {
      id: ids.org2,
      name: 'RLS Test Org 2',
      slug: `${TEST_PREFIX}-org2`,
      owner_id: alunoB.id,
      is_public: false,
    },
  ])
  if (orgErr) throw new Error(`organizations: ${orgErr.message}`)

  const { error: classErr } = await admin.from('classes').insert([
    {
      id: ids.class1,
      organization_id: ids.org1,
      name: 'Turma Org1',
      access_code: crypto.randomUUID().replace(/-/g, '').slice(0, 20),
      created_by: profX.id,
      is_active: true,
    },
    {
      id: ids.class2,
      organization_id: ids.org2,
      name: 'Turma Org2',
      access_code: crypto.randomUUID().replace(/-/g, '').slice(0, 20),
      created_by: alunoB.id,
      is_active: true,
    },
  ])
  if (classErr) throw new Error(`classes: ${classErr.message}`)

  const { error: omErr } = await admin.from('organization_memberships').insert([
    { user_id: alunoA.id, organization_id: ids.org1, role: 'student', status: 'active' },
    { user_id: alunoB.id, organization_id: ids.org2, role: 'student', status: 'active' },
    { user_id: profX.id, organization_id: ids.org1, role: 'teacher', status: 'active' },
  ])
  if (omErr) throw new Error(`organization_memberships: ${omErr.message}`)

  const { error: enrErr } = await admin.from('enrollments').insert([
    { class_id: ids.class1, student_id: alunoA.id, status: 'active' },
    { class_id: ids.class2, student_id: alunoB.id, status: 'active' },
  ])
  if (enrErr) throw new Error(`enrollments: ${enrErr.message}`)

  const { error: tpErr } = await admin.from('topic_performance').insert([
    {
      id: ids.tpA,
      user_id: alunoA.id,
      topico_value: `${TEST_PREFIX}-topico`,
      total_answered: 10,
      total_correct: 7,
      accuracy_pct: 70,
    },
    {
      id: ids.tpB,
      user_id: alunoB.id,
      topico_value: `${TEST_PREFIX}-topico`,
      total_answered: 5,
      total_correct: 3,
      accuracy_pct: 60,
    },
  ])
  if (tpErr) throw new Error(`topic_performance: ${tpErr.message}`)

  const sessionId = crypto.randomUUID()
  const { error: clErr } = await admin.from('chat_logs').insert([
    {
      id: ids.clA,
      user_id: alunoA.id,
      class_id: ids.class1,
      session_id: sessionId,
      question: 'Pergunta A',
      answer: 'Resposta A',
      turn_index: 0,
    },
    {
      id: ids.clB,
      user_id: alunoB.id,
      class_id: ids.class2,
      session_id: sessionId,
      question: 'Pergunta B',
      answer: 'Resposta B',
      turn_index: 0,
    },
  ])
  if (clErr) throw new Error(`chat_logs: ${clErr.message}`)

  const profClient = await signInClient(profX.email)
  const alunoClient = await signInClient(alunoA.email)

  const { count: profTpA } = await profClient
    .from('topic_performance')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoA.id)
  assertCount('prof_x lê topic_performance de aluno_a', profTpA, 1)

  const { count: profTpB } = await profClient
    .from('topic_performance')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoB.id)
  assertCount('prof_x NÃO lê topic_performance de aluno_b', profTpB, 0)

  const { count: alunoTpSelf } = await alunoClient
    .from('topic_performance')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoA.id)
  assertCount('aluno_a lê próprio topic_performance', alunoTpSelf, 1)

  const { count: alunoTpOther } = await alunoClient
    .from('topic_performance')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoB.id)
  assertCount('aluno_a NÃO lê topic_performance de aluno_b', alunoTpOther, 0)

  const { count: profClA } = await profClient
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoA.id)
  assertCount('prof_x lê chat_logs de aluno_a', profClA, 1)

  const { count: profClB } = await profClient
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoB.id)
  assertCount('prof_x NÃO lê chat_logs de aluno_b', profClB, 0)

  const { count: alunoClSelf } = await alunoClient
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoA.id)
  assertCount('aluno_a lê próprio chat_logs', alunoClSelf, 1)

  const { count: alunoClOther } = await alunoClient
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', alunoB.id)
  assertCount('aluno_a NÃO lê chat_logs de aluno_b', alunoClOther, 0)

  console.log('\nTodos os testes RLS professor→turma passaram.')
} finally {
  try {
    await cleanup(ids)
  } catch (cleanupErr) {
    console.error('Aviso: cleanup parcial falhou:', cleanupErr)
  }
}
