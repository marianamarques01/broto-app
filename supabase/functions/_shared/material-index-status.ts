import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function countMaterialEmbeddings(
  adminClient: SupabaseClient,
  materialId: string,
): Promise<number> {
  const { count, error } = await adminClient
    .from('material_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('material_id', materialId)

  if (error) {
    console.warn('[material-index-status] count embeddings:', error.message)
    return 0
  }
  return count ?? 0
}

/** Se já há chunks persistidos, marca indexed (evita failed falso após retry). */
export async function markIndexedIfHasEmbeddings(
  adminClient: SupabaseClient,
  materialId: string,
): Promise<number> {
  const n = await countMaterialEmbeddings(adminClient, materialId)
  if (n > 0) {
    await adminClient.from('materials').update({ index_status: 'indexed' }).eq('id', materialId)
  }
  return n
}
