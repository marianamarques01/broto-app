FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install chromium --with-deps

COPY . .

RUN mkdir -p /app/data/.notebooklm \
    && chmod +x docker-entrypoint.sh

ENV PORT=8000
ENV NOTEBOOK_MAP_PATH=/app/data/notebook_map.json
ENV NOTEBOOKLM_HOME=/app/data/.notebooklm
ENV AUTH_REFRESH_INTERVAL_SEC=900

EXPOSE ${PORT}

HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -sf "http://127.0.0.1:${PORT}/health" | grep -q '"status":"ok"' || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
