# Integração com IA (NotebookLM) — Fluxo Completo

Este documento descreve ponta-a-ponta como funciona a integração do **Broto** com o **Google NotebookLM** via a biblioteca **`notebooklm-py`** ([teng-lin/notebooklm-py](https://github.com/teng-lin/notebooklm-py)).

---

## Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONT-END                                                          │
│                                                                     │
│  apps/web              apps/admin                apps/mobile        │
│  ┌──────────┐          ┌──────────────┐          ┌──────────┐      │
│  │BrotoChat │          │ Upload de    │          │BrotoChat │      │
│  │JoinClass │          │ Materiais    │          │(futuro)  │      │
│  │Estudar   │          │ Editar/Excluir│          └──────────┘      │
│  └────┬─────┘          │ Turmas       │                             │
│       │                └──────┬───────┘                             │
│       │ fetch()              │ supabase                             │
│       │ direto               │ .functions                           │
│       │                      │ .invoke()                            │
└───────┼──────────────────────┼──────────────────────────────────────┘
        │                      │
        ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE (Edge Functions + Postgres + Storage)                     │
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐               │
│  │ class-join │  │ broto-chat │  │ material-index │               │
│  └─────┬──────┘  └─────┬──────┘  └───────┬────────┘               │
│        │               │                 │                          │
│        │ service_role   │ service_role    │ service_role             │
│        ▼               │                 │                          │
│  ┌──────────┐          │                 │                          │
│  │ Postgres │◄─────────┘                 │                          │
│  │ (classes,│                            │                          │
│  │  users,  │                            │                          │
│  │  enroll, │                            │                          │
│  │  mats)   │                            │                          │
│  └──────────┘                            │                          │
│                                          │                          │
│  ┌──────────┐                            │                          │
│  │ Storage  │  buckets: materials, static│                          │
│  └──────────┘                            │                          │
└──────────────────────────────────────────┼──────────────────────────┘
                                           │
                            HTTP (Bearer SERVICE_SECRET)
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │  Serviço Python (FastAPI)│
                              │  notebooklm-py          │
                              │                          │
                              │  /notebook/create        │
                              │  /notebook/add-source    │
                              │  /notebook/chat          │
                              │  /routine/generate       │
                              │  /health                 │
                              └───────────┬──────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  Google NotebookLM     │
                              │  (sessão autenticada)  │
                              └────────────────────────┘
```

---

## Setup do serviço Python (pré-requisito)

O serviço precisa estar rodando para que o Broto AI e a indexação de materiais funcionem.

### Instalação local

```bash
cd supabase/services/notebooklm

# Instalar dependências
pip install -r requirements.txt
pip install "notebooklm-py[browser]"
playwright install chromium

# Login no Google (abre browser, uma vez só)
notebooklm login

# Iniciar serviço
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Verificar se está funcionando

```bash
curl http://localhost:8000/health
# Esperado: {"status":"ok","authenticated":true,"notebooks_mapped":0}
```

Se `authenticated: false`, rode `notebooklm login` novamente.

### Expor para o Supabase remoto (dev)

O Supabase Edge Functions roda na nuvem e precisa acessar o serviço. Em dev, use um tunnel:

```bash
# Instalar localtunnel
npx localtunnel --port 8000
# Saída: your url is: https://xxxx.loca.lt
```

Configurar a URL nos secrets do Supabase:

```bash
supabase secrets set NOTEBOOKLM_SERVICE_URL=https://xxxx.loca.lt
```

**Importante:** a URL do localtunnel muda toda vez que reinicia. Atualize o secret quando mudar.

### Deploy em produção

O serviço tem um `Dockerfile` pronto. Pode ser hospedado em Railway, Fly.io, Cloud Run, etc.

```bash
cd supabase/services/notebooklm
docker build -t broto-notebooklm .
docker run -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v ~/.notebooklm:/root/.notebooklm \
  broto-notebooklm
```

Volumes necessários:
- `/app/data` — mapeamento `class_id` → `notebook_id` (persistente)
- `/root/.notebooklm` — credenciais do Google (do `notebooklm login`)

Após o deploy, configurar o secret com a URL definitiva:

```bash
supabase secrets set NOTEBOOKLM_SERVICE_URL=https://seu-servico.railway.app
```

---

## Deploy das Edge Functions

As Edge Functions precisam ser deployed no Supabase remoto:

```bash
# broto-chat: --no-verify-jwt porque tokens ES256 não passam na validação do runtime.
# A function faz sua própria autenticação via getUser().
supabase functions deploy broto-chat --no-verify-jwt

# material-index: chamado pelo admin (server-side), pode manter JWT verification
supabase functions deploy material-index

# class-join: chamado pelo aluno, mesma situação do broto-chat
supabase functions deploy class-join --no-verify-jwt
```

### Secrets necessários

```bash
supabase secrets set NOTEBOOKLM_SERVICE_URL=https://url-do-servico
supabase secrets set SERVICE_SECRET=um-secret-qualquer  # opcional, protege o serviço Python
```

Os seguintes secrets são automáticos (já existem no Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Pré-requisito: Aluno entra em uma turma

Antes de usar o chat, o aluno precisa ter um `current_class_id`. Isso é definido ao entrar em uma turma.

### Fluxo: Ingresso na turma (`class-join`)

**Arquivos envolvidos:**
- Front-end: `apps/web/src/pages/JoinClass.tsx`
- Edge Function: `supabase/functions/class-join/index.ts`

**Sequência:**

```
JoinClass.tsx                    Edge Function class-join              Postgres
     │                                    │                               │
     │ api.post('/api/class-join',        │                               │
     │   { access_code: 'ENEM26' })       │                               │
     │ ──────────────────────────────────► │                               │
     │                                    │ getUser() → user.id           │
     │                                    │                               │
     │                                    │ SELECT * FROM classes         │
     │                                    │ WHERE access_code = 'ENEM26'  │
     │                                    │ AND is_active = true          │
     │                                    │                               │
     │                                    │ UPSERT enrollments            │
     │                                    │ { class_id, student_id }      │
     │                                    │                               │
     │                                    │ UPDATE users                  │
     │                                    │ SET current_class_id = ?      │
     │                                    │                               │
     │ ◄──── { success, class }           │                               │
```

---

## Fluxo A: Admin envia materiais → indexação no NotebookLM

O professor faz upload de um material (PDF, URL, YouTube) no painel admin. O material é salvo no Storage, registrado no banco, e indexado no NotebookLM.

**Arquivos envolvidos:**
- Admin hook: `apps/admin/src/hooks/useMaterials.ts`
- Edge Function: `supabase/functions/material-index/index.ts`
- Serviço Python: `supabase/services/notebooklm/main.py`

**Sequência:**

```
Admin Panel                 Edge Function material-index        Python Service           NotebookLM
     │                               │                               │                       │
     │ 1. Upload PDF ao Storage      │                               │                       │
     │    bucket "materials"         │                               │                       │
     │                               │                               │                       │
     │ 2. INSERT materials           │                               │                       │
     │    (index_status='pending')   │                               │                       │
     │                               │                               │                       │
     │ 3. invoke('material-index',   │                               │                       │
     │   { material_id, class_id })  │                               │                       │
     │ ─────────────────────────────►│                               │                       │
     │                               │                               │                       │
     │                               │ SELECT material + class       │                       │
     │                               │ SET index_status='indexing'   │                       │
     │                               │                               │                       │
     │                   ┌───────────┤ Se turma NÃO tem notebook:    │                       │
     │                   │           │ POST /notebook/create ────────►│ notebooks.create() ──►│
     │                   │           │ ◄── { notebook_id }           │                       │
     │                   │           │ UPDATE classes.notebook_id    │                       │
     │                   └───────────┤                               │                       │
     │                               │                               │                       │
     │                               │ POST /notebook/add-source ───►│ sources.add_url() ───►│
     │                               │ ◄── { success }              │                       │
     │                               │                               │                       │
     │                               │ SET index_status='indexed'   │                       │
     │                               │ SET notebook_status='ready'  │                       │
     │ ◄── { success: true }         │                               │                       │
```

**Upload de PDF — sanitização do nome:**
Nomes com acentos (ex: `Matemática`) causam erro 400 no Supabase Storage. O hook sanitiza:
```
Livro_MAT_Matemática_V1.pdf → Livro_MAT_Matematica_V1.pdf
```

**Mapeamento de tipos (Edge Function → Python):**

| Tipo no DB | Python `source_type` | Campo enviado |
|------------|---------------------|---------------|
| `pdf`      | `url`               | `url: <public Storage URL>` |
| `url`      | `url`               | `url: source_url` |
| `youtube`  | `url`               | `url: source_url` |
| `text`     | `text`              | `text: source_url, title` |

---

## Fluxo B: Aluno conversa no "Broto AI"

O aluno abre o chat, digita uma pergunta, e recebe uma resposta da IA baseada nos materiais da turma.

**Arquivos envolvidos:**
- Front-end: `apps/web/src/components/broto/BrotoChat.tsx`
- API Client: `apps/web/src/lib/api-client.ts`
- Edge Function: `supabase/functions/broto-chat/index.ts`
- Serviço Python: `supabase/services/notebooklm/main.py`

**Sequência:**

```
BrotoChat.tsx          api-client.ts         Edge Function broto-chat    Python Service     NotebookLM
     │                       │                       │                        │                  │
     │ api.post(             │                       │                        │                  │
     │  '/api/broto/chat',   │                       │                        │                  │
     │  { messages })        │                       │                        │                  │
     │ ─────────────────────►│                       │                        │                  │
     │                       │                       │                        │                  │
     │                       │ getSession()          │                        │                  │
     │                       │ → access_token        │                        │                  │
     │                       │                       │                        │                  │
     │                       │ fetch(functions/v1/   │                        │                  │
     │                       │  broto-chat, {        │                        │                  │
     │                       │  Authorization:       │                        │                  │
     │                       │  Bearer <token> })    │                        │                  │
     │                       │ ─────────────────────►│                        │                  │
     │                       │                       │                        │                  │
     │                       │                       │ getUser() → user.id    │                  │
     │                       │                       │ SELECT current_class_id│                  │
     │                       │                       │ Extrai última question │                  │
     │                       │                       │                        │                  │
     │                       │                       │ POST /notebook/chat ──►│ chat.ask() ─────►│
     │                       │                       │ ◄── { answer }         │ ◄── resposta     │
     │                       │                       │                        │                  │
     │                       │ ◄── { message }       │                        │                  │
     │ ◄── resp.message      │                       │                        │                  │
```

**Detalhes do api-client (web):**
O web app usa `fetch()` direto (não `supabase.functions.invoke()`) para ter controle total dos headers. O token da sessão do usuário é obtido via `supabase.auth.getSession()` e enviado no header `Authorization`.

**Transformação de dados:**

| Etapa | Campo | Valor |
|-------|-------|-------|
| BrotoChat envia | `messages` | `[{ role: 'user', content: 'O que é...' }]` |
| broto-chat extrai | `question` | `'O que é...'` (última msg com `role: 'user'`) |
| Python recebe | `{ class_id, question, user_id }` | |
| Python retorna | `{ answer, class_id }` | Resposta do NotebookLM |
| broto-chat retorna | `{ message }` | Valor de `answer` |

---

## Fluxo C: Geração de rotina via IA (backend pronto, UI não conectada)

O endpoint `POST /routine/generate` existe no serviço Python mas ainda não tem Edge Function nem UI.

**Contrato do endpoint:**
```json
// Request
{
  "class_id": "uuid",
  "user_id": "uuid",
  "hours_per_day": 2.5,
  "exam_date": "2026-11-01",
  "performance": {
    "linguagens": { "accuracy": 0.6, "weak_topics": ["interpretação"] }
  }
}

// Response
{
  "routine": {
    "week": [
      { "day": "segunda", "area": "...", "topics": [...], "hours": 2.0, "tip": "..." }
    ],
    "summary": "..."
  },
  "message": "Rotina gerada com sucesso."
}
```

Para conectar: criar Edge Function `routine-generate` e chamar do front-end.

---

## Componentes — referência rápida

### Serviço Python (FastAPI)

**Local:** `supabase/services/notebooklm/main.py`

| Endpoint | Método | Entrada | Saída |
|----------|--------|---------|-------|
| `/health` | GET | — | `{ status, authenticated, notebooks_mapped }` |
| `/notebook/create` | POST | `{ class_id, class_name }` | `{ notebook_id, class_id, message }` |
| `/notebook/add-source` | POST | `{ class_id, source_type, url\|text\|file_data }` | `{ success, message }` |
| `/notebook/chat` | POST | `{ class_id, question, user_id? }` | `{ answer, class_id }` |
| `/routine/generate` | POST | `{ class_id, user_id, hours_per_day, exam_date, performance }` | `{ routine, message }` |

**Nota:** o `NotebookLMClient` precisa de `await client.__aenter__()` após `from_storage()` para inicializar corretamente.

### Edge Functions

| Função | Arquivo | JWT | Descrição |
|--------|---------|-----|-----------|
| `class-join` | `supabase/functions/class-join/index.ts` | `--no-verify-jwt` | Matricula aluno, define `current_class_id` |
| `broto-chat` | `supabase/functions/broto-chat/index.ts` | `--no-verify-jwt` | Extrai question, chama Python, retorna message |
| `material-index` | `supabase/functions/material-index/index.ts` | verificação padrão | Busca material/turma, cria notebook se necessário, indexa fonte |

**Por que `--no-verify-jwt`:** O Supabase Auth emite tokens com algoritmo ES256, mas o runtime do Edge Functions valida com HS256. Desabilitar a verificação do runtime e autenticar manualmente via `getUser()` resolve o problema.

### Front-end (web)

| Componente | Arquivo | Chama |
|------------|---------|-------|
| `JoinClass` | `apps/web/src/pages/JoinClass.tsx` | `api.post('/api/class-join')` |
| `BrotoChat` | `apps/web/src/components/broto/BrotoChat.tsx` | `api.post('/api/broto/chat')` |
| `api-client` | `apps/web/src/lib/api-client.ts` | `fetch()` direto para Edge Functions |

### Front-end (admin)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `MaterialUpload` | `apps/admin/src/components/materials/MaterialUpload.tsx` | Upload de PDF/URL/YouTube |
| `useMaterials` | `apps/admin/src/hooks/useMaterials.ts` | Upload → Storage → DB → trigger indexação |
| `ClassDetail` | `apps/admin/src/pages/ClassDetail.tsx` | Editar/excluir turma, gerenciar materiais |
| `useClasses` | `apps/admin/src/hooks/useClasses.ts` | CRUD de turmas |

---

## Autenticação e segurança

### Padrão de dois clients nas Edge Functions

Edge Functions que atendem alunos usam dois Supabase clients:

```typescript
// 1. Client autenticado — valida identidade do usuário
const supabaseAuthed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: req.headers.get("Authorization")! } }
})
const { data: { user } } = await supabaseAuthed.auth.getUser()

// 2. Client admin — service_role key, bypassa RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

**Por quê:** As tabelas têm RLS com policies restritivas. A Edge Function usa service_role para queries e anon key apenas para validar identidade.

### Autenticação do serviço Python (SERVICE_SECRET)

As Edge Functions enviam `Authorization: Bearer <SERVICE_SECRET>` ao serviço Python. O serviço valida quando a variável está definida (em dev local sem secret, aceita tudo).

### Login no NotebookLM

- Primeiro uso: `notebooklm login` (abre browser para autenticar com Google)
- Credenciais salvas em `~/.notebooklm/` (storage_state.json + browser_profile)
- Se expirar: `GET /health` retorna `authenticated: false`, endpoints retornam 503

---

## Storage (Supabase)

### Bucket `materials`

Armazena PDFs dos materiais de estudo.

- **Criação:** via SQL (não existe por padrão)
- **Público:** sim (para o NotebookLM acessar as URLs)
- **Limite:** 50MB por arquivo
- **Path:** `{class_id}/{timestamp}_{filename_sanitizado}.pdf`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('materials', 'materials', true, 52428800);

CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Public read access for materials"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'materials');
```

### Bucket `static`

Armazena JSONs das questões do ENEM (areas, exams, topics, questions).

- Usado pela aba "Estudar" no web e mobile
- Path: `areas.json`, `exams.json`, `topics/{area}.json`, `{year}/details.json`, etc.

---

## Tabelas do banco envolvidas

```sql
-- Organizações (escola/instituição)
organizations (id, name, slug, logo_url, is_public, owner_id, config)

-- Perfil de admin/professor
admin_profiles (id, full_name, email, organization_id, role)

-- Turmas (professor cria, aluno entra via código)
classes (id, organization_id, name, description, access_code, is_active,
         notebook_id, notebook_status, created_by)

-- Matrículas (aluno ↔ turma)
enrollments (id, class_id, student_id, status, enrolled_at)

-- Perfil do aluno (inclui turma ativa)
users (id, nome, email, image, onboarding_done, current_class_id, streak)

-- Materiais de estudo (professor faz upload)
materials (id, class_id, organization_id, title, type, source_url,
           index_status, uploaded_by)
```

**Status possíveis:**
- `materials.index_status`: `pending` → `indexing` → `indexed` | `failed`
- `classes.notebook_status`: `not_configured` → `indexing` → `ready` | `error`

---

## Troubleshooting

### "Invalid JWT" no Broto AI
- Edge function precisa ser deployed com `--no-verify-jwt` (tokens ES256 vs HS256)
- Verificar se o usuário tem sessão ativa: olhar `hasToken` no console

### "Bucket not found" no upload de materiais
- Criar bucket `materials` via SQL no Supabase (ver seção Storage)

### "Erro ao fazer upload" com nome acentuado
- O hook sanitiza automaticamente: `Matemática` → `Matematica`

### "authenticated: false" no health check
- Rodar `notebooklm login` novamente no servidor

### "Nenhum notebook encontrado para a turma"
- O notebook é criado automaticamente quando o primeiro material é indexado via `material-index`
- Ou criar manualmente: `POST /notebook/create { class_id, class_name }`

### Edge Function retorna 502 / timeout via localtunnel
- Adicionar header `bypass-tunnel-reminder: true` nos requests (já feito no broto-chat)
- Verificar se uvicorn e localtunnel estão rodando

### Aba "Estudar" não carrega no web
- Verificar se `VITE_SUPABASE_URL` no `.env` do web aponta para o Supabase correto (remoto, não localhost)

---

## O que ainda falta

- **Rotina via IA**: conectar front-end ao `POST /routine/generate` (criar Edge Function + UI)
- **Deploy do serviço Python em produção**: hospedar container e definir `NOTEBOOKLM_SERVICE_URL` definitivo
- **Reautenticação automática**: quando a sessão do NotebookLM expira, notificar admin ou tentar re-login
