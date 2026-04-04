# Checklist Executável por PR — Refatoração Multi-Tenant

> Base: `docs/multi-tenant-architecture-refactor-plan.md`
> Objetivo: quebrar o roadmap em PRs pequenos, revisáveis e seguros para deploy incremental.

## Estratégia de branch e merge

- Uma PR por bloco funcional (sem misturar DB + frontend grande no mesmo diff).
- Ordem obrigatória: PR-01 -> PR-10.
- Merge com feature flags quando houver risco de regressão.
- Não remover legado antes da etapa de contract.

## PR-01 — Schema base de memberships

### Escopo
- Criar tabela `organization_memberships`.
- Criar índices e constraints básicas.
- Sem alteração de comportamento em runtime.
 
### Validação
- Migração sobe em ambiente local/staging.
- Tabela criada com índices esperados.

### Risco
- Baixo (aditivo).

### Critério de merge
- DDL idempotente + sem impacto no fluxo atual.

---

## PR-02 — `current_organization_id` em `users`

### Escopo
- Adicionar `users.current_organization_id` (nullable inicialmente).
- Índice em `current_organization_id`.

### Validação
- Coluna disponível em consultas de perfil.
- Nenhum fluxo existente quebrado.

### Risco
- Baixo.

### Critério de merge
- Compatibilidade total com código atual.

---

## PR-03 — Backfill de dados (membership + contexto)

### Escopo
- Script de backfill:
  - memberships por `admin_profiles`;
  - memberships por `enrollments -> classes.organization_id`;
  - preencher `current_organization_id` via `current_class_id`.
- Relatório de inconsistências (órfãos/conflitos).

### Validação
- 100% dos usuários com turma ativa têm `current_organization_id`.
- Sem duplicidade ativa por usuário+organização.

### Risco
- Médio (qualidade de dados existentes).

### Critério de merge
- Relatório pós-backfill anexado e aprovado.

---

## PR-04 — Helpers de authz compartilhados nas Edge Functions

### Escopo
- Criar módulo `_shared/authz` com:
  - `requireUser`,
  - `requireMembership`,
  - `requireClassAccess`,
  - `resolveActiveContext`.
- Sem trocar toda lógica ainda, apenas introdução e uso piloto.

### Validação
- Testes unitários/integração dos helpers.
- Sem alteração funcional em endpoints não migrados.

### Risco
- Médio.

### Critério de merge
- Helpers aprovados e reutilizáveis por todas as functions.

---

## PR-05 — Hardening do `material-index` (crítico)

### Escopo
- Tornar auth obrigatória (remover auth opcional).
- Exigir role válida no tenant da turma/material.
- Negar acesso cross-tenant explicitamente.

### Validação
- Casos negativos: sem token, token inválido, role insuficiente, tenant errado.
- Caso positivo: admin/professor autorizado.

### Risco
- Alto (endpoint sensível com `service_role`).

### Critério de merge
- 0 bypass de autorização.

---

## PR-06 — Refatoração transacional do `class-join`

### Escopo
- Tornar join transacional:
  1. validar turma ativa,
  2. criar/reativar membership da organização,
  3. criar/reativar enrollment,
  4. atualizar `current_organization_id` e `current_class_id`.
- Idempotência para joins repetidos.

### Validação
- Estado final consistente em todos os cenários (novo, reentrada, matrícula inativa).
- Sem estados parciais após falha.

### Risco
- Alto (fluxo central de entrada).

### Critério de merge
- Testes de concorrência e idempotência aprovados.

---

## PR-07 — Signup centralizado com regra ENEM26

### Escopo
- Padronizar signup server-side.
- Garantir entrada inicial em ENEM26 conforme regra definida.
- Suporte ao estado “sem organização ativa” com fallback controlado quando aplicável.

### Validação
- Web e mobile convergindo para o mesmo fluxo de criação de conta.
- Usuário recém-criado sempre em estado inicial válido.

### Risco
- Médio/alto (onboarding e auth).

### Critério de merge
- Fluxo de signup único e consistente entre clientes.

---

## PR-08 — RLS final tenant-scoped por memberships

### Escopo
- Reescrever policies para usar `organization_memberships` como fonte primária.
- Enforcement de coerência de tenant em `enrollments`.
- Manter fallback legado temporário sob janela de transição (se necessário).

### Validação
- Test matrix RLS:
  - aluno org A não acessa org B,
  - professor/admin só no tenant autorizado,
  - multi-org com contexto ativo coerente.

### Risco
- Alto (pode bloquear produção se policy errada).

### Critério de merge
- Testes RLS completos + aprovação em staging.

---

## PR-09 — Frontend: contexto ativo de organização

### Escopo
- Introduzir `OrganizationContext` (mobile/web).
- Ajustar `ClassContext` para depender do tenant ativo.
- Invalidar cache tenant-scoped ao trocar organização.
- UI mínima para seleção/troca de organização quando multi-org.

### Validação
- Troca de org não vaza dados.
- Navegação e telas críticas sempre carregam dados do tenant ativo.

### Risco
- Médio.

### Critério de merge
- Fluxos multi-org validados em mobile e web.

---

## PR-10 — Contract/cleanup de legado + auditoria final

### Escopo
- Remover caminhos legados de autorização.
- Reduzir dependência de `admin_profiles` como fonte primária de authz.
- Atualizar docs finais de arquitetura e matriz de permissões.
- Rodar auditoria final de isolamento.

### Validação
- Nenhum endpoint crítico usando lógica de authz legada.
- Checklist final de segurança aprovado.

### Risco
- Médio.

### Critério de merge
- Arquitetura final alinhada ao ground truth e sem dualidade de modelo.

#### Entregas de referência (PR-10)
- Gate do painel admin: `apps/admin/src/contexts/AdminAuthContext.tsx` usa `organization_memberships` (roles `teacher` | `org_admin` | `owner`, `status = active`); `admin_profiles` deixa de ser fonte de login.
- Tipo `AdminProfile.role`: inclui `org_admin` em `packages/shared/src/types/student.ts`.
- Matriz de permissões + checklist de auditoria: `docs/multi-tenant-permissions-matrix.md`.
- Seed local: `supabase/seed-enem.sql` garante membership de staff para o owner ENEM.
- Backfill idempotente produção: `supabase/migrations/20260411120000_pr10_sync_staff_memberships_from_admin_profiles.sql`; verificação: `supabase/tests/pr10_admin_staff_membership_coverage.sql`.

---

## Checklist de controle por PR (usar em toda PR)

- Escopo da PR limitado ao objetivo definido.
- Migração idempotente e com rollback claro.
- Testes positivos e negativos de autorização.
- Evidência de não regressão nos fluxos existentes.
- Logs/telemetria suficientes para monitorar rollout.
- Documentação atualizada no mesmo PR quando mudar contrato.

## Ordem de execução recomendada

`PR-01 -> PR-02 -> PR-03 -> PR-04 -> PR-05 -> PR-06 -> PR-07 -> PR-08 -> PR-09 -> PR-10`

## Gate de produção

Antes de produção, exigir:

- aprovação do teste de isolamento cross-tenant;
- aprovação do teste de permissões por role;
- validação de cenários críticos: signup, join, troca de organização, remoção de vínculo.
