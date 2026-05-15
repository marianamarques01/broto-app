#!/usr/bin/env bash
# Deploy apenas das Edge Functions usadas pelo simulado (aluno).
# Não rode `supabase functions deploy` sem nomes — isso redeploya TODAS as funções do diretório.
#
# Uso (na raiz do repositório ou com SUPABASE_WORKDIR):
#   ./supabase/deploy-simulado-functions.sh
#   ./supabase/deploy-simulado-functions.sh --project-ref seu-ref
#
# --no-verify-jwt: GoTrue emite JWT ES256; a verificação automática do gateway costuma falhar
# com "Invalid JWT". A autenticação continua em cada handler via getUser/requireUser.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FUNCS=(
  practice-session-create
  practice-session-get
  practice-session-progress
  practice-session-abandon
  practice-session-delete
  practice-session-list
  practice-session-complete
  answer-question
  user-reset-practice
)

for fn in "${FUNCS[@]}"; do
  echo "==> Deploy: $fn"
  supabase functions deploy "$fn" --no-verify-jwt "$@"
done

echo "==> Concluído: ${#FUNCS[@]} funções (simulado + respostas)."
