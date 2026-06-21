# Roadmap para Produção — Broto EdTech

**Gerado:** 2026-06-11 · **Atualizado:** 2026-06-19  
**Status vivo:** `.planning/STATE.md` (ler antes deste arquivo para gates e progresso real)  
**Baseado em:** varredura do repositório + passes P6/P7 (type safety Supabase)  
**Decisão estratégica:** refatorar incrementalmente — **não** recomeçar do zero  
**Foco:** web (aluno) + admin (professor) + `@broto/shared` + `supabase/`  
**Mobile:** removido (2026-06)

---

## Como usar este documento

1. Execute as fases **em ordem** — cada fase tem gates de verificação.
2. Copie o **Prompt** de cada etapa e cole numa sessão de agente (Cursor, Claude, etc.).
3. Antes de qualquer etapa, o agente deve ler `CONTEXT.md` e as regras em `.cursor/rules/`.
4. Marque `[x]` ao concluir cada etapa e registre o commit no campo **Entrega**.

---

## Estado atual (baseline)

> Snapshot 2026-06-19. Detalhes e próximo passo: **`.planning/STATE.md`**.

| Dimensão | Nota | Situação |
|----------|------|----------|
| Backend (edge functions + migrations) | B+ | 19 functions, 24 migrations, RLS multi-tenant, `requireUser()` unificado (P7) |
| Web (aluno) | B | Produto principal; `StudyArea` refatorado (~139 linhas) |
| Admin (professor) | B- | Typecheck verde; deploy prod pendente |
| Mobile (nativo) | — | Removido |
| `@broto/shared` | B+ | 38 testes Vitest; `filters-core`, daily-missions |
| CI/CD | B | `.github/workflows/ci.yml` — lint, typecheck, test:shared, build |
| Testes (web/admin/edge) | D | Shared ok; Deno/web ainda sem cobertura |
| Observabilidade | F | Só `console.error` |
| Type safety Supabase | B | `database.types.ts` CLI + aliases; drift `user_question_answers` aberto |

**Gates locais hoje:**
- `npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run build` — **verde**
- `supabase gen types typescript --linked` — funciona com `SUPABASE_DB_PASSWORD` (sem Docker)

---

## Fase 1 — Fundação (1–2 semanas)

Objetivo: impedir regressões, limpar o monorepo e estabelecer gates automáticos.

### Etapa 1.1 — CI mínimo (GitHub Actions)

**Objetivo:** todo PR passa por lint, typecheck, test e build antes de merge.

**Critérios de aceite:**
- [x] `.github/workflows/ci.yml` criado
- [x] Jobs: `lint`, `typecheck`, `test:shared`, `build` (web + admin)
- [x] CI falha se qualquer gate falhar
- [x] `docs/CHECKLIST-PR.md` documenta gates locais

**Arquivos prováveis:**
- `.github/workflows/ci.yml` (novo)
- `package.json` (scripts se necessário)

**Entrega:** concluída (2026-06)

<details>
<summary><strong>Prompt — Etapa 1.1</strong></summary>

```
Contexto obrigatório: leia CONTEXT.md e .cursor/rules/ antes de começar.

Tarefa: configurar CI mínimo para o monorepo Broto (Turborepo + npm workspaces).

Requisitos:
1. Criar .github/workflows/ci.yml com jobs paralelos: lint, typecheck, test:shared, build.
2. Usar Node 20+, cache de npm, turbo remote cache opcional (não obrigatório).
3. Escopo: apps/web, apps/admin, packages/shared, supabase/functions (lint only).
4. NÃO incluir apps/mobile no CI (será removido na etapa 1.3).
5. Documentar em 2-3 linhas no README ou docs/ como reproduzir localmente.

Gates de verificação (rodar e mostrar output):
- npm run lint
- npm run typecheck (pode falhar no admin — anotar, não bloquear merge até 1.2)
- npm run test:shared
- npm run build

Restrições:
- Não alterar lógica de negócio
- Não commitar secrets
- Seguir convenções em .cursor/rules/
```

</details>

---

### Etapa 1.2 — Corrigir typecheck do admin

**Objetivo:** `npm run typecheck` verde em todo o monorepo.

**Critérios de aceite:**
- [x] `apps/admin/src/router.tsx` sem erros TS
- [x] `npm run typecheck` verde (web + admin + shared)
- [x] Nenhuma regressão de navegação no admin

