# Modelo de autorização RLS — Broto

> **Fonte normativa:** migrações em `supabase/migrations/` (PR-08 e posteriores).  
> **Contrato resumido:** `supabase/RLS-CONTRACT.md`  
> **Matriz multi-tenant:** `docs/multi-tenant/multi-tenant-permissions-matrix.md`

## Visão geral

O Broto usa **Row Level Security (RLS)** no PostgreSQL com tenant = `organization`.  
Autorização **não** usa `classes.teacher_id` (coluna inexistente). O modelo real é:

```
organization_memberships (role, status)
        ↓
    classes (organization_id, is_active)
        ↓
    enrollments (student_id, class_id, status)
        ↓
dados do aluno (topic_performance, chat_logs, user_question_answers, …)
```

| Papel | Onde está | Escopo |
|-------|-----------|--------|
| Aluno | `organization_memberships.role = 'student'` | Próprios dados + recursos da turma matriculada |
| Professor | `role IN ('teacher', 'org_admin', 'owner')` | Dados de alunos com **enrollment ativo** em turma **ativa** da **mesma org** |
| Service role | Edge functions | Bypass RLS após validação em `_shared/authz.ts` |

Helpers críticos (`SECURITY DEFINER`, fail-closed):

- `app_rls_class_org_id(class_id, require_active)` — org da turma
- `app_rls_is_active_staff_in_org(org_id)` — staff ativo na org

---

## Inventário: RLS habilitado (`public`)

Consulta de auditoria (SQL Editor ou `psql`):

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Snapshot após migração `20260625140000_chat_logs_rls` (jun/2026):

| Tabela | RLS | Policies | Notas |
|--------|-----|----------|-------|
| `admin_profiles` | ✓ | 1 | Legado; perfil próprio |
| `chat_logs` | ✓ | 2 | Aluno próprio + staff org |
| `classes` | ✓ | 2 | Aluno matriculado + staff org |
| `data_quality_events` | ✓ | 0 | **Fail-closed** — só service_role |
| `enrollments` | ✓ | 3 | Aluno próprio; staff SELECT/UPDATE |
| `flashcard_reviews` | ✓ | 1 | Só dono |
| `material_embeddings` | ✓ | 0 | **Fail-closed** — RAG via service_role |
| `materials` | ✓ | 2 | Aluno turma + staff org |
| `organization_memberships` | ✓ | 1 | Próprio + staff vê org |
| `organizations` | ✓ | 2 | Membro ativo + org pública |
| `pets` | ✓ | 4 | Dono + staff org |
| `practice_sessions` | ✓ | 4 | Dono CRUD + staff SELECT |
| `question_topic_mapping` | ✓ | 1 | Leitura authenticated (referência) |
| `signup_defaults` | ✓ | 0 | **Fail-closed** — trigger/RPC interno |
| `streak_freeze_events` | ✓ | 1 | Só dono |
| `tenants` | ✓ | 1 | Leitura authenticated (legado) |
| `topic_performance` | ✓ | 2 | Dono ALL + staff SELECT |
| `user_question_answers` | ✓ | 3 | Dono SELECT/INSERT + staff SELECT |
| `users` | ✓ | 4 | Próprio + staff SELECT alunos da org |

### Todas as policies

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Tabelas críticas: professor → turma → aluno

### `topic_performance`

| Policy | Comando | Quem acessa |
|--------|---------|-------------|
| `mt_tp_student_all` | ALL | `user_id = auth.uid()` |
| `mt_tp_staff_select` | SELECT | Staff ativo na org do enrollment ativo do aluno (turma ativa) |

Predicado staff (simplificado):

```sql
EXISTS (
  SELECT 1 FROM organization_memberships om
  INNER JOIN enrollments e
    ON e.student_id = topic_performance.user_id
    AND e.status = 'active'
    AND om.organization_id = app_rls_class_org_id(e.class_id, true)
  WHERE om.user_id = auth.uid()
    AND om.status = 'active'
    AND om.role IN ('teacher', 'org_admin', 'owner')
)
```

**Nota:** escopo é **organização**, não turma individual. Professor da org1 vê performance de qualquer aluno matriculado em turma ativa da org1 — alinhado ao PR-08 e `multi-tenant-ground-truth.md`.

### `chat_logs`

| Policy | Comando | Quem acessa |
|--------|---------|-------------|
| `mt_cl_select_owner` | SELECT | `user_id = auth.uid()` |
| `mt_cl_select_staff` | SELECT | Staff org + enrollment ativo; `class_id` coerente quando presente |

Escrita: **sem policy** para `authenticated` → fail-closed. Turnos gravados via `service_role` em `broto-chat`.

