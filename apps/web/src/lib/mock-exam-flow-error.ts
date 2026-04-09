import { ApiError } from '@broto/shared'

/**
 * Mensagem única para falhas comuns do fluxo do simulado (storage público + Edge Functions).
 * "NetworkError" / "Failed to fetch" costumam ser CORS, offline ou URL errada — não só "sem internet".
 */
export function formatMockExamFlowError(err: unknown): string {
  if (err instanceof ApiError) return err.message

  const raw = err instanceof Error ? err.message : String(err)
  const likelyNetwork =
    err instanceof TypeError ||
    (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'NetworkError') ||
    /NetworkError when attempting|Failed to fetch|Load failed|Network request failed/i.test(raw)

  if (likelyNetwork) {
    return (
      'Não foi possível completar o pedido (rede ou bloqueio do navegador). ' +
      'Confira a conexão. Em desenvolvimento, no Supabase → Edge Functions → Secrets, ' +
      'inclua em ALLOWED_ORIGINS a origem exata do app (ex.: http://localhost:5173). ' +
      'Confirme VITE_SUPABASE_URL no .env e se o bucket público `static` existe no projeto.'
    )
  }

  return raw || 'Erro ao montar simulado'
}