**Arquivos prováveis:**
- `apps/admin/src/router.tsx`
- `apps/admin/package.json` (versão react-router-dom se necessário)

**Entrega:** concluída (2026-06)

<details>
<summary><strong>Prompt — Etapa 1.2</strong></summary>

```
Contexto obrigatório: leia CONTEXT.md e .cursor/rules/03-qualidade-codigo.mdc.

Tarefa: corrigir o erro de typecheck no admin.

Erro atual:
apps/admin/src/router.tsx(72,7): 'v7_startTransition' does not exist in type 'Partial<Omit<FutureConfig, "v7_prependBasename">>'.

Abordagem:
1. Ler apps/admin/src/router.tsx e package.json (react-router-dom version).
2. Corrigir com a menor mudança possível: remover flag incompatível OU atualizar react-router-dom de forma compatível com web.
3. Verificar que as rotas protegidas e layouts continuam funcionando.

Gates:
- npm run typecheck (deve passar 100%)
- npm run build --workspace=@broto/admin

Restrições: diff mínimo, sem refatorar rotas além do necessário.
```

</details>

---

### Etapa 1.3 — Remover módulo mobile

**Objetivo:** eliminar `apps/mobile/` e referências no monorepo.

**Critérios de aceite:**
- [x] Pasta `apps/mobile/` removida
- [x] `package.json` raiz sem referências a mobile nos scripts format/format:check
- [x] Nenhum import quebrado em web, admin ou shared
- [x] `npm run lint typecheck test:shared build` verde

**Arquivos prováveis:**
- `apps/mobile/` (deletar)
- `package.json` (raiz)
- `package-lock.json`
- `eslint.config.mjs` (remover globs mobile se existirem)
- `.planning/PROJECT.md` (atualizar escopo)

**Entrega:** concluída (2026-06)

<details>
<summary><strong>Prompt — Etapa 1.3</strong></summary>

```
Contexto obrigatório: leia CONTEXT.md e .cursor/rules/01-arquitetura-monorepo.mdc.

Tarefa: remover o módulo mobile do monorepo com segurança.

Pré-condição verificada: web e admin NÃO importam apps/mobile (zero dependências cruzadas).

Passos:
1. Deletar apps/mobile/ inteiro.
2. Remover referências em package.json raiz (scripts format, format:check).
3. Limpar eslint.config.mjs de globs apps/mobile/** se existirem.
4. Rodar npm install para regenerar lockfile.
5. Atualizar .planning/PROJECT.md — remover menções a mobile como app ativo.
6. NÃO remover classes CSS broto-mobile-* no web (são estilos responsivos, não dependência).

Gates (todos devem passar):
- rg "apps/mobile|broto-mobile" --glob "*.{ts,tsx,json}" (só lockfile residual ok até npm install)
- npm run lint
- npm run typecheck
- npm run test:shared
- npm run build

Restrições: não tocar em supabase/, não alterar lógica web/admin além de imports quebrados (não deve haver nenhum).
```

</details>

---

### Etapa 1.4 — Higiene de repositório

**Objetivo:** remover artefatos que não devem estar no git.

**Critérios de aceite:**
- [ ] `dist/` e `apps/web/dist/` removidos do tracking git (se commitados)
- [ ] `.env` nunca commitado (verificar histórico recente)
- [ ] `npm run format:check` verde

**Arquivos prováveis:**
- `.gitignore` (confirmar entradas)
- `dist/`, `apps/web/dist/` (git rm --cached)

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 1.4</strong></summary>

```
Contexto obrigatório: leia .cursor/rules/04-producao.mdc.

Tarefa: higiene do repositório para produção.

Passos:
1. Verificar se dist/ ou apps/web/dist/ estão tracked no git — se sim, git rm -r --cached e confirmar .gitignore.
2. Verificar apps/*/.env — devem estar gitignored; garantir .env.example atualizado em cada app.
3. Rodar npm run format:check — corrigir falhas.
4. Rodar npm run lint — corrigir erros (não warnings opcionais).

Gates:
- git status limpo após mudanças
- npm run format:check
- npm run lint
- npm run typecheck
- npm run test:shared

Não commitar arquivos .env com valores reais.
```

</details>

---

### Gate da Fase 1

Todos devem passar antes de avançar:

```bash
npm run lint && npm run typecheck && npm run test:shared && npm run build
```

CI no GitHub verde no branch principal.

