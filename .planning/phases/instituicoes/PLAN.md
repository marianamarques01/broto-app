---
phase: instituicoes
plan: 01
type: execute
wave: 0
depends_on: []
autonomous: false
requirements:
  - INST-01
  - INST-02
  - INST-03
  - INST-04
  - INST-05
  - INST-06
  - INST-07
  - INST-08
  - INST-09
  - INST-10
  - INST-11
  - INST-12
  - INST-13
  - INST-14
  - INST-15
  - INST-16
  - INST-17
  - INST-18
must_haves:
  truths:
    - "Professor vê só turmas vinculadas; coordenador vê só a própria org; zero vazamento cross-tenant"
    - "Painel professor mostra três estados visuais de engajamento (engajado, em risco, sumido) sem depender de tabela crua"
    - "Agregados de engajamento vêm de snapshot horário, não recálculo completo a cada page load"
    - "Coordenador exporta PDF apresentável para reunião de diretoria"
    - "Painel rede usa arquitetura multi-tenant real; dados simulados claramente rotulados"
    - "Gestor de rede não vê nome de aluno individual por padrão"
  artifacts:
    - path: "docs/instituicoes-arquitetura.md"
      provides: "Modelo de dados, RBAC, pipeline de agregação"
    - path: ".planning/phases/instituicoes/RESEARCH.md"
      provides: "Gap analysis repo vs spec"
    - path: "packages/shared/src/engagement/"
      provides: "Lógica pura engajamento + testes Vitest"
    - path: "supabase/functions/engagement-snapshot-refresh/"
      provides: "Job de agregação"
    - path: "apps/admin/src/pages/teacher/"
      provides: "Painel professor MVP"
    - path: "apps/admin/src/pages/school/"
      provides: "Painel escola/coordenação"
---

<objective>
Implementar o módulo Instituições do Broto: painel Professor → Escola → Rede no `apps/admin`, com multi-tenancy real, agregados assíncronos, export comercial e base LGPD — demo vendável em 4–6 semanas.
</objective>

## Convenção de requisitos

| ID | Escopo |
|----|--------|
| **INST-01** | Migrations snapshots + `student_follow_ups` + RLS |
| **INST-02** | Lógica shared engajamento + testes Vitest |
| **INST-03** | Edge `engagement-snapshot-refresh` + cron |
| **INST-04** | Edge `engagement-class-get` + `student-follow-up-set` |
| **INST-05** | RLS staging validado (matrix manual + testes) |
| **INST-06** | Painel professor: lista alunos com sinais visuais |
| **INST-07** | Painel professor: habilidades fracas em massa (p_know) |
| **INST-08** | Painel professor: drill-down aluno + estados vazios |
| **INST-09** | Painel professor: marcar acompanhamento |
| **INST-10** | Edge `engagement-org-get` |
| **INST-11** | Painel escola: ranking turmas + alertas cross-turma |
| **INST-12** | Export PDF org |
| **INST-13** | Gestão turmas: import CSV alunos |
| **INST-14** | Onboarding institucional (equipe Broto) |
| **INST-15** | Schema rede (`school_units` ou equivalente) |
| **INST-16** | Painel rede demo + seed fixtures |
| **INST-17** | Índice risco abandono documentado |
| **INST-18** | Auditoria LGPD + log acesso sensível |

---

## Cronograma sugerido (6 semanas)

| Semana | Wave | Entregável demo |
|--------|------|-----------------|
| 1 | W1 Fundação | Schema + job + RLS verde |
| 2 | W2 Professor | Lista colorida + drill-down + acompanhamento |
| 3 | W3 Escola | Ranking + alertas + PDF |
| 4 | W4 Onboarding | CSV + convites sem SQL manual |
| 5 | W5 Rede | Painel projetor + fixtures |
| 6 | W6 LGPD | Relatório + hardening |

W4 e W5 podem sobrepor semanas 4–5 se houver capacidade.

---

## Wave 0 — Preparação (esta sessão)

**Status:** concluída com documentação

- [x] CONTEXT.md
- [x] RESEARCH.md
- [x] instituicoes-arquitetura.md
- [x] PLAN.md
- [x] PROMPTS.md

**Gate:** revisão humana dos docs antes de W1.

---

## Wave 1 — Fundação (2–3 semanas → INST-01…05)

### INST-01 — Schema e RLS

**Arquivos:**
- `supabase/migrations/YYYYMMDD_inst_engagement_snapshots.sql`
- `supabase/migrations/YYYYMMDD_inst_student_follow_ups.sql`
- `supabase/tests/inst_rls_cross_tenant.sql`

**Tarefas:**
1. Criar tabelas conforme `docs/instituicoes-arquitetura.md`
2. RLS: SELECT staff/aluno conforme matriz; INSERT snapshot só service_role
3. Regenerar `database.types.ts`
4. Testes SQL cross-tenant (professor org A → org B = 0 rows)

**Critérios de aceite:**
- [ ] Migration aplica localmente
- [ ] `grep` confirma policies em todas tabelas novas
- [ ] Teste de violação documentado

### INST-02 — Shared engagement

