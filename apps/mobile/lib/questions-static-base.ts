/** Base URL do corpus estático ENEM — mesmo critério que `useQuestionsFilters.getBaseUrl`. */
export function getQuestionsStaticBaseUrl(orgSlug?: string | null): string {
    if (process.env.EXPO_PUBLIC_QUESTIONS_BASE_URL) {
        const base = process.env.EXPO_PUBLIC_QUESTIONS_BASE_URL.replace(/\/$/, '')
        return orgSlug ? `${base}/${orgSlug}` : base
    }

    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
        const supabaseBase = `${process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/static`
        return supabaseBase
    }

    return ''
}
