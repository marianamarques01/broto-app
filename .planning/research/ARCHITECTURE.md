# Architecture Research

**Domain:** Validacao e alinhamento de arquitetura multi-tenant (Broto existente)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Client Apps (Public Keys)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────────┐  │
│  │ apps/mobile     │  │ apps/web        │  │ apps/admin                 │  │
│  │ Expo + RN       │  │ React + Vite    │  │ React + Vite               │  │
│  │ user/student UX │  │ user/student UX │  │ admin/teacher UX           │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬─────────────┘  │
│           │                    │                           │                │
├───────────┴────────────────────┴───────────────────────────┴────────────────┤
│                         API Boundary (Edge Functions)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  user-me | pet-me | user-progress | class-join | broto-chat | material-index│
│  (auth check)                   + service_role DB access in functions       │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Data Boundary (Supabase DB)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ organizations → classes → enrollments → users.current_class_id             │
│ admin_profiles (admin scope), materials, user_question_answers, performance │
│ RLS policies + indexes + triggers                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `supabase/migrations/*` | Canonical tenant model and RLS rules | DDL, policies, indexes, triggers |
| `supabase/functions/*` | Runtime gate for client-facing operations | JWT auth + explicit authorization + DB queries |
| `apps/mobile/contexts/ClassContext.tsx` | Resolve current class and organization for student | Supabase client query on `users/classes/organizations` |
| `apps/web/src/contexts/ClassContext.tsx` | Same as mobile, but with separate query shape | Supabase client query chain (`users` then `classes`) |
| `apps/admin/src/*` | Admin read paths (indicators, profile scope) | Direct Supabase reads constrained by RLS/policies |
| `packages/shared/src/*` | Shared contracts only (types/API utils) | TypeScript types and function-name mapping |

## Recommended Project Structure

```
.planning/
└── architecture-validation/                     # NEW: milestone validation artifacts
    ├── tenant-model-map.md                     # NEW: conceptual vs implementation matrix
    ├── cross-tenant-paths.md                   # NEW: catalog of possible leakage paths
    ├── validation-checklist.md                 # NEW: executable checklist per boundary
    └── reports/
        └── rls-audit-report.md                 # NEW: policy coverage and gaps

supabase/
├── migrations/
│   ├── 20260317_foundation_organizations_classes.sql   # MODIFIED only if policy fixes needed
│   └── 20260323_indexes_rls_fixes.sql                  # MODIFIED only if hardening needed
├── tests/                                       # NEW: SQL validation tests (pgTAP or SQL scripts)
│   ├── tenant_isolation.sql
│   ├── membership_chain.sql
│   └── cross_tenant_denials.sql
└── functions/
    ├── material-index/index.ts                  # MODIFIED: enforce org-level admin authorization
    ├── broto-chat/index.ts                      # MODIFIED: keep enrollment check as required gate
    └── class-join/index.ts                      # MODIFIED: enforce class/org consistency guards

apps/
├── mobile/contexts/ClassContext.tsx             # MODIFIED: align logic contract with web
└── web/src/contexts/ClassContext.tsx            # MODIFIED: align logic contract with mobile
```

### Structure Rationale

- **`.planning/architecture-validation/`:** separa artefato de auditoria (evidencia) de artefato de implementacao (codigo).
- **`supabase/tests/`:** torna validacao de isolamento repetivel; reduz regressao silenciosa em policies.
- **`supabase/functions/`:** principal fronteira de risco por usar `service_role`; precisa de autorizacao explicita.
- **`apps/*/contexts/`:** onde divergencia mobile/web impacta cadeia membership -> class -> organization.

## Architectural Patterns

### Pattern 1: Permission Chain as First-Class Contract

**What:** toda decisao de acesso deve ser validada pela cadeia `subject -> membership -> class -> organization`.
**When to use:** Edge Functions, queries admin e carregamento de contexto de turma.
**Trade-offs:** mais joins e checagens; em troca, elimina autorizacao implicita fraca.

**Example:**
```typescript
// pseudocodigo de contrato de autorizacao
const user = requireAuth(req)
const membership = await db.enrollments.findActive(user.id, classId)
if (!membership) deny(403)

const cls = await db.classes.findById(classId)
if (!cls) deny(404)

if (cls.organization_id !== expectedOrganizationIdFromContext) deny(403)
```

### Pattern 2: Service-Role with Explicit Guard Rails

