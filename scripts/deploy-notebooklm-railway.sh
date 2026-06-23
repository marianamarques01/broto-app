#!/usr/bin/env bash
# Deploy do serviço NotebookLM no Railway + sync NOTEBOOKLM_SERVICE_URL no Supabase.
#
# Pré-requisitos MANUAIS (uma vez):
#   1. npm install -g @railway/cli   (ou: brew install railway)
#   2. railway login                 (abre browser — OAuth Google/GitHub)
#   3. Criar projeto no Railway e linkar:
#        cd supabase/services/notebooklm && railway link
#   4. Volume no dashboard: mount /app/data (Settings → Volumes)
#   5. Variável SERVICE_SECRET no Railway (= mesmo valor do Supabase Dashboard)
#
# Uso (na raiz do repo):
#   ./scripts/deploy-notebooklm-railway.sh
#   ./scripts/deploy-notebooklm-railway.sh --skip-supabase   # só Railway
#   ./scripts/deploy-notebooklm-railway.sh --url https://xxx.railway.app  # pular railway domain

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVC="${ROOT}/supabase/services/notebooklm"
AUTH_SRC="${HOME}/.notebooklm/storage_state.json"
DATA_AUTH="${SVC}/data/.notebooklm/storage_state.json"
SKIP_SUPABASE=false
EXPLICIT_URL=""

for arg in "$@"; do
  case "${arg}" in
    --skip-supabase) SKIP_SUPABASE=true ;;
    --url) shift; EXPLICIT_URL="${1:-}" ;;
    --url=*) EXPLICIT_URL="${arg#--url=}" ;;
  esac
done

command -v railway >/dev/null 2>&1 || {
  echo "Instale o Railway CLI: npm install -g @railway/cli" >&2
  exit 1
}

if ! railway whoami >/dev/null 2>&1; then
  echo "Faça login primeiro: railway login" >&2
  exit 1
fi

cd "${SVC}"

if [[ ! -f "${AUTH_SRC}" ]]; then
  echo "Arquivo de auth não encontrado: ${AUTH_SRC}" >&2
  echo "Rode: cd ${SVC} && source .venv/bin/activate && notebooklm login" >&2
  exit 1
fi

mkdir -p "${SVC}/data/.notebooklm"
cp "${AUTH_SRC}" "${DATA_AUTH}"
chmod 600 "${DATA_AUTH}"
echo "✓ Auth copiado para ${DATA_AUTH} (backup local para volume)"

echo ""
echo "Deploy no Railway…"
railway up --detach

echo ""
echo "Obtendo URL pública…"
if [[ -n "${EXPLICIT_URL}" ]]; then
  RAILWAY_URL="${EXPLICIT_URL}"
else
  RAILWAY_URL="$(railway domain 2>/dev/null | tr -d '[:space:]' || true)"
  if [[ -z "${RAILWAY_URL}" ]]; then
    echo ""
    echo "Não foi possível obter domínio automaticamente."
    echo "Gere um em: Railway Dashboard → Service → Settings → Networking → Generate Domain"
    read -r -p "Cole a URL pública (https://….railway.app): " RAILWAY_URL
  fi
fi

RAILWAY_URL="${RAILWAY_URL%/}"
echo "URL: ${RAILWAY_URL}"

echo ""
echo "─── COPIAR AUTH PARA O VOLUME (manual, ~2 min) ───"
echo "O volume Railway persiste /app/data. Rode no terminal:"
echo ""
echo "  cd ${SVC}"
echo "  railway shell"
echo "  mkdir -p /app/data/.notebooklm"
echo "  exit"
echo ""
echo "Depois, num one-off (substitua pelo caminho local):"
echo "  cat \"${AUTH_SRC}\" | railway run -- sh -c 'mkdir -p /app/data/.notebooklm && cat > /app/data/.notebooklm/storage_state.json && chmod 600 /app/data/.notebooklm/storage_state.json'"
echo ""
echo "Ou via Railway Dashboard → Service → Shell, cole o conteúdo de storage_state.json em /app/data/.notebooklm/"
echo "──────────────────────────────────────────────────"

echo ""
echo "Aguardando health check (pode falhar até auth estar no volume)…"
for i in 1 2 3 4 5 6; do
  HEALTH="$(curl -sf "${RAILWAY_URL}/health" 2>/dev/null || true)"
  if [[ -n "${HEALTH}" ]]; then
    echo "${HEALTH}" | python3 -m json.tool 2>/dev/null || echo "${HEALTH}"
    if echo "${HEALTH}" | grep -q '"authenticated"[[:space:]]*:[[:space:]]*true'; then
      echo "✓ Serviço autenticado"
      break
    fi
    echo "  (authenticated ainda false — complete a cópia do auth acima e redeploy/restart)"
  fi
  sleep 10
done

if [[ "${SKIP_SUPABASE}" == "false" ]]; then
  echo ""
  read -r -p "Atualizar NOTEBOOKLM_SERVICE_URL no Supabase para ${RAILWAY_URL}? [y/N] " CONFIRM
  if [[ "${CONFIRM}" =~ ^[yY]$ ]]; then
    cd "${ROOT}"
    supabase secrets set "NOTEBOOKLM_SERVICE_URL=${RAILWAY_URL}"
    echo "✓ Secret NOTEBOOKLM_SERVICE_URL atualizado"
  else
    echo "Pulado. Atualize manualmente:"
    echo "  supabase secrets set NOTEBOOKLM_SERVICE_URL=\"${RAILWAY_URL}\""
  fi
fi

echo ""
echo "Concluído. Teste final:"
echo "  curl ${RAILWAY_URL}/health"
