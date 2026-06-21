# Estado do projeto — Broto

**Última atualização:** 2026-06-21  
**Fonte de verdade** para status de execução. O `PRODUCTION-ROADMAP.md` descreve o plano; este arquivo descreve **onde estamos**.

---

## Gates locais (hoje)

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run test:web && npm run build
npm run test:functions
```

| Gate | Status |
|------|--------|
| `format:check` | Verde |
| `lint` | Verde (3 warnings em `Onboarding.tsx` exhaustive-deps — conhecido, fora de escopo) |
| `typecheck` | Verde (web + admin) |
| `test:shared` | Verde — **38 testes** (8 arquivos Vitest) |
| `test:web` | Verde — **12 testes** (`api-client.test.ts`) |
| `test:functions` | Verde — **5 arquivos** Deno (`authz`, `cors`, `daily-mission-bonus`, `edge-api-types`, `validate`) |
| `build` | Verde (web + admin) |
| CI GitHub (`.github/workflows/ci.yml`) | lint, typecheck, test:shared, test:web, test:functions, build |

**Produção web:** [www.brotoenem.com.br](https://www.brotoenem.com.br) (Vercel). CORS: `npm run verify:cors` → verde.

---

## Inventário técnico

| Item | Contagem / nota |
|------|-----------------|
| Edge functions | 19 (`supabase/functions/*/index.ts`) |
| Módulos `_shared` | 9 arquivos TS + 4 `*_test.ts` em `_shared` |
| Migrations versionadas | 26 (`supabase/migrations/`) |
| `database.types.ts` | CLI gerado + aliases Row (script P8) |
| Apps ativos | `apps/web`, `apps/admin` |
| Mobile | **Removido** (2026-06) |
| `StudyArea.tsx` | ~139 linhas (extraído para `study-area/*` — P2 parcial) |
| `app.css` | ~23k linhas — ainda monolítico |

---

## Roadmap de produção — progresso

### Fase 1 — Fundação

| Etapa | Status | Notas |
|-------|--------|-------|
| 1.1 CI mínimo | **Concluída** | `.github/workflows/ci.yml` |
| 1.2 Admin typecheck | **Concluída** | `npm run typecheck` verde |
| 1.3 Remover mobile | **Concluída** | `apps/mobile/` ausente |
| 1.4 Higiene repo | **Parcial** | `.venv`/assets grandes ainda em CONCERNS |

### Fase 2 — Qualidade

| Etapa | Status | Notas |
|-------|--------|-------|
| 2.1 Arquivos gigantes | **Parcial** | StudyArea refatorado; `app.css` e outros componentes grandes pendentes |
| 2.2 Consolidar shared | **Parcial** | `filters-core.ts`, daily-missions, enem-area em shared |
| 2.3 Testes edge (Deno) | **Parcial** | P8+P9: authz, cors, daily-mission-bonus, edge-api-types, validate |
| 2.4 Testes web (Vitest) | **Concluída** | Vitest + 12 testes `api-client.test.ts`, CI `test:web` |

### Fase 3 — Produção

| Etapa | Status |
|-------|--------|
| 3.1 Deploy web | **Concluída** | Live em `www.brotoenem.com.br`; docs + `vercel.json` |
| 3.2 Deploy admin | Pendente (`apps/admin/vercel.json` ausente) |
| 3.3 Deploy functions | **Concluída** | Deploy 2026-06-21 (`npm run deploy:functions`), 19/19 |
| 3.4 RLS staging | Pendente |
| 3.5 Observabilidade | Pendente |

### Trilha Type Safety / Supabase (passes P6–P9)

| Passe | Status | Entregas principais |
|-------|--------|---------------------|
| P6 | Concluído | Typed clients, constantes missão, `topico-labels.ts` |
| P7 | Concluído | `requireUser()` em 6 functions, `area_key` migration, `database.types.ts` CLI |
| P8 | Concluído | `scripts/gen-database-types.sh`, drift `user_question_answers` (Opção A), casts Row, Deno.test inicial |
| P9 | **Concluído** | authz membership/class (mock), `cors_test.ts`, `edge-api-types_test.ts` |

---

## Backend — decisões recentes

- **`topic_performance.area_key`:** Opção A — coluna versionada (`20260619120000`), backfill SQL, upsert em `answer-question`
- **Auth edge:** 17/19 functions com `requireUser()`; exceções: `auth-signup` (público + service role), helpers em `_shared/authz.ts`
- **`user_question_answers` drift (P8 Opção A):** migration `20260620120000` versiona colunas legado prod; **aplicada em remoto** (2026-06-20); runtime usa `answer_area_key` + `acertou` — sem DROP

---

## Dívida conhecida (priorizada)

1. Testes web adicionais (hooks além de `api-client`)
2. Testes Deno adicionais (`resolveActiveContext`, JWT mock em `requireUser`)
3. `app.css` monolítico (~23k linhas)
4. `.planning/codebase/*` — análise de abril/2026, **arquivada** (ver nota abaixo)
5. Assets/binários e `.venv` no git (CONCERNS)
6. `Onboarding.tsx` exhaustive-deps (escopo grande)

---

## Documentação

| Documento | Papel |
|-----------|--------|
| `CONTEXT.md` | Índice mestre — ler primeiro |
| `.planning/STATE.md` | **Este arquivo** — status atual |
| `.planning/PRODUCTION-ROADMAP.md` | Plano + prompts por etapa |
| `.planning/PROJECT.md` | Escopo do milestone de consolidação |
| `docs/CHECKLIST-PR.md` | Checklist de PR |
| `docs/deprecated/*` | ROADMAP/REQUIREMENTS antigos (histórico) |
| `.planning/codebase/*` | Snapshot **2026-04-02** — consultar com cautela |

---

## Próximo passo recomendado

1. **Redeploy** se o repo local divergir do ar (último asset Vercel ~2026-06-12): push na `main` ou promote no dashboard
2. **`npm run deploy:functions`** após mudanças em `supabase/functions/`
3. **Fase 3.2** (admin) ou **3.5** (Sentry)
