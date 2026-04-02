FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do Playwright (para notebooklm login, se necessário)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar playwright chromium (necessário para notebooklm login)
RUN pip install "notebooklm-py[browser]" && playwright install chromium --with-deps

COPY . .

# Diretório para dados persistentes (notebook_map.json + credenciais notebooklm)
RUN mkdir -p /app/data

ENV PORT=8000

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
