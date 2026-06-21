# Plano de refatoração seguinte (pós multi-tenant v1.1)

**Gerado:** 2026-04-04  
**Escopo:** Estado do repositório na branch `gsd/milestone-v1.1-multi-tenant-architecture` (HEAD alinhado com `origin`).  
**Objetivo:** Deixar o monorepo **auditável, consistente e pronto** para as próximas fases de produto, depois do trabalho multi-tenant em curso.

**Atualização (2026-04-04, `main`):** `npm run format:check` está **verde**; a lista de 11 ficheiros falhados referia outro snapshot/revisão.

**Atualização (2026-04-05):** Fases **B–D** do plano (equivalente ROADMAP 2–4) estão **entregues no código**: `createCachedStore`/401/ClassContext/daily-missions, consolidação em `@broto/shared` (missões, study mock, tipos, fetchers, retry, `runAfterAnswerSubmitted`), Vitest + `turbo run test`. **Permanecem** Fase **A** (lint `no-floating-promises` verde em todo o repo — tooling), **E** (multi-tenant RLS/CORS em staging), e requisitos **CONS-03**, **CONS-05**, **BUGF-05** em aberto — ver `.planning/REQUIREMENTS.md` e `.planning/ROADMAP.md` (Follow-ups).

---

## Resumo executivo

Grande parte dos **guardrails da Phase 01 (tooling, ESLint em `packages/shared`, CORS nas Edge Functions, `tsconfig.base.json`, remoção de `packages/ui`) já está refletida no código**. As **migrações e planos PR-08 (RLS)** existem em `supabase/migrations/` e há **contexto de organização** (`OrganizationContext`, `OrganizationSwitcher`) em mobile e web, alinhado ao checklist `docs/multi-tenant/multi-tenant-implementation-pr-checklist.md`.

*Histórico (2026-04-04):* o estado em `.planning/` estava por vezes atrás do código; **2026-04-05:** `ROADMAP.md`, `STATE.md` e `REQUIREMENTS.md` foram **reconciliados** com o repositório **v1.1** e com a onda de consolidação (fases 2–4). O relatório `01-VERIFICATION.md` sobre SVGs específicos pode permanecer como **histórico** até revalidação explícita.

*Histórico (2026-04-04):* `format:check` falhava em vários ficheiros. **Situação atual:** correr `npm run format:check` no HEAD da branch de trabalho; tratar falhas como regressão de higiene.

**Testes unitários:** `packages/shared` passa a incluir **Vitest** (`npm run test` / `npm run test:shared`). Actualizar `.planning/codebase/TESTING.md` e geradores de docs em oportunidade futura.

**Recomendação central:** (1) corrigir formatação e sincronizar artefatos GSD; (2) executar a **fila original de bugs/consolidação/testes** (`ROADMAP.md` fases 2–4), adaptada ao que já foi feito em multi-tenant; (3) fechar **verificação humana** de RLS/CORS em staging conforme checklist.

---

## 1. GSD Phase 01 + multi-tenant: aplicado no código? Finalizado?

### Evidência no código (alto grau de confiança)

| Item (Phase 01 / segurança) | Estado no repo | Evidência |
|------------------------------|----------------|-----------|
| ESLint: `packages/shared` sem React/plataforma | Aplicado | `eslint.config.mjs` — bloco `files: ['packages/shared/src/**']` com `no-restricted-imports` |
| CORS fail-closed + util compartilhada | Aplicado | `supabase/functions/_shared/cors.ts`; **7** funções importam o módulo (`user-me`, `pet-me`, `user-progress`, `broto-chat`, `class-join`, `material-index`, `auth-signup`) |
| Hash em `.git-blame-ignore-revs` | Aplicado | Entrada de 40 caracteres presente |
| `packages/ui` | Removido | Pasta `packages/ui` ausente; nenhum `@broto/ui` em `package.json` |
| Hooks mobile em camelCase (TOOL-07) | Aplicado | `apps/mobile/hooks/*.ts` — `useAuth.ts`, `usePet.ts`, etc. |
| Multi-tenant RLS (PR-08) | Aplicado no SQL | Migrações `20260410120000_pr08_rls_membership_core.sql`, `20260412120000_pr08_2_fix_classes_rls_recursion.sql` com `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` |
| PR-09 (contexto de organização) | Parcialmente aplicado | `OrganizationContext.tsx` / `OrganizationSwitcher` em web e mobile; `ClassContext` usa `useOrganization` |

