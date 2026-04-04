# Stack Research

**Domain:** Validacao e alinhamento de arquitetura multi-tenant em app EdTech em producao
**Researched:** 2026-04-03
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase CLI | `2.84.2` (latest release em 2026-03-25) | Executar validacao local/remota de schema, RLS e testes SQL | E a trilha oficial para `supabase test db`, `supabase db lint`, `db diff` e integra sem migracao de stack. |
| PostgreSQL + pgTAP (extension `pgtap`) | pgtap extension atual do projeto Supabase (sem pin npm) | Testes de isolamento RLS e cadeia de permissao no nivel do banco | Valida regras de tenant isolation onde o risco real acontece (SQL/policy), com rollback rapido e repetivel. |
| Vitest | `4.1.2` (latest release em 2026-03-26) | Testes de integracao TypeScript para cenarios membership -> class -> organization via clientes Supabase | Cobre comportamento fim-a-fim de autorizacao percebido por mobile/web/admin sem introduzir Jest ou infra paralela. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `supabase` (CLI como devDependency) | `^2.84.2` | Padronizar comandos `supabase` em scripts do monorepo | Use para execucao consistente em CI e local via `npx supabase ...`, sem install global. |
| `@supabase/supabase-js` | manter versoes atuais por app (web/admin e mobile) | Cliente oficial para testes de comportamento RLS com usuarios reais | Use nos testes de integracao para provar isolamento entre tenants e negacoes cross-tenant. |
| `jscpd` | `^4.0.8` | Detector objetivo de duplicacao de regras/queries entre mobile e web | Use apenas como guardrail de consistencia nas areas de autorizacao/policies client-side. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `supabase test db` | Rodar suites SQL (`.test.sql`) para RLS e permission chain | Integrar em `supabase/tests/database/`; foco em testes negativos (acesso negado). |
| `supabase db lint --fail-on error` | Detectar erros de schema/PLpgSQL com `plpgsql_check` | Rodar em CI para evitar regressao silenciosa em funcoes/regras relacionadas a tenant. |
| `vitest --run` | Validar cenarios de autorizacao no nivel de app/service | Criar pacote de testes para fluxos membership/class/org com usuarios de orgs diferentes. |

## Installation

```bash
# Core
npm install -D supabase@^2.84.2 vitest@^4.1.2 jscpd@^4.0.8

# Supporting (se ainda nao existir no workspace alvo)
npm install @supabase/supabase-js

# Exemplo de scripts recomendados
# "test:db:rls": "npx supabase test db"
# "lint:db": "npx supabase db lint --fail-on error --linked"
# "test:tenant": "vitest --run --config vitest.config.ts"
# "guard:dup-permissions": "jscpd apps/mobile apps/web packages/shared --min-lines 20 --reporters console --pattern '**/*.{ts,tsx}'"
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `pgTAP` + `supabase test db` para RLS | Apenas testes TypeScript no app | Use alternativa so para smoke checks; nao substitui garantia de policy SQL. |
| Vitest para integracao TS | Jest | Use Jest apenas se ja houver base madura no repo (nao e o caso atual). |
| `jscpd` guardrail focado em autorizacao | Revisao manual de duplicacao | Use manual apenas no curto prazo; para regressao recorrente, automatizar e mais seguro. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Novo policy engine externo (OPA/Casbin/Permit) neste milestone | Introduz segunda fonte de verdade de autorizacao e aumenta risco de drift com RLS existente | Mantenha RLS no Postgres como enforcement canonico + testes pgTAP/Vitest para verificacao. |
| Migrar para ORM novo (Prisma/Drizzle) para "resolver tenancy" | Mudanca arquitetural grande, fora de escopo incremental e com alto risco de regressao | Ajustes cirurgicos em SQL policies, testes e contratos compartilhados em `packages/shared`. |
| Criar microservico de autorizacao separado agora | Over-engineering para objetivo de validacao/alinhamento | Consolidar cadeia de permissao no schema atual e validar com suites automatizadas. |
| Install global `supabase` via npm (`npm i -g supabase`) | Nao suportado oficialmente pelo Supabase CLI | Use `npx supabase` ou devDependency local no monorepo. |

## Stack Patterns by Variant

**If validacao de isolamento RLS (banco):**
- Use `supabase test db` + pgTAP em `supabase/tests/database/`
- Because garante prova objetiva de deny/allow por tenant sem depender de comportamento do frontend

**If validacao de consistencia mobile/web/admin (aplicacao):**
- Use Vitest com cenarios multi-usuario (org A nao acessa dados da org B)
- Because captura divergencia de implementacao duplicada e confirma regra funcional de ponta a ponta

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `supabase@^2.84.2` (CLI) | Node.js `>=20` | Ambiente atual (Node 24.x) ja e compativel. |
| `vitest@^4.1.2` | TypeScript `5.4+` | Alinha com stack atual do monorepo. |
| `supabase db lint` | Projeto local/remoto Supabase | Suporta `--linked`, `--schema`, `--fail-on`; ideal para CI incremental. |

## Integration Impact (existing stack)

- **Supabase migrations/tests:** adicionar suite em `supabase/tests/database/` para validar cadeia `membership -> class -> organization` e cenarios cross-tenant (read/write negados).
- **Monorepo scripts (root `package.json`):** incluir `test:db:rls`, `lint:db`, `test:tenant` e `guard:dup-permissions`.
- **Shared contract (`packages/shared`):** centralizar helper de escopo de tenant (ex.: resolver `organization_id` efetiva) para reduzir drift entre mobile/web.
- **Apps mobile/web/admin:** manter fluxo atual, mas rodar mesma matriz de testes de autorizacao para identificar divergencia por duplicacao.
- **CI:** gate minimo sugerido: `lint:db` + `test:db:rls` + `test:tenant`; bloqueia merge quando isolamento falhar.

## Sources

- [Supabase Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview) — validacao oficial de RLS com pgTAP e testes app-level (HIGH)
- [Supabase pgTAP extension docs](https://supabase.com/docs/guides/database/extensions/pgtap) — funcoes `policies_are`, `results_eq` etc. (HIGH)
- [Supabase CLI Getting Started](https://supabase.com/docs/guides/cli/getting-started?platform=npm) — install suportada, Node >=20, sem `npm -g` (HIGH)
- [Supabase CLI latest release](https://github.com/supabase/cli/releases/latest) — versao atual `v2.84.2` (MEDIUM-HIGH)
- [Supabase CLI `db lint` reference](https://supabase.com/docs/reference/cli/supabase-db-lint) — `--fail-on`, `--linked`, `--schema` (HIGH)
- [Vitest latest release](https://github.com/vitest-dev/vitest/releases/latest) — versao atual `v4.1.2` (MEDIUM-HIGH)
- [jscpd npm package](https://www.npmjs.com/package/jscpd) — versao `4.0.8` para guardrail de duplicacao (MEDIUM)

---
*Stack research for: Validacao/alinhamento multi-tenant em Broto*
*Researched: 2026-04-03*
