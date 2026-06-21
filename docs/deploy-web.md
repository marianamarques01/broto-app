# Deploy — Web aluno (`apps/web`)

Guia para o SPA React/Vite na **Vercel**. Auth e dados vêm do **Supabase** (Auth + Edge Functions).

---

## Produção (atual)

| Item | Valor |
|------|--------|
| **URL canônica** | [https://www.brotoenem.com.br](https://www.brotoenem.com.br) |
| **Apex** | `https://brotoenem.com.br` → redirect 307 para `www` |
| **Host** | Vercel (`server: Vercel`) |
| **Supabase** | `lfhsugwhnjqudqomzegp` |
| **CORS** | `ALLOWED_ORIGINS` inclui apex + www — ver `./scripts/verify-production-cors.sh` |

Smoke test manual: login → Home (pet) → responder 1 questão → Network sem erro CORS.

---

## Pré-requisitos (novo ambiente / preview)

- Conta Vercel com acesso ao repositório GitHub
- Edge Functions publicadas — ver `docs/deploy-functions.md`
- Gates locais verdes:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run test:web && npm run build
```

---

## Configuração no Vercel (monorepo)

### Opção A — Root Directory `apps/web` (recomendada)

| Campo | Valor |
|-------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/web` |
| **Install Command** | `cd ../.. && npm ci` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Include source files outside Root Directory** | **Ativado** |

### Opção B — Raiz do repositório

| Campo | Valor |
|-------|--------|
| **Build Command** | `npm run build --workspace=@broto/web` |
| **Output Directory** | `apps/web/dist` |

---

## Variáveis de ambiente (Vercel)

Referência: `apps/web/.env.example`.

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Sim | `https://lfhsugwhnjqudqomzegp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sim | Anon key do projeto |
| `VITE_BETA_FEEDBACK_FORM_URL` | Não | Formulário de feedback |
| `VITE_APP_INTEGRATED_TOUR` | Não | `false` desliga tour |
| `VITE_SENTRY_DSN` | Não | Sentry — ver `docs/observability.md` |
| `SENTRY_AUTH_TOKEN` | Não | Upload source maps (build only) |
| `SENTRY_ORG` | Não | Slug org Sentry (build only) |
| `SENTRY_PROJECT` | Não | Slug projeto Sentry (build only) |

Após alterar `VITE_*`, **redeploy** (valores embutidos no build).

---

## CORS e `ALLOWED_ORIGINS`

Produção **HTTPS** exige origem listada em `ALLOWED_ORIGINS` (Edge Functions → Secrets):

```text
https://www.brotoenem.com.br,https://brotoenem.com.br
```

Preview `*.vercel.app`: adicionar URL exata ao secret se testar PR contra Supabase remoto.

```bash
supabase secrets set ALLOWED_ORIGINS="https://www.brotoenem.com.br,https://brotoenem.com.br"
./scripts/verify-production-cors.sh
```

---

## Preview vs Production

| | Preview | Production |
|---|---------|------------|
| **Gatilho** | Pull Request | Merge na `main` |
| **URL** | `*.vercel.app` | `www.brotoenem.com.br` |
| **CORS** | Adicionar origin preview se necessário | Apex + www já configurados |

---

## `vercel.json`

`apps/web/vercel.json` — rewrites SPA + headers de segurança + cache em `/assets/*`.

---

## Build local

```bash
npm run build --workspace=@broto/web
```

---

## Rollback

Vercel → Deployments → promote deployment anterior.

---

## Referências

- `docs/deploy-functions.md` — deploy Edge Functions
- `scripts/verify-production-cors.sh`
- `.planning/PRODUCTION-ROADMAP.md` — Fase 3.1
- `docs/observability.md` — Sentry (fase 3.5)