---

## Fase 2 — Qualidade (2–3 semanas)

Objetivo: código manutenível, testado e sem duplicação crítica.

### Etapa 2.1 — Quebrar arquivos gigantes (web)

**Objetivo:** nenhum arquivo TS/TS de produção com mais de 600 linhas nas páginas principais.

**Prioridade (ordem):**
1. ~~`apps/web/src/pages/StudyArea.tsx`~~ — **feito** (~139 linhas; subcomponentes em `study-area/`)
2. `apps/web/src/components/mock-exam/MockExamConfigurator.tsx` (~1504)
3. `apps/web/src/components/study/QuestionBankView.tsx` (~1221)
4. `apps/web/src/styles/app.css` (~23k) — extrair módulos CSS por feature

**Critérios de aceite:**
- [x] `StudyArea.tsx` dividido em subcomponentes/hooks
- [ ] Demais arquivos prioritários abaixo de 600 linhas
- [x] `npm run typecheck` e `npm run build` verdes

**Entrega:** parcial (StudyArea — 2026-06)

<details>
<summary><strong>Prompt — Etapa 2.1</strong></summary>

```
Contexto obrigatório: leia CONTEXT.md e .cursor/rules/03-qualidade-codigo.mdc.

Tarefa: refatorar apps/web/src/pages/StudyArea.tsx — extrair lógica sem mudar comportamento.

Abordagem (uma página por sessão):
1. Ler o arquivo inteiro e mapear: estado, efeitos, handlers, sub-views.
2. Extrair hooks customizados para lógica (ex: useStudyAreaSession, useStudyAreaFilters).
3. Extrair subcomponentes puros para UI (ex: StudyAreaHeader, StudyAreaQuestionPanel).
4. Manter exports públicos e rotas inalterados.
5. Lógica de negócio que for reutilizável → mover para packages/shared.

Regras:
- Diff incremental — um PR por arquivo grande
- Sem mudança de UX
- Named exports (convenção web)
- Testar manualmente: abrir /study-area, responder questão, navegar filtros

Gates:
- npm run typecheck --workspace=@broto/web
- npm run build --workspace=@broto/web
- Arquivo principal < 400 linhas após extração
```

</details>

---

### Etapa 2.2 — Consolidar duplicação residual em shared

**Objetivo:** reduzir drift entre web e código duplicado que sobrou.

**Alvos:**
- `useQuestionsFilters` — core em shared, adapters por app
- Tipos de questões duplicados
- Lógica de `api-client` — já parcialmente em shared; alinhar web

**Critérios de aceite:**
- [x] Core de filtros em `packages/shared/src/question-bank/filters-core.ts`
- [x] Web usa core + adapter fino (`useQuestionsFilters`)
- [x] Testes em shared para lógica extraída
- [x] `npm run test:shared` verde (38 testes)

**Entrega:** parcial (filters-core — 2026-06)

<details>
<summary><strong>Prompt — Etapa 2.2</strong></summary>

```
Contexto obrigatório: leia .cursor/rules/01-arquitetura-monorepo.mdc (regra: shared é platform-agnostic).

Tarefa: extrair core de useQuestionsFilters para packages/shared.

Passos:
1. Comparar apps/web/src/hooks/useQuestionsFilters.ts (se existir) com versão residual.
2. Identificar lógica pura (filtros, ordenação, estado derivado) vs efeitos de plataforma (storage, router).
3. Criar packages/shared/src/question-bank/filters-core.ts (ou nome alinhado ao domínio).
4. Escrever testes Vitest para o core ANTES ou junto da extração.
5. Refatorar web para consumir o core.

Proibido em packages/shared:
- import react, react-native, expo, @react-native/*

Gates:
- npm run test:shared
- npm run typecheck
- npm run build --workspace=@broto/web
```

</details>

---

### Etapa 2.3 — Testes nas edge functions

**Objetivo:** cobertura mínima de segurança e contrato nas functions críticas.

**Prioridade:**
1. `auth-signup` (já tem `validate_test.ts` — expandir)
2. `answer-question`
3. `class-join`
4. `_shared/authz.ts`
5. `_shared/cors.ts`

**Critérios de aceite:**
- [ ] Testes Deno (`Deno.test`) para validação de input e authz
- [ ] Script `npm run test:functions` ou equivalente no CI
- [ ] CI atualizado para rodar testes de functions

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 2.3</strong></summary>

