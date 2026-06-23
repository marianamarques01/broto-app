# Broto — Serviço NotebookLM

Serviço Python (FastAPI) que conecta o Broto ao Google NotebookLM via [notebooklm-py](https://github.com/teng-lin/notebooklm-py). Funciona como backend de IA para chat com materiais e geração de rotina de estudo.

## Arquitetura

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  App Aluno   │────▶│  Edge Functions  │────▶│  Este Serviço     │
│  (Web/Mobile)│     │  (Supabase)      │     │  (FastAPI + NLMPY)│
└──────────────┘     └──────────────────┘     └────────┬──────────┘
                                                       │
┌──────────────┐     ┌──────────────────┐              ▼
│  App Admin   │────▶│  material-index  │────▶  Google NotebookLM
│  (Professor) │     │  (Edge Function) │     (API não-oficial)
└──────────────┘     └──────────────────┘
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/notebook/create` | Cria notebook para uma turma |
| POST | `/notebook/add-source` | Adiciona material (URL, texto ou arquivo) |
| POST | `/notebook/chat` | Chat do aluno com materiais da turma |
| POST | `/routine/generate` | Gera rotina de estudo semanal personalizada |
| GET | `/health` | Status do serviço e autenticação |

## Setup

### 1. Instalar dependências

```bash
cd supabase/services/notebooklm

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

Versão fixada: `notebooklm-py[browser]==0.7.2` (ver `requirements.txt`).

### 2. Autenticar no Google NotebookLM

**Passo manual obrigatório** — abre o browser para login Google:

```bash
notebooklm login
notebooklm auth check --test   # deve passar em "Token fetch"
```

Credenciais ficam em `~/.notebooklm/storage_state.json`.

> Se `/health` retorna `"authenticated": false`, rode `notebooklm login` de novo. Em produção, o container faz refresh automático a cada 15 min (`docker-entrypoint.sh`), mas cookies expirados exigem novo login manual.

### 3. Configurar variáveis de ambiente

```bash
export SERVICE_SECRET="seu-token-compartilhado-com-supabase"
# Dev local (opcional — padrão usa ~/.notebooklm)
export NOTEBOOK_MAP_PATH="./data/notebook_map.json"
```

### 4. Rodar

```bash
# Dev local
uvicorn main:app --reload --port 8000

# Docker (dev)
docker build -t broto-notebooklm .
docker run -p 8000:8000 \
  -v "$(pwd)/data:/app/data" \
  -v "$HOME/.notebooklm:/app/data/.notebooklm" \
  -e SERVICE_SECRET="$SERVICE_SECRET" \
  broto-notebooklm
```

## Deploy no Railway

1. Crie um serviço a partir deste diretório (`supabase/services/notebooklm/`).
2. **Volume obrigatório:** mount em `/app/data` (guarda `notebook_map.json` + `.notebooklm/`).
3. Secret `SERVICE_SECRET` — mesmo valor do Supabase (`supabase secrets set SERVICE_SECRET=…`).
4. Após o primeiro deploy, **login manual uma vez** (ver abaixo).
5. Configure `NOTEBOOKLM_SERVICE_URL` no Supabase apontando para a URL pública do Railway.

`railway.toml` inclui healthcheck em `/health`.

### Login manual no Railway (obrigatório na 1ª vez)

Cookies Google não podem ser gerados sem browser. Opções:

**A) Copiar credenciais do dev local para o volume Railway**

```bash
# Após notebooklm login local
railway volume upload /app/data/.notebooklm   # ou copie storage_state.json via Railway CLI/dashboard
```

**B) Login via Railway shell + port forward**

```bash
railway shell
notebooklm login --no-launch   # ou use cookies do Chrome: notebooklm login --browser-cookies chrome
```

Depois confirme: `curl https://SEU-SERVICO.railway.app/health` → `"authenticated": true`.

## Payload `notebook_id` (edge functions)

As edges enviam `notebook_id` de `classes.notebook_id` junto com `class_id`. Isso evita falha quando o mapa local (`notebook_map.json`) se perde após redeploy — o Postgres é a fonte de verdade.

## Uso (exemplos com curl)

### Criar notebook para uma turma