**Arquivos:**
- `packages/shared/src/engagement/student-engagement-state.ts`
- `packages/shared/src/engagement/compute-engagement-snapshot.ts`
- `packages/shared/src/engagement/compute-org-engagement-index.ts`
- `packages/shared/src/engagement/*.test.ts`
- Export em `packages/shared/src/index.ts`

**Critérios:**
- [ ] Vitest cobre engaged/at_risk/missing + turma vazia + dado esparso
- [ ] Reutiliza `computeClassAtRisk` onde aplicável

### INST-03 — Job snapshot

**Arquivos:**
- `supabase/functions/engagement-snapshot-refresh/index.ts`
- `supabase/functions/_shared/engagement-snapshot-core.ts`
- Config cron Supabase (documentar em `docs/instituicoes-arquitetura.md`)

### INST-04 — API professor

**Arquivos:**
- `supabase/functions/engagement-class-get/index.ts`
- `supabase/functions/student-follow-up-set/index.ts`
- Tipos em `packages/shared/src/types/edge-functions.ts`

### INST-05 — RLS staging

**Tarefas:**
1. Executar `pr08_rls_matrix_manual.sql` em staging
2. Executar `inst_rls_cross_tenant.sql`
3. Registrar resultado em `.planning/phases/instituicoes/VERIFICATION.md`

**Gate Wave 1:** `npm run test:shared && npm run test:functions && npm run build`

---

## Wave 2 — Painel Professor (2–3 semanas → INST-06…09)

### Escopo UX

Reaproveitar e estender:
- `ClassTeacherDashboard.tsx`
- `useTeacherClassInsights.ts` → migrar para `useEngagementClass.ts` (consome edge)
- Novos componentes em `apps/admin/src/components/teacher/`

### Componentes novos

| Componente | Função |
|------------|--------|
| `StudentEngagementList.tsx` | Lista com badges de cor (engaged/at_risk/missing) |
| `ClassWeakTopicsPanel.tsx` | Tópicos com p_know médio baixo |
| `StudentEngagementDetail.tsx` | Drill-down sessões |
| `FollowUpButton.tsx` | Marcar acompanhamento |
| `EmptyClassState.tsx` | Turma sem dados — mensagem clara |

### Rotas

Manter `/classes/:id/painel` como entry point; professor com uma turma pode redirecionar direto do login (INST-06).

**Gate Wave 2:** demo interna professor — 3 estados visuais + follow-up persistido.

---

## Wave 3 — Painel Escola (2 semanas → INST-10…12)

### Páginas

- `apps/admin/src/pages/school/OrgDashboard.tsx`
- `apps/admin/src/pages/school/OrgRiskAlerts.tsx`
- `apps/admin/src/pages/school/OrgReportPage.tsx`

### INST-12 — Export PDF

Opções (decidir na implementação):
- Edge function gera PDF server-side (pdf-lib ou similar Deno)
- Client-side print CSS + `window.print()` para MVP rápido

**Preferência produto:** PDF server-side com logo org.

### Gate comercial parcial

Coordenador consegue: ver ranking → exportar PDF → levar para reunião.

---

## Wave 4 — Onboarding (1–2 semanas → INST-13…14)

### INST-13 — Import CSV

Formato CSV mínimo:
```csv
email,nome,turma_codigo
aluno@escola.com,João Silva,ABC123
```

Edge `org-students-import` + UI em `OrgClassManagement.tsx`.

### INST-14 — Fluxo onboarding

`apps/admin/src/pages/onboarding/InstitutionalOnboarding.tsx`

Prioridade: operável pela **equipe Broto** sem SQL — UX polida é v2.

---

## Wave 5 — Painel Rede demo (2 semanas → INST-15…17)

### INST-15/16/17

- Migration `school_units` (se necessário)
- Seed demo: `supabase/scripts/seed-network-demo.sql`
- `apps/admin/src/pages/network/NetworkDashboard.tsx`
- UI projetor: números grandes, mapa/regional simples
- README demo vs produção

**Gate:** reunião Proteus — slide índice risco + comparativo escolas.

---

## Wave 6 — LGPD (1 semana → INST-18)

### Entregáveis

- Migration `sensitive_data_access_log`
- Hook de log em drill-down aluno
- Relatório `.planning/phases/instituicoes/LGPD-AUDIT.md`
- Verificação painel rede sem nomes individuais

---

## Verificação final (demo comercial)

Checklist do CONTEXT.md §Checklist +:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:shared
npm run test:functions
npm run build
```

Smoke manual:
1. Login professor → turma → 3 cores visíveis
2. Login coordenador → ranking → PDF
3. Login rede demo → agregados sem nomes
4. Tentativa cross-tenant → bloqueado

---

## Backlog pós-MVP

| ID | Item |
|----|------|
| BL-INST-01 | Notificações e-mail de alerta |
| BL-INST-02 | OrganizationSwitcher multi-org no admin |
| BL-INST-03 | Integração SGP |
| BL-INST-04 | Fórmula risco customizável |
| BL-INST-05 | Deploy admin produção (`vercel.json`) |