`class_id` é `TEXT` (UUID serializado); join usa `e.class_id::text = chat_logs.class_id`.

### Padrão staff reutilizado

Mesmo predicado em: `user_question_answers`, `practice_sessions`, `users`, `pets`.

---

## Como testar

### 1. Teste automatizado (recomendado)

Script Deno com JWT reais — cria personas, asserta contagens, faz cleanup:

```bash
export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."   # Dashboard → Settings → API
export SUPABASE_ANON_KEY="..."

deno run --allow-env --allow-net supabase/scripts/rls-professor-turma-test.ts
```

Cenários validados:

| Persona | Query | Esperado |
|---------|-------|----------|
| `prof_x` (org1) | `topic_performance` de `aluno_a` (org1) | 1 linha |
| `prof_x` | `topic_performance` de `aluno_b` (org2) | 0 linhas |
| `aluno_a` | `topic_performance` de `aluno_b` | 0 linhas |
| `prof_x` | `chat_logs` de `aluno_a` | 1 linha |
| `prof_x` | `chat_logs` de `aluno_b` | 0 linhas |
| `aluno_a` | `chat_logs` de `aluno_b` | 0 linhas |

### 2. Matriz manual (staging/prod controlado)

Guião completo multi-tabela: `supabase/tests/pr08_rls_matrix_manual.sql`

### 3. Validação ad hoc com JWT

No client autenticado (ou SQL Editor simulando JWT):

```sql
-- Como prof_x (substituir UUIDs reais)
SET request.jwt.claim.sub = '<uuid_prof_x>';
SET role authenticated;

SELECT count(*) FROM topic_performance WHERE user_id = '<uuid_aluno_a>';  -- deve ser > 0
SELECT count(*) FROM topic_performance WHERE user_id = '<uuid_aluno_b>';  -- deve ser 0
```

No SQL Editor do Supabase, use `SET LOCAL row_security = on` se estiver como superuser.

### 4. Pentest cross-tenant (obrigatório antes de UI professor)

- Dois browsers: sessão org1 vs org2 — UI não deve cruzar dados
- `SELECT *` sem filtro manual em cada persona — zero linhas de outro tenant
- Aluno não consegue `UPDATE`/`DELETE` em `materials` ou `classes`

---

## Como adicionar nova tabela ao modelo

1. **Habilitar RLS** na migration:
   ```sql
   ALTER TABLE public.nova_tabela ENABLE ROW LEVEL SECURITY;
   ```

2. **Policy do aluno** (dono do recurso):
   ```sql
   CREATE POLICY "mt_nova_owner"
     ON public.nova_tabela FOR ALL TO authenticated
     USING (user_id = (SELECT auth.uid()))
     WITH CHECK (user_id = (SELECT auth.uid()));
   ```

3. **Policy staff** (se professor deve ler):
   ```sql
   CREATE POLICY "mt_nova_staff_select"
     ON public.nova_tabela FOR SELECT TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM organization_memberships om
         INNER JOIN enrollments e
           ON e.student_id = nova_tabela.user_id
           AND e.status = 'active'
           AND om.organization_id = app_rls_class_org_id(e.class_id, true)
         WHERE om.user_id = (SELECT auth.uid())
           AND om.status = 'active'
           AND om.role IN ('teacher', 'org_admin', 'owner')
       )
     );
   ```

4. **Escrita sensível:** preferir fail-closed + edge function com `service_role` após `requireUser()`.

5. **Testes:** estender `supabase/scripts/rls-professor-turma-test.ts` ou adicionar asserções em `supabase/tests/`.

6. **Documentação:** atualizar esta página e `multi-tenant-permissions-matrix.md`.

---

## Diferenças em relação ao SQL sugerido na tarefa

A tarefa mencionava `class_enrollments` e `classes.teacher_id`. **No schema Broto:**

| Sugestão da tarefa | Schema real |
|--------------------|-------------|
| `class_enrollments(user_id, class_id)` | `enrollments(student_id, class_id)` |
| `classes.teacher_id` | `organization_memberships` com `role = 'teacher'` |
| `CREATE POLICY IF NOT EXISTS` | Postgres não suporta `IF NOT EXISTS` em policies — usar `DROP POLICY IF EXISTS` + `CREATE POLICY` |

As policies implementadas seguem o padrão PR-08 (`mt_*`), mais restritivas e auditáveis que join direto por `teacher_id`.

---

## Referências

- Migração core: `supabase/migrations/20260410120000_pr08_rls_membership_core.sql`
- Chat logs RLS: `supabase/migrations/20260625140000_chat_logs_rls.sql`
- Testes: `supabase/scripts/rls-professor-turma-test.ts`
- Auditoria manual: `supabase/tests/pr08_rls_matrix_manual.sql`
