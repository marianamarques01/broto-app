# Deploy — Edge Functions (Supabase)

Publicação das Edge Functions Deno do monorepo. Auth e CORS ficam nos handlers (`requireUser`, `_shared/cors.ts`).

---

## Produção atual

| Item | Valor |
|------|--------|
| **Web aluno** | [https://www.brotoenem.com.br](https://www.brotoenem.com.br) (apex redireciona para `www`) |
| **Supabase project** | `lfhsugwhnjqudqomzegp` |
| **`ALLOWED_ORIGINS`** | Configurado — inclui `https://www.brotoenem.com.br` e `https://brotoenem.com.br` |

Verificação rápida:

```bash
./scripts/verify-production-cors.sh
```

---

## Pré-requisitos

```bash
supabase login
supabase link --project-ref lfhsugwhnjqudqomzegp
```

Secrets necessários (nomes apenas — **nunca** commitar valores):

| Secret | Uso |
|--------|-----|
| `ALLOWED_ORIGINS` | CORS produção — URLs HTTPS do front, separadas por vírgula |
| `SUPABASE_SERVICE_ROLE_KEY` | Injetado automaticamente pelo Supabase em runtime |
| `FASTAPI_URL` | `routine-generate` — URL base do FastAPI de rotina (opcional). Se vazio, usa `NOTEBOOKLM_SERVICE_URL` (mesmo serviço Python). Sem URL = fallback local na edge |
| `NOTEBOOKLM_SERVICE_URL` | `material-index`, `broto-chat`, **`routine-generate`** (fallback de URL) |
| `SERVICE_SECRET` | Auth interno NotebookLM (**obrigatório** para chamadas ao Python, incl. rotina) |
| `OPENAI_API_KEY` | `material-embed`, `semantic-search`, **`broto-chat` (RAG)** — embeddings (`text-embedding-3-small`) e chat |
| `OPENAI_CHAT_MODEL` | Opcional — modelo de chat RAG (padrão: `gpt-4o-mini`) |

Configurar a chave OpenAI (nunca commitar o valor):

```bash
supabase secrets set OPENAI_API_KEY="sk-..."
```

Atualizar origens após novo domínio (ex.: admin):

```bash
supabase secrets set ALLOWED_ORIGINS="https://www.brotoenem.com.br,https://brotoenem.com.br"
```

---

## Deploy (todas as functions)

```bash
./scripts/deploy-functions.sh
```

Equivalente manual por function:

```bash
supabase functions deploy user-me --no-verify-jwt
```

**Por que `--no-verify-jwt`?** O gateway Supabase rejeita JWT ES256 do Auth com verify_jwt ligado (`Invalid JWT`). Cada function valida o caller via `requireUser()` ou lógica própria (`auth-signup`).

### Subconjunto simulado (legado)

```bash
./supabase/deploy-simulado-functions.sh
```

Apenas practice-session-* + answer-question + user-reset-practice.

---

## Functions incluídas

```
answer-question          auth-signup              broto-chat
broto-chat-session-delete broto-chat-session-get   broto-chat-sessions      class-join               material-embed           material-index
pet-me                   practice-session-* (8)   routine-generate
semantic-search          user-me                  user-onboarding
user-performance-series  user-progress            user-recent-mistakes
user-reset-practice
```

---

## Pós-deploy checklist

1. `./scripts/verify-production-cors.sh` — verde
2. Login em [brotoenem.com.br/login](https://www.brotoenem.com.br/login)
3. Responder uma questão (network → `answer-question` 200)
4. Abrir Home/Rotina → `routine-generate` 200 (ver [docs/routine-generate.md](./routine-generate.md))
5. `curl -X OPTIONS` com Origin inválido → **403** (ver script)

---

## Rollback

Redeploy da versão anterior de uma function:

```bash
git checkout <commit-anterior> -- supabase/functions/user-me
supabase functions deploy user-me --no-verify-jwt
```

Migrations são forward-only — rollback de DB é separado.

---

## Referências

- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/authz.ts`
- [docs/routine-generate.md](./routine-generate.md) — rotina inteligente, secrets, fallback, testes
- `docs/deploy-web.md` — front Vercel
- `.cursor/rules/04-producao.mdc`