```
Contexto obrigatório: leia .cursor/rules/02-seguranca.mdc e supabase/functions/_shared/authz.ts.

Tarefa: adicionar testes Deno para supabase/functions/_shared/authz.ts.

Cenários mínimos:
- requireUser: sem JWT → 401
- requireMembership: role insuficiente → 403
- requireClassAccess: usuário de outra org → 403
- Roles desconhecidas → fail closed (negar)

Passos:
1. Ler authz.ts e auth-signup/validate_test.ts como referência de estilo.
2. Criar supabase/functions/_shared/authz_test.ts com mocks de Supabase client.
3. Adicionar script de teste no package.json raiz ou supabase/README.
4. Integrar no CI (.github/workflows/ci.yml).

Gates:
- deno test supabase/functions/_shared/authz_test.ts (ou path correto)
- Testes passam sem rede (mock)

Não alterar comportamento de produção — só testes.
```

</details>

---

### Etapa 2.4 — Testes web críticos

**Objetivo:** Vitest no web para hooks e libs críticos.

**Alvos iniciais:**
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/contexts/AuthContext.tsx` (lógica testável extraída)
- `packages/shared` integrações usadas pelo web

**Critérios de aceite:**
- [x] Vitest configurado em `apps/web`
- [x] Pelo menos 10 testes novos (`api-client.test.ts` — 12)
- [x] CI roda `npm run test:web`

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 2.4</strong></summary>

```
Contexto obrigatório: leia packages/shared (vitest já configurado) como referência.

Tarefa: configurar Vitest em apps/web e testar api-client.

Passos:
1. Adicionar vitest + jsdom como devDeps em apps/web.
2. Criar vitest.config.ts alinhado ao tsconfig do web.
3. Testar withJwtRefreshRetry / retry integration (mock fetch).
4. Adicionar script "test": "vitest run" em apps/web/package.json.
5. Atualizar CI para incluir test do web.

Gates:
- npm run test --workspace=@broto/web
- npm run test:shared
- npm run typecheck
```

</details>

---

### Gate da Fase 2

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Cobertura mínima: shared (25+ testes), edge functions (authz + cors), web (10+ testes).

---

## Trilha Type Safety / Supabase (P6–P9)

Complementa a Fase 2 — foco em edge functions, tipos e auth. **Status:** ver `.planning/STATE.md`.

| Passe | Foco | Status |
|-------|------|--------|
| P6 | Typed clients, constantes missão, `topico-labels.ts` | Concluído |
| P7 | `requireUser()` (6 functions), `area_key`, `database.types.ts` CLI | Concluído |
| P8 | Script regen types, drift `user_question_answers`, casts, Deno.test | Concluído |
| P9 | Fase 2.3: authz (membership/class), cors, edge-api-types parsers | **Concluído** |

<details>
<summary><strong>Prompt — Passe 8 (Type Safety)</strong></summary>

Ver conversa / agente 2026-06-19 — escopo: `scripts/gen-database-types.sh`, migration drift `user_question_answers`, eliminar casts em `practice-session-*`, `authz_test.ts`, `daily-mission-bonus_test.ts`.

</details>

<details>
<summary><strong>Prompt — Passe 9 (Deno tests)</strong></summary>

Expandir Fase 2.3: `authz_test.ts` (requireMembership, requireClassAccess com mock), `cors_test.ts`, `edge-api-types_test.ts`. Sem alterar runtime.

</details>

---

## Fase 3 — Produção (1–2 semanas)

Objetivo: deploy confiável, observabilidade e segurança validada em staging.

### Etapa 3.1 — Deploy web (Vercel)

**Objetivo:** pipeline de deploy automático do web.

**Critérios de aceite:**
- [x] `apps/web/vercel.json` revisado (SPA rewrites, headers de segurança)
- [x] Deploy production — **www.brotoenem.com.br** (Vercel)
- [x] Variáveis documentadas; CORS produção verificado

**Entrega:** `docs/deploy-web.md`, `vercel.json`

<details>
<summary><strong>Prompt — Etapa 3.1</strong></summary>

```
Contexto obrigatório: leia .cursor/rules/04-producao.mdc e apps/web/vercel.json.

Tarefa: validar e documentar deploy do web na Vercel.

