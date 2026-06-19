/** Base URL dos JSON estáticos do Supabase Storage (banco ENEM). */
export function getStaticStorageBaseUrl(_orgSlug?: string | null): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return ''
  return `${supabaseUrl}/storage/v1/object/public/static`
}
