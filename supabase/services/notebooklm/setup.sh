#!/usr/bin/env bash
# Setup local do serviço NotebookLM (venv + Playwright + checklist de login).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

pip install -r requirements.txt
playwright install chromium

echo ""
echo "OK — ambiente pronto ($(notebooklm --version 2>/dev/null || echo 'notebooklm CLI'))."
echo ""
echo "Próximo passo (manual — abre o browser):"
echo "  cd ${ROOT}"
echo "  source .venv/bin/activate"
echo "  notebooklm login"
echo "  notebooklm auth check --test"
echo "  uvicorn main:app --reload --port 8000"
