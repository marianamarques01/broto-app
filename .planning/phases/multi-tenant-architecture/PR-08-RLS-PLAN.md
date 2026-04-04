---
phase: multi-tenant-architecture
plan: PR-08
type: execute
wave: 1
depends_on: [PR-01, PR-02, PR-03, PR-06, PR-07, PR-07.1]
track: checklist
gap_closure: false
requirements:
  - RLS-01
  - RLS-02
  - RLS-03
  - RLS-04
  - RLS-05
reference_docs:
  - docs/multi-tenant-ground-truth.md
  - docs/multi-tenant-implementation-pr-checklist.md
must_haves:
  truths:
    - "Nenhuma policy SELECT/INSERT/UPDATE/DELETE em organizations, classes, enrollments depende exclusivamente de users.current_organization_id ou current_class_id como critério de acesso"
    - "Todo acesso a dados de tenant privado exige organization_memberships.status = 'active' vinculando auth.uid() à organization_id do recurso (direta ou via join em classes)"
    - "Usuário autenticado sem qualquer membership ativo continua válido: não ganha leitura de tenants privados de terceiros; pode ter políticas explícitas limitadas (ex.: catálogo is_public) sem vazar dados sensíveis"
    - "Organização pública (is_public) é legível sem owner_id; papéis administrativos usam membership (teacher | org_admin | owner), não owner_id da organizations"
    - "Aluno A ativo em org1 não lê classes/matrículas/org de org2 por caminhos RLS normais"
---

<objective>
Definir e executar políticas RLS para `organizations`, `classes`, `enrollments` e `organization_memberships` com `organization_memberships` como fonte primária de autorização, alinhadas ao ground truth multi-tenant, com rollout verificável em staging antes de produção.

Saída: migração SQL idempotente (drop policy antigas + create novas), matriz de testes RLS, nota de descontinuação de policies baseadas em `admin_profiles` para estes quatro recursos, e critérios de merge do PR-08.
</objective>

## Contexto técnico (estado atual)

- Policies legadas em `20260317_foundation_organizations_classes.sql` e ajustes em `20260323_indexes_rls_fixes.sql` usam **`admin_profiles`** e **`enrollments`** (e `owner_id`) como proxies de autorização.
- `organization_memberships` existe (PR-01+) e é populada/backfilled (PR-03); join/signup (PR-06/07) mantêm membership + enrollment coerentes.
- `organizations.owner_id` pode ser **NULL** para tenant sistema (PR-07.1); RLS **não pode** depender de `owner_id` para org pública ou para professor/admin.

## Princípio de modelagem (todas as tabelas do escopo)

1. **Fonte de verdade:** predicado canónico em termos de `organization_memberships` com `status = 'active'`.
2. **`current_organization_id`:** não usar como **único** gate; no máximo UX/caminhos de aplicação. RLS ignora para condição **suficiente** de acesso.
3. **Hierarquia de papel (tenant-scoped):** para operações de staff, restringir a `role IN ('teacher','org_admin','owner')` **na mesma** `organization_id` do recurso.
4. **Aluno:** `role = 'student'` + vínculo ao recurso via **enrollment ativo** na turma cuja `organization_id` coincide com membership ativo (defesa em profundidade contra estado legado inconsistente).
5. **Sem organização ativa:** zero linhas em `organization_memberships` com `status = 'active'` ⇒ usuário **não** vê orgs **privadas** nem classes/matrículas de terceiros; políticas opcionais mínimas abaixo para **catálogo público** apenas.

## Função auxiliar (recomendado, uma migração)

Reduz drift e simplifica auditoria:

```sql
-- Invocable em CHECK/USING; STABLE; security invoker (default): usa auth.uid() da sessão
CREATE OR REPLACE FUNCTION public.app_user_is_active_member_of_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org_id
      AND om.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.app_user_is_active_staff_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org_id
      AND om.status = 'active'
      AND om.role IN ('teacher', 'org_admin', 'owner')
  );
$$;
```

