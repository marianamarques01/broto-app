# Permissões — Módulo Instituições

Referência concisa para snapshots de engajamento e acompanhamento de alunos.

## Fontes de autorização

| Camada | Fonte |
|--------|--------|
| Postgres RLS | `app_rls_is_active_staff_in_org(organization_id)` |
| Edge Functions | `requireClassAccess` / `requireMembership` em `_shared/authz.ts` |

## Tabelas novas

| Tabela | SELECT | INSERT/UPDATE |
|--------|--------|---------------|
| `engagement_snapshots_class` | Staff ativo na org | Apenas `service_role` (job) |
| `engagement_snapshots_org` | Staff ativo na org | Apenas `service_role` (job) |
| `student_follow_ups` | Staff ativo na org | Staff (`marked_by = auth.uid()`, org coerente com turma) |

## Edge functions

| Function | Auth | Escopo |
|----------|------|--------|
| `engagement-snapshot-refresh` | Service role **ou** `org_admin+` com `organizationId` | Recalcula snapshots |
| `engagement-class-get` | JWT + `requireClassAccess(..., teacher)` | Uma turma |
| `engagement-org-get` | JWT + `requireMembership(..., org_admin)` | Snapshot org + ranking |
| `org-students-import` | JWT + `requireMembership(..., org_admin)` | Import CSV alunos |
| `student-follow-up-set` | JWT + `requireClassAccess(..., teacher)` | Marcar/resolver acompanhamento |

## Roles

Reutiliza `organization_memberships.role`: `teacher`, `org_admin`, `owner` para painel; alunos não acessam snapshots.

## Testes

- Manual: `supabase/tests/inst_rls_cross_tenant.sql`
- Baseline multi-tenant: `supabase/tests/pr08_rls_matrix_manual.sql`
