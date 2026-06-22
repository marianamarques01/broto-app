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
cd supabase/services/notebooklm-py

# Opção A: pip direto
pip install -r requirements.txt
pip install "notebooklm-py[browser]"
playwright install chromium

# Opção B: Docker
docker build -t broto-notebooklm .
```

### 2. Autenticar no Google NotebookLM

**Este passo precisa ser feito uma vez**, abrindo um browser:

```bash
notebooklm login
```

Isso abre o Chromium, você faz login na sua conta Google, e as credenciais ficam salvas localmente. O serviço usa essas credenciais para se comunicar com o NotebookLM.

> ⚠️ **Se a sessão expirar**, o endpoint `/health` retorna `"authenticated": false` e os outros endpoints retornam 503. Basta rodar `notebooklm login` novamente.

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com o SERVICE_SECRET
```

### 4. Rodar

```bash
# Dev local
uvicorn main:app --reload --port 8000

# Docker
docker run -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v ~/.notebooklm:/root/.notebooklm \
  --env-file .env \
  broto-notebooklm
```

O volume `~/.notebooklm` contém as credenciais do login.

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
O `notebooklm-py` usa APIs internas não-oficiais do Google. A sessão pode expirar a qualquer momento. Monitore o `/health` e tenha um processo para re-autenticar quando necessário.

### Dados persistentes
O arquivo `data/notebook_map.json` mapeia turmas para notebooks. Faça backup. Se perder esse arquivo, precisará recriar os notebooks (os materiais no NotebookLM continuam existindo, mas o mapeamento local se perde).

### Limites
O NotebookLM pode ter rate limits implícitos. Para produção, considere adicionar uma fila (Redis/BullMQ) entre as Edge Functions e este serviço para evitar timeouts em uploads pesados.