**What:** sempre que uma function usa `SUPABASE_SERVICE_ROLE_KEY`, ela precisa reproduzir as restricoes que o RLS faria.
**When to use:** `user-me`, `pet-me`, `user-progress`, `class-join`, `broto-chat`, `material-index`.
**Trade-offs:** codigo de autorizacao duplicado por endpoint; mas evita bypass acidental de isolamento.

**Example:**
```typescript
// edge function: nao confiar so em auth.getUser()
const { user } = await authedClient.auth.getUser()
if (!user) return unauthorized()

const canAccess = await adminClient
  .from('admin_profiles')
  .select('id')
  .eq('id', user.id)
  .eq('organization_id', targetOrgId)
  .maybeSingle()

if (!canAccess.data) return forbidden()
```

### Pattern 3: Dual-Client Consistency Gate (Mobile/Web)

**What:** mesma regra de tenancy deve ter o mesmo contrato de dados nos dois clientes.
**When to use:** `ClassContext`, join class flow e resolucao de organizacao ativa.
**Trade-offs:** reduz liberdade de implementacao por app; aumenta previsibilidade de comportamento.

**Example:**
```typescript
// contrato alvo para mobile e web
type ActiveScope = {
  userId: string
  currentClassId: string | null
  organizationId: string | null
}
```

## Data Flow

### Request Flow

```
[User Action: join class / open study / admin view]
    ↓
[Client Context] → [Edge Function or direct Supabase query] → [RLS/Explicit authorization]
    ↓                              ↓                                   ↓
[Scoped response] ← [membership->class->organization chain] ← [DB policies + filters]
```

### State Management

```
[current_class_id in users]
    ↓ (lookup)
[ClassContext mobile/web]
    ↓ (derive)
[current class + organization]
    ↓
[feature gates: chat/materials/progress/admin indicators]
```

### Key Data Flows

1. **Student scope resolution:** `auth.uid -> users.current_class_id -> classes.organization_id`.
2. **Authorization path:** `auth.uid -> enrollments(active) -> class_id -> organization_id`.
3. **Admin scope path:** `auth.uid -> admin_profiles.organization_id -> classes/materials/student data`.
4. **Cross-tenant risk path:** `service_role query without org filter` (must be blocked by explicit checks).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Manual SQL validation + checklist per release is sufficient |
| 1k-100k users | Automate RLS regression tests and edge-function authorization tests in CI |
| 100k+ users | Add policy observability, query-plan review for policy joins, and authz telemetry |

### Scaling Priorities

1. **First bottleneck:** silent policy drift between migrations and production state; fix with policy snapshot/audit automation.
2. **Second bottleneck:** authorization divergence between mobile/web/admin paths; fix with shared contract tests and API invariants.

## Anti-Patterns

### Anti-Pattern 1: "Auth checked, therefore authorized"

**What people do:** validar apenas `auth.getUser()` e seguir com query privilegiada.
**Why it's wrong:** autenticacao confirma identidade, nao escopo tenant.
**Do this instead:** exigir verificacao completa da cadeia membership/class/org antes de qualquer leitura/escrita tenant-scoped.

### Anti-Pattern 2: RLS assumed but bypassed in service code

**What people do:** acreditar que policy cobre endpoint executado com `service_role`.
**Why it's wrong:** `service_role` possui `BYPASSRLS`; sem guardas, vira acesso global.
**Do this instead:** tratar cada function com `service_role` como "mini policy engine" com filtros explicitos.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | JWT identity -> `auth.uid` claims | Base de identidade, nao de autorizacao tenant |
| Supabase Postgres + RLS | Policy-driven row filters for public clients | Requer cobertura completa por tabela exposta |
| Supabase Edge Functions | Trusted backend with service role | Precisa guard rails para evitar bypass de isolamento |
| NotebookLM service | Downstream service called by `broto-chat`/`material-index` | Deve receber apenas `class_id` ja autorizado |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `apps/mobile` <-> `supabase/functions` | REST-like path mapped by `@broto/shared` | Mesma semantica de permissao do web |
| `apps/web` <-> `supabase/functions` | Fetch + bearer token | Necessita paridade com mobile em fluxo de turma |
| `apps/admin` <-> `public.*` tables | Direct Supabase queries | Depende fortemente de policies admin corretas |
| `supabase/functions/*` <-> `public.*` | service-role DB operations | Principal ponto para detectar acesso cross-tenant |
| `ClassContext` mobile <-> web | Duplicated logic | Risco de deriva sem contrato comum |

## New vs Modified Artifacts (Explicit)

