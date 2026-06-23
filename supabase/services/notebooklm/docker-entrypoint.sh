#!/bin/sh
set -e

NOTEBOOKLM_HOME="${NOTEBOOKLM_HOME:-/app/data/.notebooklm}"
export NOTEBOOKLM_HOME
AUTH_FILE="${NOTEBOOKLM_HOME}/storage_state.json"

# Keepalive de cookies Google (recomendado notebooklm-py: a cada 15–20 min)
if [ -f "${AUTH_FILE}" ]; then
  echo "[entrypoint] auth refresh em background (intervalo ${AUTH_REFRESH_INTERVAL_SEC:-900}s)"
  (
    while true; do
      sleep "${AUTH_REFRESH_INTERVAL_SEC:-900}"
      notebooklm auth refresh --quiet 2>/dev/null || true
    done
  ) &
else
  echo "[entrypoint] AVISO: ${AUTH_FILE} ausente — rode 'notebooklm login' e reinicie"
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
