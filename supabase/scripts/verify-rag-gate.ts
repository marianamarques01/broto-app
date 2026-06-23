import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL')
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !key) {
  console.log('SKIP: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  Deno.exit(0)
}

const sb = createClient(url, key)

const { data: mat } = await sb
  .from('materials')
  .select('id, class_id, organization_id')
  .limit(1)
  .maybeSingle()

if (!mat) {
  console.log('SKIP: no materials in DB')
  Deno.exit(0)
}

await sb.from('classes').update({ rag_enabled: true }).eq('id', mat.class_id)

const dim = 1536
const makeVec = (i: number) => {
  const arr = new Array(dim).fill(0)
  arr[i % dim] = 1
  return `[${arr.join(',')}]`
}
const emb = makeVec(0)
const queryEmb = makeVec(0)

await sb.from('material_embeddings').delete().eq('material_id', mat.id)
const { error: insertError } = await sb.from('material_embeddings').insert({
  material_id: mat.id,
  class_id: mat.class_id,
  organization_id: mat.organization_id,
  chunk_index: 0,
  chunk_text: 'Teste RAG gate: fotossíntese em plantas',
  chunk_tokens: 8,
  embedding: emb,
  metadata: { section_title: 'gate-test' },
})

if (insertError) {
  console.error('Insert error:', insertError.message)
  Deno.exit(1)
}

const { count } = await sb
  .from('material_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', mat.class_id)

console.log('count:', count, 'class_id:', mat.class_id)

const { data: matches, error } = await sb.rpc('match_material_chunks', {
  query_embedding: queryEmb,
  match_class_id: mat.class_id,
  match_count: 5,
  similarity_threshold: 0.5,
})

if (error) {
  console.error('RPC error:', error.message)
  Deno.exit(1)
}

console.log('matches:', matches?.length ?? 0)
if (matches?.[0]) {
  console.log('top similarity:', matches[0].similarity)
  console.log('top chunk:', String(matches[0].chunk_text).slice(0, 50))
}

const ok = (count ?? 0) >= 1 && (matches?.length ?? 0) >= 1
console.log('GATE_OK:', ok)
if (!ok) Deno.exit(1)
