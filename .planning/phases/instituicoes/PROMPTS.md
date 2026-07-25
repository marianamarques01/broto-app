# Prompts de execução — Módulo Instituições

Prompts adaptados ao monorepo Broto real. **Não usar FastAPI** — backend é Supabase Edge Functions + Postgres.

**Antes de cada prompt:** agente deve ler `CONTEXT.md`, `.planning/phases/instituicoes/CONTEXT.md`, `docs/instituicoes-arquitetura.md` e `.cursor/rules/*`.

**Ordem:** executar sequencialmente; cada prompt assume o anterior concluído e revisado.

---

## Prompt 1 — Levantamento e plano de schema

```
Contexto: estou construindo o módulo "Instituições" do Broto (plataforma de estudo
adaptativo). Preciso estender o multi-tenant existente para painéis de engajamento
professor → escola → rede.

Antes de escrever qualquer código:
1. Leia supabase/migrations/ (organizations, classes, enrollments, organization_memberships)
   e docs/multi-tenant/multi-tenant-ground-truth.md.
2. Leia docs/instituicoes-arquitetura.md e .planning/phases/instituicoes/RESEARCH.md.
3. Identifique o que JÁ existe (organizations, useTeacherClassInsights, computeClassAtRisk)
   para não duplicar.
4. Proponha migrations finais para: engagement_snapshots_class, engagement_snapshots_org,
   student_follow_ups — com RLS alinhada a organization_memberships.
5. Explique decisões de isolamento (reutilizar app_user_is_active_member_of_org).
6. NÃO implemente ainda — apenas apresente plano de migrations para revisão.
```

**Wave:** W1 · **Requisitos:** INST-01

---

## Prompt 2 — Implementação schema e RLS

```
Aprovado o plano de schema da etapa anterior [colar ou referenciar migration proposta].

Agora:
1. Crie migrations em supabase/migrations/ para engagement_snapshots_* e student_follow_ups.
2. Implemente RLS: professor só snapshots de turmas vinculadas; org_admin da org;
   INSERT/UPDATE snapshots só via service_role (job).
3. Escreva supabase/tests/inst_rls_cross_tenant.sql — professor org A não lê org B.
4. Regenerar database.types.ts via scripts/gen-database-types.sh se aplicável.
5. Documente matriz de permissões em docs/instituicoes-permissoes.md (novo, conciso).

Gates: npm run typecheck && npm run test:functions
```

**Wave:** W1 · **Requisitos:** INST-01, INST-05

---

## Prompt 3 — Lógica shared + job de agregação

```
Preciso de agregados de engajamento sem recalcular tudo em tempo real no painel admin.

1. Em packages/shared/src/engagement/:
   - student-engagement-state.ts (engaged | at_risk | missing)
   - compute-engagement-snapshot.ts (por turma)
   - compute-org-engagement-index.ts (índice abandono — fórmula em docs/instituicoes-arquitetura.md)
2. Testes Vitest cobrindo turma vazia, dado esparso, 3 estados.
3. Edge function engagement-snapshot-refresh:
   - Usa lógica shared
   - Persiste em engagement_snapshots_class e engagement_snapshots_org
   - Invocável por cron horário
4. Edge engagement-class-get: retorna snapshot + alunos com engagementState.
5. Tipos em packages/shared/src/types/edge-functions.ts.

Reutilize computeClassAtRisk de packages/shared/src/teacher/class-p-know-insights.ts
onde fizer sentido — não duplicar.

Gates: npm run test:shared && npm run test:functions
```

**Wave:** W1 · **Requisitos:** INST-02, INST-03, INST-04

---

## Prompt 4 — Painel Professor (apps/admin)

```
Construa/evolua o painel do professor em apps/admin/, seguindo tokens CSS existentes
(var(--green-*), var(--bg-*)).

Requisitos:
1. Ao logar como teacher, mostrar turma(s) vinculada(s) — sem setup manual.
2. StudentEngagementList: três estados visuais (cor > número): engajado, em risco, sumido.
3. ClassWeakTopicsPanel: p_know médio da turma abaixo de limiar, ordenado.
4. Drill-down aluno: sessões recentes, acertos/erros, última atividade.
5. FollowUpButton → student-follow-up-set edge function.
6. EmptyClassState quando turma tem poucos dados.
7. Consumir engagement-class-get (não 4 queries paralelas no hook).

Estender ClassTeacherDashboard e rotas existentes (/classes/:id/painel).
Não construir painel escola/rede nesta etapa.

Gates: npm run typecheck && npm run build
```

