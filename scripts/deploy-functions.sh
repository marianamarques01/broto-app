#!/usr/bin/env bash
# Deploy de todas as Edge Functions do monorepo (20 handlers).
#
# Pré-requisitos:
#   - supabase login (ou SUPABASE_ACCESS_TOKEN)
#   - Projeto linkado na raiz: supabase link --project-ref lfhsugwhnjqudqomzegp
#
# Uso (na raiz do repo):
#   ./scripts/deploy-functions.sh
#   ./scripts/deploy-functions.sh --project-ref lfhsugwhnjqudqomzegp
#
# --no-verify-jwt: GoTrue emite JWT ES256; o gateway Supabase rejeita com verify_jwt ligado.
# Auth continua em cada handler via requireUser() / validação em auth-signup.
#
# Após deploy em produção, confirme CORS:
#   ./scripts/verify-production-cors.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FN_ROOT="${ROOT}/supabase/functions"

cd "${ROOT}"

# Supabase CLI < ~2.100 usa edge-runtime que só lê deno.lock até v4.
# Deno 2.2+ local gera v5 — downgrade automático antes do bundle Docker.
LOCKFILE="${FN_ROOT}/deno.lock"
if [[ -f "${LOCKFILE}" ]] && grep -q '"version": "5"' "${LOCKFILE}"; then
  echo "Ajustando supabase/functions/deno.lock v5 → v4 (compatibilidade do bundler)…"
  node -e "
    const fs = require('fs');
    const p = process.argv[1];
    const raw = fs.readFileSync(p, 'utf8');
    const next = raw.replace('\"version\": \"5\"', '\"version\": \"4\"');
    if (next !== raw) fs.writeFileSync(p, next);
  " "${LOCKFILE}"
fi

FUNCS=()
for dir in "${FN_ROOT}"/*/; do
  name="$(basename "${dir}")"
  [[ "${name}" == "_shared" ]] && continue
  [[ -f "${dir}/index.ts" ]] && FUNCS+=("${name}")
done
IFS=$'\n' FUNCS=($(sort <<<"${FUNCS[*]}"))
unset IFS

if [[ ${#FUNCS[@]} -eq 0 ]]; then
  echo "Erro: nenhuma function com index.ts em ${FN_ROOT}" >&2
  exit 1
fi

echo "Deploy de ${#FUNCS[@]} Edge Functions…"

for fn in "${FUNCS[@]}"; do
  echo ""
  echo "==> ${fn}"
  supabase functions deploy "${fn}" --no-verify-jwt "$@"
done

echo ""
echo "Concluído: ${#FUNCS[@]} funções."
echo "Verifique CORS: ./scripts/verify-production-cors.sh"