| Type | Artifact | Status | Why |
|------|----------|--------|-----|
| NEW | `.planning/architecture-validation/tenant-model-map.md` | New | Mapear modelo conceitual x implementacao atual |
| NEW | `.planning/architecture-validation/cross-tenant-paths.md` | New | Catalogar caminhos de vazamento e cobertura de mitigacao |
| NEW | `.planning/architecture-validation/validation-checklist.md` | New | Padronizar validacoes por camada |
| NEW | `supabase/tests/tenant_isolation.sql` | New | Testar negacao de acesso entre tenants |
| NEW | `supabase/tests/membership_chain.sql` | New | Testar regras membership -> class -> organization |
| MODIFIED | `supabase/functions/material-index/index.ts` | Modified | Adicionar autorizacao admin por organizacao (hoje ha TODO explicito) |
| MODIFIED | `supabase/functions/class-join/index.ts` | Modified | Garantir consistencia e restricoes adicionais na matricula |
| MODIFIED | `apps/mobile/contexts/ClassContext.tsx` | Modified | Alinhar contrato de escopo com web |
| MODIFIED | `apps/web/src/contexts/ClassContext.tsx` | Modified | Alinhar contrato de escopo com mobile |
| MODIFIED (if needed) | `supabase/migrations/*rls*.sql` | Conditional | Corrigir gaps de policy encontrados na auditoria |

## Execution Order (Dependency-Aware Build Order)

1. **Map model vs implementation (no code change first)**
   - Produce `tenant-model-map.md` with expected invariants.
   - Dependency: none.
   - Output: baseline for all subsequent validation.

2. **RLS coverage and policy audit**
   - Inventory `pg_policies`, enabled RLS tables, and role scopes.
   - Dependency: step 1 invariants.
   - Output: `rls-audit-report.md` with pass/fail per table and rule.

3. **Cross-tenant access-path analysis**
   - Enumerate all service-role code paths and direct client table reads.
   - Dependency: steps 1-2.
   - Output: `cross-tenant-paths.md` with severity and affected boundary.

4. **Hardening design (explicit new vs modified artifacts)**
   - Decide minimal set of function/policy/context changes.
   - Dependency: steps 1-3 findings.
   - Output: implementation backlog sequenced by blast radius.

5. **Implement backend guards first (functions + policies)**
   - Modify edge functions and SQL policies before client harmonization.
   - Dependency: step 4.
   - Reason: clients cannot compensate for weak server-side authz.

6. **Align mobile/web duplicated tenancy logic**
   - Harmonize `ClassContext` semantics and scope derivation.
   - Dependency: backend guards landed.
   - Reason: avoid dual behavior after server contract changes.

7. **Add regression validation scripts/tests**
   - Add SQL tests and runbooks for membership, RLS, and cross-tenant denials.
   - Dependency: steps 5-6.
   - Reason: lock-in guarantees and prevent future drift.

8. **Final conceptual-model signoff**
   - Reconcile expected model with observed behavior post-hardening.
   - Dependency: all prior steps.
   - Output: final alignment decision for roadmap phase closure.

## Data Flow Impact of This Plan

- **Before:** parte da seguranca depende de RLS; parte depende de checagem manual incompleta em functions com `service_role`.
- **After step 5:** autorizacao tenant torna-se explicita em todos os pontos privilegiados.
- **After step 6:** mobile/web passam a resolver escopo de turma/organizacao com contrato unico, reduzindo inconsistencias de permissao.
- **After step 7:** regressao de isolamento vira detectavel automaticamente.

## Sources

- `.planning/PROJECT.md` (escopo do milestone e objetivos de validacao)
- `supabase/migrations/20260317_foundation_organizations_classes.sql` (modelo tenant + policies base)
- `supabase/migrations/20260323_indexes_rls_fixes.sql` (hardening de RLS/indexes/triggers)
- `supabase/functions/class-join/index.ts` (join flow + service-role writes)
- `supabase/functions/material-index/index.ts` (TODO de autorizacao org-level)
- `supabase/functions/broto-chat/index.ts` (validacao de enrollment no runtime)
- `apps/mobile/contexts/ClassContext.tsx` e `apps/web/src/contexts/ClassContext.tsx` (duplicacao com risco de deriva)
- `apps/admin/src/hooks/useClassIndicators.ts` e `apps/admin/src/contexts/AdminAuthContext.tsx` (escopo admin via consultas diretas)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API keys and service role behavior](https://supabase.com/docs/guides/api/api-keys)
- [PostgreSQL `pg_policies` reference](https://www.postgresql.org/docs/current/view-pg-policies.html)

---
*Architecture research for: Broto multi-tenant architecture validation/alignment*
*Researched: 2026-04-03*
