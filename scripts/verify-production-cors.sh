#!/usr/bin/env bash
# Smoke test CORS das Edge Functions em produção (fail closed).
#
# Uso: ./scripts/verify-production-cors.sh
# Requer curl. Não expõe secrets.

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-lfhsugwhnjqudqomzegp}"
BASE="https://${PROJECT_REF}.supabase.co/functions/v1/user-me"

check_origin() {
  local origin="$1"
  local expect_ok="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "${BASE}" \
    -H "Origin: ${origin}" \
    -H "Access-Control-Request-Method: GET")"
  if [[ "${expect_ok}" == "ok" && "${code}" != "403" ]]; then
    echo "  OK  ${origin} → HTTP ${code}"
  elif [[ "${expect_ok}" == "block" && "${code}" == "403" ]]; then
    echo "  OK  ${origin} → bloqueado (403)"
  else
    echo "  FAIL ${origin} → HTTP ${code} (esperado: ${expect_ok})" >&2
    return 1
  fi
}

echo "CORS user-me (${BASE})"
fail=0
check_origin "https://www.brotoenem.com.br" ok || fail=1
check_origin "https://brotoenem.com.br" ok || fail=1
check_origin "https://evil.example.com" block || fail=1

if [[ "${fail}" -ne 0 ]]; then
  echo ""
  echo "Falha CORS — revise ALLOWED_ORIGINS no Supabase:" >&2
  echo "  supabase secrets set ALLOWED_ORIGINS=\"https://www.brotoenem.com.br,https://brotoenem.com.br\"" >&2
  exit 1
fi

echo ""
echo "CORS produção OK."