`GRANT EXECUTE` apenas a `authenticated` (e revogar de `anon` se necessário). Evitar `SECURITY DEFINER` aqui para não contornar RLS inadvertidamente.

---

## 1. `organization_memberships`

**RLS:** `ENABLE` + **nenhum acesso amplo a mutations** via cliente se o produto só muta por RPC/service_role.

| Operação | Sujeito | Política (esboço) |
|---------|---------|-------------------|
| SELECT | Próprio utilizador | `user_id = (select auth.uid())` |
| SELECT | Staff na mesma org | `app_user_is_active_staff_in_org(organization_memberships.organization_id)` |
| INSERT/UPDATE/DELETE | Cliente `authenticated` | **DENY por omissão** (zero policies) **ou** policy estrita apenas se existir fluxo real documentado |

**Nota:** Se no futuro o admin UI grava memberships por PostgREST, adicionar policies `WITH CHECK` explícitas por role (só `org_admin`/`owner` naquela org) — fora do MVP se mutations forem só `service_role`.

**Invariante:** nenhuma policy usa só `current_organization_id`.

---

## 2. `organizations`

| Operação | Política |
|---------|----------|
| SELECT | (A) **Membro ativo:** `app_user_is_active_member_of_org(organizations.id)` |
| SELECT | (B) **Catálogo público (opcional, para UX):** `is_public = true` AND `auth.uid()` IS NOT NULL` — expõe apenas orgs marcadas públicas (metadado); **não** substitui membership para classes/materiais |
| INSERT/UPDATE/DELETE | Apenas `service_role` **ou** staff por membership (se necessário); **nunca** `owner_id = auth.uid()` como condição principal |

**Remover:** `admin vê sua organização` (baseada em `owner_id`) e substituir por staff via membership na mesma org.

**Org pública sem `owner_id`:** política (B) + (A) para membros cobre ENEM; não referenciar `owner_id`.

---

## 3. `classes`

| Operação | Política |
|---------|----------|
| SELECT (aluno) | `is_active = true` AND `EXISTS` enrollment ativo `(student_id = auth.uid(), class_id = classes.id)` AND `app_user_is_active_member_of_org(classes.organization_id)` |
| SELECT (staff) | `app_user_is_active_staff_in_org(classes.organization_id)` |
| INSERT/UPDATE/DELETE | `app_user_is_active_staff_in_org(classes.organization_id)` (ajustar se apenas `org_admin` pode criar turma) |

**Remover:** policies que usam só `admin_profiles` para ALL em classes.

**Isolamento:** turma em `org2` não satisfaz `app_user_is_active_member_of_org(org2)` para utilizador só em `org1`.

---

## 4. `enrollments`

| Operação | Política |
|---------|----------|
| SELECT (aluno) | `student_id = auth.uid()` AND `app_user_is_active_member_of_org((SELECT c.organization_id FROM classes c WHERE c.id = enrollments.class_id))` |
| SELECT (staff) | `app_user_is_active_staff_in_org((SELECT c.organization_id FROM classes c WHERE c.id = enrollments.class_id))` |
| INSERT | `student_id = auth.uid()` AND `EXISTS (classe c : c.id = class_id AND app_user_is_active_member_of_org(c.organization_id))` — **não** basta ser o próprio uid sem org coerente; preferir eventualmente **só service_role** se todo insert for via `rpc_class_join` |
| UPDATE/DELETE | Staff na org da turma **ou** aluno só em casos muito limitados (ideal: só RPC) |

**Fortalecimento (recomendado alinhar ao PR-10):** trigger `BEFORE INSERT` garantindo `classes.organization_id` alinhado a membership ativo do `student_id` — RLS não substitui integridade referencial de negócio.

**Remover:** matrícula insert sem cheque de org; policies de admin baseadas só em `admin_profiles`.

---

## Estado “sem organização ativa”

- Predicados acima **não concedem** linhas de org/turma/matrícula **privadas** sem membership ativo.
- Utilizador sem memberships: pode ver apenas o que policies **explícitas** permitirem (ex.: `organizations.is_public`); **não** vê `classes`/`enrollments` de outros via regras acima.
- Dados do próprio utilizador (`users`, `pets`, etc.) permanecem nas policies existentes fora deste PR.

---

## Estratégia de rollout seguro

### Fase A — Preparação (antes do merge da migração)

1. **Inventário PostgREST:** listar queries diretas do mobile/web/admin a estas tabelas (grep `.from('organizations'|classes|enrollments|organization_memberships)`).
2. **Dados:** executar relatório PR-03 (órfãos: enrollment sem membership ativo na org da turma); corrigir antes de endurecer INSERT.
3. **Staging:** cópia anonimizada ou snapshot de produção.

### Fase B — Migração (uma PR dedicada PR-08)

1. Adicionar funções auxiliares `app_user_is_active_member_of_org` / `app_user_is_active_staff_in_org`.
2. `ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY` (se ainda não).
3. `DROP POLICY` explícito de todas as policies legadas afetadas nestas quatro tabelas (nomes exatos no ficheiro de migração).
4. `CREATE POLICY` novas com prefixo canónico (ex. `mt_member_*`, `mt_staff_*`) para auditoria.
5. **Materiais / user_question_answers / topic_performance:** fora do checklist estrito do utilizador, mas **devem** ser atualizados numa sub-PR ou mesmo PR se houver dependência de `admin_profiles` para leitura cross-tenant — senão professor perde visibilidade após remoção das policies antigas. **Recomendação:** incluir no mesmo PR-08 uma secção “follow-up policies” ou “PR-08b” para `materials` e tabelas de progresso que filtram por org via join em `classes` + **membership staff**.

### Fase C — Validação (bloqueante)

Matriz mínima (cada linha: esperado permitir/negar):

| Persona | organizations | classes | enrollments | memberships |
|---------|---------------|---------|--------------|---------------|
| Aluno org A | vê A (membro); não vê B privada | vê só turmas com enrollment ativo em A | vê só próprias linhas coerentes | vê próprias linhas |
| Staff org A | vê A | CRUD turmas A conforme regra | vê matrículas das turmas de A | vê linhas da org A |
| Utilizador sem membership | sem acesso a privadas; opcional `is_public` | negado | negado (exceto políticas legadas — zero) | só vazio ou próprio se existir convite futuro |
| `anon` | negado | negado | negado | negado |

Ferramentas: scripts SQL com `SET ROLE authenticated` + `SET request.jwt.claim.sub = 'uuid'` se necessário, ou testes com Supabase local.

### Fase D — Produção

1. Janela de deploy; monitorizar erros 42501 / queries vazias inesperadas.
2. **Rollback:** migração reversa com `DROP POLICY` novas + `CREATE` antigas (manter ficheiro `*_down.sql` ou secção comentada).

---

## Critérios de merge (PR-08)

1. Ground truth §2.1–2.5 satisfeito para as quatro tabelas no escopo declarativo.
2. Nenhuma policy nova usa `current_organization_id` / `current_class_id` como **condição suficiente** isolada.
3. `owner_id` não é critério de acesso a org pública ENEM.
4. Matriz de testes documentada com evidência (log ou relatório).
5. Lista explícita de **tabelas ainda dependentes de `admin_profiles` em RLS** (dívida conhecida) para PR-10.

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Admin dashboard deixa de listar alunos | Atualizar policies de `enrollments`/`classes` + rotas que usam `admin_profiles` |
| Cliente fazia INSERT matrícula direto | Policy com check de org + testes; ideal migrar para só RPC |
| Performance (subqueries repetidas) | Índices existentes em `(user_id, status)` / `(organization_id, status)`; funções STABLE |
| Convites `status = 'invited'` | Se precisarem ver org antes de aceitar, policy adicional explícita (fora do MVP membership-only) |

## Próximo passo após aprovação deste plan

1. Gerar `supabase/migrations/<timestamp>_pr08_rls_membership_core.sql` com políticas e helpers.
2. Executar matriz de testes em staging.
3. Atualizar `docs/multi-tenant-implementation-pr-checklist.md` (secção PR-08) com links para a migração e ao relatório de testes.