**Wave:** W2 · **Requisitos:** INST-06, INST-07, INST-08, INST-09

---

## Prompt 5 — Painel Escola/Coordenação

```
Construa camada de coordenação em apps/admin/src/pages/school/, reaproveitando
componentes do professor quando fizer sentido.

Requisitos:
1. OrgDashboard: ranking turmas por % ativos 7d (engagement-org-get).
2. OrgRiskAlerts: alunos com queda abrupta, cross-turma, severidade.
3. Export PDF apresentável (org-report-export ou print CSS MVP documentado).
4. OrgClassManagement: criar turma, import CSV (org-students-import), vincular professor.
5. Gate org_admin/owner only — testar contra RLS.

Nova rota /escola protegida por role no AdminAuthContext.

Gates: npm run build + smoke manual export PDF
```

**Wave:** W3 · **Requisitos:** INST-10, INST-11, INST-12, INST-13

---

## Prompt 6 — Onboarding institucional

```
Fluxo para nova instituição usar o Broto sem SQL manual (operado pela equipe Broto inicialmente).

1. InstitutionalOnboarding: cadastro org (nome, tipo: escola privada / cursinho / outro).
2. Convite professor: link/código → membership teacher na org.
3. Import CSV alunos com validação linha a linha e confirmação.
4. Prioridade: POSSÍVEL sem intervenção no banco — UX polida é v2.

Reutilizar class-join e organization_memberships existentes onde aplicável.
```

**Wave:** W4 · **Requisitos:** INST-14 (+ INST-13 se não concluído)

---

## Prompt 7 — Painel Rede (demo)

```
Painel multi-escola para demos comerciais (Proteus, secretarias).

Arquitetura REAL multi-tenant; DADOS podem ser fixtures com is_demo=true.

1. NetworkDashboard: comparativo engajamento entre escolas.
2. Índice risco abandono por escola — documentar fórmula (compute-org-engagement-index).
3. Filtros: período, série, regional.
4. UI para projetor: números grandes, legível à distância.
5. seed-network-demo.sql + README em pages/network/ explicando real vs fixture.
6. Gestor rede NÃO vê nome de aluno individual por padrão.

Rota /rede com gate network_admin ou equivalente.
```

**Wave:** W5 · **Requisitos:** INST-15, INST-16, INST-17

---

## Prompt 8 — Auditoria LGPD

```
Auditoria do módulo Instituições com foco LGPD (menores de idade).

1. Listar pontos onde dados pessoais de alunos são expostos e para qual role.
2. Verificar painel rede: agregados/anonimizados por padrão.
3. Implementar sensitive_data_access_log + hook no drill-down aluno.
4. Buscar endpoints que permitam acesso fora do escopo RLS — tratar como bug crítico.
5. Gerar .planning/phases/instituicoes/LGPD-AUDIT.md para base de RIPD.

Gates: npm run test:functions + revisão manual checklist CONTEXT.md
```

**Wave:** W6 · **Requisitos:** INST-18

---

## Prompt rápido — Demo comercial (integração)

```
Prepare demo de vendas 15 min do módulo Instituições:

1. Conta professor seed com turma e alunos nos 3 estados de engajamento.
2. Conta coordenador mesma org com PDF exportável.
3. Conta rede demo com 3 escolas fixture.
4. Script verbal em docs/instituicoes-demo-script.md (bullets por persona).
5. Verificar checklist em .planning/phases/instituicoes/CONTEXT.md §Checklist.

Não implementar features novas — só seeds, copy e verificação.
```

---

## Referência de arquivos existentes

| Área | Caminho |
|------|---------|
| Insights turma | `apps/admin/src/hooks/useTeacherClassInsights.ts` |
| Lógica at-risk | `packages/shared/src/teacher/class-p-know-insights.ts` |
| Auth admin | `apps/admin/src/contexts/AdminAuthContext.tsx` |
| Authz edge | `supabase/functions/_shared/authz.ts` |
| RLS core | `supabase/migrations/20260410120000_pr08_rls_membership_core.sql` |
| Matriz permissões | `docs/multi-tenant/multi-tenant-permissions-matrix.md` |
