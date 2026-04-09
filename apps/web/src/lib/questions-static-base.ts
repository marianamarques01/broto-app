/** Base URL do corpus estático ENEM no Storage (mesmo padrão de `useQuestionsFilters`). */
export function getQuestionsStaticBaseUrl(_orgSlug?: string | null): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return ''
  return `${supabaseUrl}/storage/v1/object/public/static`
}
