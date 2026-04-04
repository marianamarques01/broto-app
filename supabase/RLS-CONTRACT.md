# Contrato RLS — Broto (PR-08)

Documento curto para desenvolvimento e code review. A fonte normativa de comportamento está nas migrações `supabase/migrations/*pr08*`.

## Escrita em `public.enrollments`

- Com JWT **authenticated** (aluno/professor via client), **não existe** política RLS de `INSERT`. Qualquer `.from('enrollments').insert()` no client deve falhar.
- Criação e reativação de matrícula ocorrem apenas com **service_role**, tipicamente via:
  - `public.rpc_class_join`
  - `public.rpc_onboard_new_user_default_org` (trigger de signup; SECURITY DEFINER)
- **UPDATE** por professor/admin autenticado é permitido quando exist membership **staff** ativo na organização da turma (ver migração).

## Helpers `app_rls_*` (SECURITY DEFINER)

- São **pontos críticos de segurança**: ver `COMMENT ON FUNCTION` no SQL.
- `app_rls_class_org_id(class_id, p_require_active)`:
  - `true` (default): só turma existente e **`is_active`**; sem linha ⇒ `NULL` (fail-closed).
  - `false`: turma existente (ativa ou não); útil para staff operar turma inativa sem abrir dados de aluno em turmas inválidas pelo caminho “aluno”.
- `app_rls_is_active_staff_in_org(org_id)`: `NULL` org ⇒ `false`.

## `organizations.is_public`

- Metadado de org pública é visível a **todo** `authenticated` na política `mt_org_select_public`.
- **Não** armazenar segredos, PII agregada sensível ou chaves em `organizations.config`. Considerar no futuro uma view `org_public` com colunas mínimas.

## Ordem mental das policies (aluno)

1. Membership ativo na organização do recurso  
2. Coerência da turma (`is_active` onde exigido)  
3. Enrollment ativo onde o recurso é por turma  

## Auditoria antes de produção

Ver `supabase/tests/pr08_rls_matrix_manual.sql` e secção “Auditoria tipo pentest”.
