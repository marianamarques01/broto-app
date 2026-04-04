# Matriz de permissões multi-tenant (referência final)

Documento de apoio ao **PR-10**: fonte de verdade para permissões e onde cada camada aplica.

## Fontes de autorização

| Camada | Fonte primária | Notas |
|--------|----------------|-------|
| Row Level Security (Postgres) | `organization_memberships` + predicados em `app_rls_*` | Ver migração PR-08 e `supabase/RLS-CONTRACT.md`. |
| Edge Functions (`class-join`, `material-index`, etc.) | JWT + `organization_memberships` via `_shared/authz.ts` | Não usar `admin_profiles` para decidir acesso a turma/material. |
| Painel admin (web) | Mesmo utilizador autenticado; gate de login por **membership ativa** com role de staff | `AdminAuthContext` consulta `organization_memberships` (roles `teacher`, `org_admin`, `owner`). |
| `admin_profiles` | Legado / dados auxiliares | Não é mais gate de acesso ao admin app. Manter sincronizado com produto apenas se ainda for usado para UI ou relatórios. |

## Roles em `organization_memberships`

| Role | Aluno | Staff no painel | RLS típico |
|------|--------|-----------------|------------|
| `student` | Sim | Não | Acesso a dados da org/turma conforme policies `mt_*`. |
| `teacher` | Não | Sim | Escrita limitada (ex.: turmas/materiais na org conforme policy). |
| `org_admin` | Não | Sim | Idem, com escopo de org. |
| `owner` | Não | Sim | Idem. |

## Organização ativa no admin (MVP)

Um utilizador com várias memberships de staff obtém `organization_id` no contexto assim:

1. Se `users.current_organization_id` for uma org em que o user tem membership de staff ativa, usa-se essa org.
2. Caso contrário, usa-se a membership de staff mais recente (`joined_at` desc).

Evolutiva: alinhar ao `OrganizationSwitcher` do admin se multi-org for requisito de produto.

## Dados (backfill staff)

- Migração **`20260411120000_pr10_sync_staff_memberships_from_admin_profiles.sql`**: para cada `admin_profiles` com `organization_id` e utilizador existente em `public.users`, garante linha em `organization_memberships` ativa com role de staff (complementa o PR-03 se algo ficou por sincronizar).
- Query de verificação (esperado 0 linhas): **`supabase/tests/pr10_admin_staff_membership_coverage.sql`**.

## Auditoria final (checklist)

1. **Código:** `grep -r admin_profiles supabase/functions apps` — só migrações, seeds históricos ou docs; nenhuma decisão de authz em TS de runtime além de legado documentado.
2. **RLS:** executar / rever `supabase/tests/pr08_rls_matrix_manual.sql` após deploy de schema (guião manual com personas de teste; não é um script autoexecutável sem dados).
3. **Staff vs `admin_profiles`:** após deploy das migrações, executar `pr10_admin_staff_membership_coverage.sql` no SQL Editor.
4. **Painel:** login com conta só aluno → deve falhar; conta com membership `teacher`/`org_admin`/`owner` ativa na org → deve entrar.
5. **Edge:** `class-join` / `material-index` com JWT de aluno de outra org → negado onde a policy exige mesma org/turma.

Atualizar este ficheiro quando novos recursos cruzarem org ou novos roles forem introduzidos.