### Evidência em artefatos GSD (2026-04-05)

- **`ROADMAP.md`:** fases 1–4 marcadas fechados; tabela de progresso e follow-ups (CONS-03, CONS-05, BUGF-05) actualizados.
- **`STATE.md`:** milestone **v1.1** `codebase-consolidation`; fases 2–4 **closed**; foco actual **Fase E** / backlog residual.
- **`REQUIREMENTS.md`:** checkboxes e traceability alinhados ao código; **Open** explícitos: TOOL-06 (violações remanescentes), BUGF-05, CONS-03, CONS-05.
- **`01-VERIFICATION.md`:** útil como **histórico**; revalidar gates de asset se necessário.

### Conclusão objetiva (2026-04-05)

- **Aplicado no código:** sim — Phase 01 + ondas 2–4 de consolidação + multi-tenant em evolução.  
- **Documentação GSD:** **sincronizada** com o entregue (exc. notas históricas em `01-VERIFICATION.md`). **Tooling:** confirmar `format:check` no CI/local; **lint** global ainda com dívidas (TOOL-06).

---

## 2. Ficheiros `.planning/`: obsoletos vs necessários (sem apagar nada aqui)

**Regra pedida:** não apagar `RESEARCH.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `PLAN.md` ativos sem evidência forte. Esta secção apenas **recomenda**.

### Manter (trilho de auditoria / planeamento)

- `ROADMAP.md`, `PROJECT.md`, `REQUIREMENTS.md`, `config.json`
- `phases/01-tooling-hygiene-security/*-PLAN.md`, `01-RESEARCH.md`, `1-CONTEXT.md`
- `phases/01-tooling-hygiene-security/01-VERIFICATION.md` — **histórico**; marcar mentalmente que precisa **revalidação**
- `phases/multi-tenant-architecture/PR-08-RLS-PLAN.md` — alinhado a `docs/multi-tenant/*`
- `.planning/research/*` e `.planning/codebase/*` — baseline de 2026-04-02; **atualizar conteúdo** preferível a apagar

### Obsoleto / STALE (corrigir ou arquivar — não apagar por omissão)

| Artefacto | Problema | Ação recomendada |
|-----------|----------|------------------|
| `STATE.md` | Contadores e milestone errados | **Atualizar** após fecho de sprint / milestone |
| `ROADMAP.md` (secção Progress) | “0/5”, Phase 1 `[ ]` no topo vs planos `[x]` | **Reconciliar** checkboxes e tabela com a realidade |
| `REQUIREMENTS.md` | Nenhum `[x]` | **Marcar satisfeitos** com referência a PR/commit |
| `01-VERIFICATION.md` | SVGs listados inexistentes | **Nova verificação** ou nota de supersedeção |
| `.planning/codebase/CONVENTIONS.md` | Mobile hooks “kebab-case”; `@broto/ui` nas importações | **Atualizar** para refletir hooks camelCase e remoção do pacote |
| `research/SUMMARY.md` vs `phases/01/*-SUMMARY.md` | Sobreposição de narrativa | **Manter** ambos como registo de ondas; só considerar fusão se a equipa quiser menos ficheiros |

### Apagar (só com confirmação humana — evidência de redundância)

**Não recomendado apagar** neste momento: os `*-SUMMARY.md` da Phase 01 podem duplicar narrativa dos PLANs, mas servem de **registo de execução** e são pequenos. **Só** se alguém confirmar que o histórico git basta, poderão ser arquivados num único `ARCHIVE-phase-01.md`.

**Enquanto a Phase 1 não estiver formalmente fechada (Prettier verde + artefatos GSD alinhados), não deve haver limpeza agressiva de `.planning/`.**

---

## 3. Reauditoria: inconsistências vs `CLAUDE.md` e `.planning/codebase/*`

| Tema | Documentação | Realidade no repo | Nota |
|------|----------------|-------------------|------|
| Pacote `@broto/ui` | `CLAUDE.md` (embed STACK) e `CONVENTIONS.md` | Pacote **não existe**; sem dependência | Atualizar gerador de `CLAUDE.md` / docs geradas |
| Nomenclatura de ficheiros mobile (hooks) | `CONVENTIONS.md`: kebab-case | Ficheiros **camelCase** `.ts` | Decisão em `PROJECT.md` (padronizar com web) — **atualizar CONVENTIONS** |
| Estilo mobile (semicolons / indent) | Documentado como divergente do Prettier | Prettier abrange mobile nos globs; **11 ficheiros** falham `format:check` | Ou corrigir estilo, ou documentar exceção explícita (não deixar meio-termo) |
| Testes | “No unit test framework” | Confirmado — sem Vitest/Jest nos `package.json` raiz pesquisados | Plano fase 4 ainda válido |
| CORS / Edge Functions | Descrito em ARCHITECTURE | Implementação em `_shared/cors.ts` | Coerente |
| RLS multi-tenant | Checklist em `docs/multi-tenant/` | Migrações `pr08_*` presentes | Falta **matriz de testes** e validação em ambiente real (checklist PR-08) |
| Duplicação de lógica | CRITICAL-ANALYSIS / research | CONS-01/02/04/ADPT/RESL entregues; **CONS-03** (area metadata), **CONS-05** (`useClass` core) em backlog | Ver ROADMAP Follow-ups |

### Alinhamento `docs/multi-tenant/` ↔ `supabase/migrations/`

- Checklist PR-08: políticas por `organization_memberships` — **presente** nas migrações citadas.
- PR-09/PR-10: admin já consulta `organization_memberships` (`AdminAuthContext.tsx`); critérios finais do checklist exigem **auditoria** e possíveis limpezas de caminhos legados — tratar como trabalho **não só documental**.

---

## 4. Fases de refatoração priorizadas (numeradas)

### Fase A — Higiene imediata: Prettier + sincronização GSD

**Objetivo:** Restaurar `format:check` verde e alinhar `.planning/` ao estado real do código (v1.1).

**Critérios de sucesso**

- `npm run format:check` → exit 0.
- `ROADMAP.md` / `STATE.md` / `REQUIREMENTS.md` refletem Phase 01 e multi-tenant **sem contadores fantasmas**.
- Nota curta em `01-VERIFICATION.md` ou novo ficheiro de verificação datado, se os critérios de asset (HYGN-02) mudaram.

**Riscos**

- Diffs grandes só de formatação — mitigar com commit atómico de style (e entrada em `.git-blame-ignore-revs` se política da equipa mantiver esse fluxo).

**Verificação**

```bash
npm run format:check
npm run lint
npm run typecheck
```

---

### Fase B — Bugs e propagação de erros (ex-Phase 2 do ROADMAP)

**Estado (2026-04-05):** **Entregue** no código (cache, 401, ClassContext, daily-missions).

**Objetivo:** Corrigir condições de corrida e erros silenciosos antes de mais consolidação.

**Critérios de sucesso** (herdados do ROADMAP)

- `createCachedStore.refresh()` sem pedidos duplicados em rajada.
- Tratamento 401 no mobile sem loop; uma única sequência de sign-out.
- `ClassContext` e `daily-missions` com estado de erro visível ou propagado (conforme desenho UX).

**Riscos**

- Regressões em auth e cache — testar manualmente login, troca de org, refresh.

**Verificação**

```bash
npm run lint
npm run typecheck
# Smoke manual: login, turma, troca de organização, responder questão
```

---

### Fase C — Consolidação em `@broto/shared` (ex-Phase 3)

**Estado (2026-04-05):** **Entregue** com excepção **CONS-03** (area-config) e **CONS-05** (`useClass` core), documentadas no ROADMAP.

**Objetivo:** Reduzir duplicação mobile/web; manter shared **sem React**; adaptadores para storage.

**Critérios de sucesso** (ajustar às linhas já movidas, ex. `organization-tenant`)

- Tipos e módulos listados no ROADMAP (area config, answer flow, etc.) com **uma fonte** em `packages/shared` onde aplicável.
- API clients com retry/backoff (RESL-*) quando a fase for planeadas.

**Riscos**

- “Invalid hook call” se React entrar em shared — ESLint já ajuda; manter revisão em PR.

**Verificação**

```bash
npm run lint
npm run typecheck
npm run build
```

---

### Fase D — Fundação de testes (ex-Phase 4)

**Estado (2026-04-05):** **Entregue** — Vitest, `turbo run test`, testes para store / daily-missions / `runAfterAnswerSubmitted`.

**Objetivo:** Vitest (ou equivalente acordado) em `packages/shared`; testes de regressão para cache e domínios críticos.

**Critérios de sucesso**

- Comando único documentado (ex. `npm test` no pacote ou `turbo run test`) com suite a passar.
- Testes com `IStorage` mock para lógica de missões/diárias.

**Riscos**

- Custo de setup Turbo — validar `turbo.json` quando a tarefa `test` existir.

**Verificação**

```bash
# após introdução do runner
cd packages/shared && npx vitest run
# ou
npm run test --workspace=@broto/shared
```

---

### Fase E — Encerramento multi-tenant (segurança e contrato)

**Objetivo:** Cumprir gates do checklist: matriz RLS, CORS em deploy, remoção gradual de authz legada onde PR-10 exige.

**Critérios de sucesso**

- Execução da matriz de testes RLS descrita em `PR-08-RLS-PLAN.md` / checklist.
- Confirmação de `ALLOWED_ORIGINS` em produção (comportamento humano já referido em `01-VERIFICATION.md`).
- Documentação `docs/multi-tenant-permissions-matrix.md` (e afins) coerente com código.

**Riscos**

- Policies incorretas bloqueiam utilizadores — **staging obrigatório**.

**Verificação**

```bash
# SQL de verificação se existirem em supabase/tests/
# Ex.: scripts referidos no checklist PR-10
ls supabase/tests 2>/dev/null
# + testes manuais cross-tenant na UI
```

---

## 5. Validação Nyquist

Em `.planning/config.json`, `workflow.nyquist_validation` está **`false`**. A secção formal de “Validation Architecture” do research GSD **não é obrigatória** neste ciclo; as **comandos de verificação** acima substituem-na para este plano.

---

## 6. Fontes consultadas (esta auditoria)

- `.planning/ROADMAP.md`, `STATE.md`, `PROJECT.md`, `REQUIREMENTS.md`, `config.json`
- `.planning/phases/01-tooling-hygiene-security/01-VERIFICATION.md`
- `.planning/phases/multi-tenant-architecture/PR-08-RLS-PLAN.md`
- `CLAUDE.md` (trechos STACK/CONVENTIONS embed)
- `docs/multi-tenant/multi-tenant-implementation-pr-checklist.md`
- `eslint.config.mjs`, `.git-blame-ignore-revs`, `supabase/functions/_shared/cors.ts`
- `supabase/migrations/*pr08*.sql`
- Comandos: `git status`, `npm run format:check`, listagem de `apps/mobile/hooks`

---

*Documento gerado para consumo do orquestrador; não altera ficheiros além deste.*
