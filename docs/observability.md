# Observabilidade — Web aluno (`apps/web`)

Erros de produção no SPA são enviados ao **Sentry** quando `VITE_SENTRY_DSN` está configurado. Sem DSN, o app funciona normalmente (graceful degradation).

---

## 1. Criar conta e projeto no Sentry

1. Acesse [sentry.io](https://sentry.io) e crie uma conta (ou use a org existente).
2. **Create project** → plataforma **React**.
3. Copie o **DSN** em *Settings → Projects → [projeto] → Client Keys (DSN)*.

O DSN é **público por design** (identifica apenas o destino dos eventos). Não commitar no repositório — usar variável de ambiente.

---

## 2. Variáveis de ambiente

### Obrigatória para captura de erros

| Variável | Onde | Descrição |
|----------|------|-----------|
| `VITE_SENTRY_DSN` | Vercel (Production/Preview), `.env.local` | DSN do projeto React |

Referência: `apps/web/.env.example`.

### Opcionais — source maps em produção

Upload de source maps no build (stack traces legíveis). **Secrets de build** — nunca expor no client.

| Variável | Onde | Descrição |
|----------|------|-----------|
| `SENTRY_AUTH_TOKEN` | Vercel (só build) | Token em *Settings → Auth Tokens* |
| `SENTRY_ORG` | Vercel (só build) | Slug da organização Sentry |
| `SENTRY_PROJECT` | Vercel (só build) | Slug do projeto |

Com as três definidas, o `@sentry/vite-plugin` faz upload dos `.map` e remove os arquivos do `dist` antes do deploy (maps não ficam públicos).

Sem token, o build continua verde — apenas sem upload de source maps.

---

## 3. Vercel

1. Project → **Settings → Environment Variables**
2. Adicionar `VITE_SENTRY_DSN` em **Production** (e Preview se quiser testar PRs).
3. (Opcional) `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` para source maps.
4. **Redeploy** após alterar `VITE_*` (valores embutidos no bundle).

Deploy geral: `docs/deploy-web.md`.

---

## 4. Contexto de usuário (privacidade)

Após login, o SDK envia apenas:

- `user.id` — UUID Supabase
- tag `organization_id` — org ativa ou `none`

**Não** enviamos email, nome ou outros PII. Alinhado a LGPD e `.cursor/rules/02-seguranca.mdc`.

---

## 5. Testar evento no Sentry

### Local (com DSN)

```bash
# apps/web/.env.local
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

```bash
npm run dev --workspace=@broto/web
```

No DevTools → Console (com app aberto):

```javascript
window.__brotoSentryTest?.()
```

Ou force um erro React em uma rota protegida para validar o ErrorBoundary.

### Produção

Após deploy com `VITE_SENTRY_DSN`, abra [www.brotoenem.com.br](https://www.brotoenem.com.br), faça login e execute `window.__brotoSentryTest?.()` no console.

Confirme o evento em *Issues* no dashboard Sentry (pode levar alguns segundos).

---

## 6. O que está integrado (web MVP)

| Item | Status |
|------|--------|
| `@sentry/react` em `main.tsx` | Sim — init só com DSN |
| Erros não tratados (global) | Sim — via SDK |
| `ErrorBoundary` (rotas autenticadas) | Sim — `AppShell` |
| Contexto user/org pós-login | Sim — `SentryUserContextSync` |
| Source maps produção | Sim — com token de build |
| Admin (`apps/admin`) | Fora de escopo (fase 3.2) |
| Edge functions | Fora de escopo |

---

## Referências

- `apps/web/src/lib/sentry.ts` — init e sync de contexto
- `docs/deploy-web.md` — deploy Vercel
- `.planning/PRODUCTION-ROADMAP.md` — Etapa 3.5