Passos:
1. Revisar apps/web/vercel.json — rewrites SPA, headers de segurança se ausentes.
2. Criar docs/deploy-web.md com: env vars, build command, output dir, preview vs production.
3. Verificar que npm run build --workspace=@broto/web produz dist/ válido.
4. Listar env vars obrigatórias em apps/web/.env.example.

Não commitar secrets. Documentar ALLOWED_ORIGINS para edge functions.
```

</details>

---

### Etapa 3.2 — Deploy admin

**Objetivo:** admin acessível em produção (subdomínio ou path separado).

**Critérios de aceite:**
- [ ] `apps/admin/vercel.json` ou config equivalente
- [ ] Build e deploy funcionando
- [ ] Auth admin validado em produção (membership teacher+)

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 3.2</strong></summary>

```
Contexto obrigatório: leia apps/admin/ e docs/broto-f2-admin.md.

Tarefa: preparar deploy do admin (Vercel ou static host).

Passos:
1. Criar apps/admin/vercel.json (modelo do web).
2. Garantir npm run build --workspace=@broto/admin verde.
3. Documentar URL de produção e env vars em docs/deploy-admin.md.
4. Verificar ProtectedRoute e roles no AdminAuthContext.

Gates:
- npm run build --workspace=@broto/admin
- npm run typecheck --workspace=@broto/admin
```

</details>

---

### Etapa 3.3 — Deploy edge functions automatizado

**Objetivo:** script único e reproduzível para deploy de todas as functions.

**Critérios de aceite:**
- [x] Script `scripts/deploy-functions.sh`
- [x] Documentado em `docs/deploy-functions.md`
- [x] `ALLOWED_ORIGINS` — brotoenem.com.br + www (`npm run verify:cors`)

**Entrega:** scripts + docs + verify CORS

<details>
<summary><strong>Prompt — Etapa 3.3</strong></summary>

```
Contexto obrigatório: leia supabase/functions/_shared/cors.ts e docs/multi-tenant/.

Tarefa: unificar deploy das edge functions Supabase.

Passos:
1. Auditar supabase/deploy-simulado-functions.sh e deploy-functions.ps1 — consolidar em um script.
2. Script deve: supabase functions deploy (todas), validar ALLOWED_ORIGINS.
3. Documentar secrets necessários (service role, notebooklm, etc.) — nomes apenas, sem valores.
4. Checklist pós-deploy: curl OPTIONS com Origin válido/inválido.

Gates:
- Script executável e idempotente
- docs/deploy-functions.md completo
```

</details>

---

### Etapa 3.4 — Validação RLS multi-tenant (staging)

**Objetivo:** matriz de testes RLS executada em ambiente real.

**Critérios de aceite:**
- [ ] `supabase/tests/pr08_rls_matrix_manual.sql` executado em staging
- [ ] Checklist `docs/multi-tenant/multi-tenant-implementation-pr-checklist.md` marcado
- [ ] Nenhum cenário crítico falhando (cross-tenant leak)

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 3.4</strong></summary>

```
Contexto obrigatório: leia docs/multi-tenant/multi-tenant-permissions-matrix.md e supabase/RLS-CONTRACT.md (se existir).

Tarefa: preparar e executar validação RLS em staging (humano + script).

Passos:
1. Ler docs/multi-tenant/multi-tenant-implementation-pr-checklist.md.
2. Criar docs/multi-tenant/RLS-STAGING-RESULTS.md com tabela: cenário | esperado | resultado | data.
3. Automatizar o que for possível via supabase/tests/ (sem substituir validação manual de cross-tenant).
4. Documentar qualquer policy que precisar de fix — abrir issue por falha.

Não alterar policies sem evidência de falha. Fail closed é o padrão correto.
```

</details>

---

### Etapa 3.5 — Observabilidade (Sentry ou equivalente)

**Objetivo:** erros de produção visíveis em web, admin e edge functions.

**Critérios de aceite:**
- [ ] Sentry (ou similar) no web e admin
- [ ] Edge functions: captura de exceções não tratadas
- [ ] Source maps em produção (web)
- [ ] DSN via env var, nunca hardcoded

**Entrega:** _commit pendente_

<details>
<summary><strong>Prompt — Etapa 3.5</strong></summary>

```
Contexto obrigatório: leia .cursor/rules/02-seguranca.mdc (sem secrets no client além do que é público).

Tarefa: integrar Sentry no apps/web.

