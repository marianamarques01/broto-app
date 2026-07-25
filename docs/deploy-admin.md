# Deploy — Admin professor (`apps/admin`)

Guia para o SPA React/Vite do **admin** na **Vercel**. Auth e dados vêm do **Supabase** (Auth + Edge Functions).

---

## Pré-requisitos

- Edge Functions do módulo Instituições deployadas — ver `docs/instituicoes-ops.md`
- Migrations INST aplicadas (`20260707140000` … `20260708130000`)
- `ALLOWED_ORIGINS` no Supabase inclui o domínio do admin (ex.: `https://admin.brotoenem.com.br`)

Gates locais:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run build
```

---

## Configuração no Vercel (monorepo)

| Campo | Valor |
|-------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/admin` |
| **Build Command** | `npm run build` (ou deixar padrão Turbo na raiz) |
| **Output Directory** | `dist` |
| **Install Command** | `npm ci` (na raiz do monorepo, se Root = repo root) |

Se o projeto Vercel aponta para a **raiz do monorepo**:

| Campo | Valor |
|-------|--------|
| **Root Directory** | `apps/admin` |
| **Build Command** | `cd ../.. && npm ci && npm run build --workspace=@broto/admin` |

---

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Anon key (Settings → API) |
| `VITE_BROTO_ONBOARDING_STAFF_USER_IDS` | Opcional | UUIDs Broto staff para `/onboarding` |

Copiar valores de `apps/admin/.env.example` — **nunca** commitar `.env` real.

---

## `vercel.json`

O arquivo `apps/admin/vercel.json` define:

- Headers de segurança (`X-Frame-Options`, `nosniff`, etc.)
- Cache imutável em `/assets/*`
- SPA rewrite para `index.html`

---

## CORS (Supabase Edge Functions)

Após obter a URL de preview/produção do admin:

```bash
# Exemplo — incluir domínio admin junto com web
supabase secrets set ALLOWED_ORIGINS="https://www.brotoenem.com.br,https://brotoenem.com.br,https://admin.brotoenem.com.br"
```

Redeploy das functions **não** é necessário — secrets são lidos em runtime.

Verificar:

```bash
npm run verify:cors
```

---

## Smoke pós-deploy

1. Login professor demo: `professor@demo` / `BrotoDemo2026!`
2. Abrir `/classes/:id/painel` → lista de engajamento
3. Login coordenador: `coordenador@demo` → `/escola`
4. Login rede: `rede@demo` → `/rede`
5. Automatizado: `npm run smoke:network` (API)

Contas demo: `docs/instituicoes-demo-contas.md`

---

## CLI (deploy manual)

Na raiz do repo, com Vercel CLI autenticada:

```bash
cd apps/admin
vercel --prod
```

Ou linkar projeto na primeira vez:

```bash
vercel link
vercel env pull .env.local
vercel --prod
```