```bash
curl -X POST http://localhost:8000/notebook/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "class_id": "b0c00000-0000-4000-8000-000000000001",
    "class_name": "ENEM 2026"
  }'
```

### Adicionar material (URL)

```bash
curl -X POST http://localhost:8000/notebook/add-source \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "class_id": "b0c00000-0000-4000-8000-000000000001",
    "source_type": "url",
    "url": "https://brasilescola.uol.com.br/redacao-enem"
  }'
```

### Adicionar material (texto puro)

```bash
curl -X POST http://localhost:8000/notebook/add-source \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "class_id": "b0c00000-0000-4000-8000-000000000001",
    "source_type": "text",
    "text": "A Revolução Francesa começou em 1789...",
    "title": "Resumo - Revolução Francesa"
  }'
```

### Chat do aluno

```bash
curl -X POST http://localhost:8000/notebook/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "class_id": "b0c00000-0000-4000-8000-000000000001",
    "question": "Quais foram as principais causas da Revolução Francesa?",
    "user_id": "aluno-123"
  }'
```

### Gerar rotina de estudo

```bash
curl -X POST http://localhost:8000/routine/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "class_id": "b0c00000-0000-4000-8000-000000000001",
    "user_id": "aluno-123",
    "hours_per_day": 3,
    "exam_date": "2026-11-08",
    "performance": {
      "linguagens": { "accuracy": 0.72, "weak_topics": ["interpretação de texto"] },
      "humanas": { "accuracy": 0.55, "weak_topics": ["geografia política", "filosofia"] },
      "natureza": { "accuracy": 0.63, "weak_topics": ["química orgânica"] },
      "matematica": { "accuracy": 0.48, "weak_topics": ["probabilidade", "geometria espacial"] }
    }
  }'
```

### Health check

```bash
curl http://localhost:8000/health
# {"status": "ok", "authenticated": true, "notebooks_mapped": 1}
```

## Integração com Edge Functions do Supabase

| Edge Function | Endpoint Python | Secrets |
|---------------|-----------------|---------|
| `material-index` | `/notebook/add-source`, etc. | `NOTEBOOKLM_SERVICE_URL`, `SERVICE_SECRET` |
| `broto-chat` | `/notebook/chat` | idem |
| **`routine-generate`** | `/routine/generate` | idem (+ `FASTAPI_URL` opcional como override) |

Configure no Supabase Dashboard → Edge Functions → Secrets:

```bash
NOTEBOOKLM_SERVICE_URL=https://seu-servidor.railway.app
SERVICE_SECRET=…
# FASTAPI_URL opcional — ver docs/routine-generate.md
```

**Documentação completa da rotina:** [docs/routine-generate.md](../../../docs/routine-generate.md) (fallback em 3 camadas, testes, deploy, contrato de payload).

Exemplo de chamada autenticada (padrão das edges):

```typescript
const base = Deno.env.get('NOTEBOOKLM_SERVICE_URL')!
const secret = Deno.env.get('SERVICE_SECRET') ?? ''

await fetch(`${base}/notebook/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
  },
  body: JSON.stringify({ class_id, question, user_id }),
})
```

> **Contrato `/routine/generate`:** o Python exige `class_id` e `performance` por área; a edge `routine-generate` ainda envia lista de tópicos com `p_know`. Até alinhar, produção usa fallback local na edge. Detalhes em [docs/routine-generate.md](../../../docs/routine-generate.md#contrato-fastapi-edge-vs-python).

## Notas importantes

### Sessão do Google
O `notebooklm-py` usa APIs internas não-oficiais do Google. O container executa `notebooklm auth refresh --quiet` a cada 15 min. Quando cookies expiram por completo, é necessário `notebooklm login` manual (local ou no volume Railway).

### Dados persistentes
Monte volume em `/app/data` (Railway/Docker). Contém `notebook_map.json` e `.notebooklm/storage_state.json`. As edge functions também enviam `notebook_id` do Postgres como fallback.

### Limites
O NotebookLM pode ter rate limits implícitos. Para produção, considere adicionar uma fila (Redis/BullMQ) entre as Edge Functions e este serviço para evitar timeouts em uploads pesados.