Passos:
1. Adicionar @sentry/react como dependência do web.
2. Inicializar em main.tsx com VITE_SENTRY_DSN (opcional — só init se DSN presente).
3. ErrorBoundary no AppShell para erros React.
4. Atualizar apps/web/.env.example com VITE_SENTRY_DSN.
5. Documentar setup em docs/observability.md.

Gates:
- npm run build --workspace=@broto/web (bundle não quebra)
- Sem DSN → app funciona normalmente (graceful degradation)
```

</details>

---

### Gate da Fase 3

- [ ] Web em produção com URL pública
- [ ] Admin em produção
- [ ] Edge functions deployadas com CORS restritivo
- [ ] RLS validado em staging
- [ ] Sentry recebendo erros de teste

---

## Fase 4 — Novas features (contínuo)

Objetivo: adicionar funcionalidades com a base estável.

**Pré-requisito:** Fases 1–3 concluídas.

### Etapa 4.0 — Template para nova feature

Use este prompt para cada feature nova:

<details>
<summary><strong>Prompt — Template Feature</strong></summary>

```
Contexto obrigatório: leia CONTEXT.md e todas as .cursor/rules/.

Nova feature: [DESCREVER FEATURE]

Antes de implementar:
1. Confirmar se lógica vai em packages/shared (reutilizável) ou apps/web (UI específica).
2. Se tocar dados: verificar RLS e docs/multi-tenant/.
3. Se nova edge function: usar _shared/authz.ts e _shared/cors.ts.
4. Escrever testes antes ou junto (TDD preferível para shared e functions).

Implementação:
- Diff mínimo
- Sem duplicar lógica existente em shared
- Sanitizar HTML com DOMPurify em qualquer render de conteúdo ENEM

Gates obrigatórios:
- npm run lint
- npm run typecheck
- npm run test
- npm run build
- Teste manual do fluxo feliz + um edge case

Documentar: atualizar docs/ se mudar contrato de API ou permissões.
```

</details>

---

## Checklist rápido pré-merge (qualquer PR)

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

**Regras humanas:**
- Sem secrets em diff
- Sem `any` novo sem justificativa
- Sem arquivo novo > 400 linhas sem aprovação
- Edge function nova → authz + validação de input + teste

---

## Referências

| Documento | Uso |
|-----------|-----|
| `CONTEXT.md` | Índice mestre de contexto |
| `.planning/STATE.md` | **Status atual** (gates, progresso) |
| `.cursor/rules/*.mdc` | Regras para agentes |
| `docs/multi-tenant/` | Permissões e RLS |
| `docs/deprecated/` | ROADMAP/REQUIREMENTS históricos |
| `docs/CHECKLIST-PR.md` | Checklist de PR |
| `.planning/codebase/README.md` | Aviso: análise abril/2026 é snapshot |
| `supabase/functions/_shared/authz.ts` | Autorização |
| `packages/shared/` | Lógica de negócio |

---

## Histórico de execução

| Fase | Etapa | Status | Data | Notas |
|------|-------|--------|------|-------|
| 1 | 1.1 CI | ✅ | 2026-06 | `.github/workflows/ci.yml` |
| 1 | 1.2 Admin typecheck | ✅ | 2026-06 | `npm run typecheck` verde |
| 1 | 1.3 Remover mobile | ✅ | 2026-06 | `apps/mobile/` removido |
| 1 | 1.4 Higiene repo | 🟡 | — | `.venv`/assets — ver CONCERNS |
| 2 | 2.1 Arquivos grandes | 🟡 | 2026-06 | StudyArea feito; app.css pendente |
| 2 | 2.2 Consolidar shared | 🟡 | 2026-06 | filters-core + testes |
| 2 | 2.3 Testes functions | ⬜ | — | Próximo após P8 ou em paralelo |
| 2 | 2.4 Testes web | ⬜ | — | |
| — | P6 Type safety | ✅ | 2026-06 | Typed clients, labels |
| — | P7 Type safety | ✅ | 2026-06 | authz, area_key, gen types |
| — | P8 Type safety | ⬜ | — | Ver prompt na seção Trilha |
| 3 | 3.1 Deploy web | ⬜ | — | |
| 3 | 3.2 Deploy admin | ⬜ | — | |
| 3 | 3.3 Deploy functions | ⬜ | — | |
| 3 | 3.4 RLS staging | ⬜ | — | |
| 3 | 3.5 Observabilidade | ⬜ | — | |
