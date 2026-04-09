import { ApiError } from '@broto/shared'

/** Mensagem amigável para falhas do fluxo do simulado (mobile). */
export function formatMockExamFlowError(err: unknown): string {
    if (err instanceof ApiError) return err.message

    const raw = err instanceof Error ? err.message : String(err)
    const likelyNetwork =
        err instanceof TypeError ||
        /NetworkError|Failed to fetch|Load failed|network request failed/i.test(raw)

    if (likelyNetwork) {
        return (
            'Nao foi possivel completar o pedido. Confira a conexao, EXPO_PUBLIC_SUPABASE_URL e ' +
            'ALLOWED_ORIGINS nas Edge Functions (origem do app / Metro).'
        )
    }

    return raw || 'Erro ao montar simulado'
}
