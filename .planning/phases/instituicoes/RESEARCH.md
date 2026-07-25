# Research — Gap analysis: spec Instituições vs repositório Broto

**Data:** 2026-07-07  
**Objetivo:** mapear o que já existe, o que falta e riscos antes de implementar.

---

## 1. Schema Postgres (estado atual)

### Tabelas relevantes já existentes

| Tabela | Migration principal | Uso |
|--------|---------------------|-----|
| `organizations` | `20260317_foundation_organizations_classes.sql` | Tenant: nome, slug, owner, config, `is_public` |
| `organization_memberships` | `20260403_pr01_organization_memberships.sql` | RBAC: `user_id`, `organization_id`, `role`, `status` |
| `classes` | foundation | Turma por org: `access_code`, `notebook_status` |
| `enrollments` | foundation | Aluno ↔ turma: `status` active/inactive |
| `admin_profiles` | foundation | **Legado** — gate migrado para memberships (PR-10) |
| `users` | foundation + PR-02 | `streak`, `last_study_date`, `current_organization_id` |
| `topic_performance` | + `20260621120000_topic_performance_p_know.sql` | `p_know`, `area_key`, `last_practiced` |
| `user_question_answers` | várias | Atividade recente, acertos |
| `practice_sessions` | `20260413120000_practice_sessions_student_mock.sql` | Sessões de estudo |

### Tabelas ausentes (necessárias para o módulo)

| Tabela / view | Propósito | Wave |
|---------------|-----------|------|
| `engagement_snapshots_class` | Snapshot horário: % ativos, sumidos, streak quebrado por turma | W1 |
| `engagement_snapshots_org` | Agregado por organização | W1 |
| `student_follow_ups` | Marcação “em acompanhamento” (professor → coordenação) | W1 |
| `sensitive_data_access_log` | Auditoria LGPD (quem viu qual aluno) | W6 |
| `school_units` | Hierarquia rede → escolas (opcional MVP; obrigatório W5) | W5 |
| `network_memberships` | Gestor de rede com escopo multi-org | W5 |

---

## 2. RLS e authz

### O que está pronto

- PR-08: policies em `organizations`, `classes`, `enrollments`, `organization_memberships` via `app_user_is_active_member_of_org`.
- `_shared/authz.ts`: `requireUser()`, `requireMembership()`, `requireClassAccess()`.
- Testes: `pr08_rls_matrix_manual.sql`, `pr10_admin_staff_membership_coverage.sql`.
- Admin gate: `AdminAuthContext` usa membership staff (`teacher`, `org_admin`, `owner`).

### Gaps identificados

| Gap | Risco | Ação |
|-----|-------|------|
| RLS staging não validado (STATE 3.4 pendente) | Alto — demo comercial | Wave 1: executar matrix manual + testes automatizados |
| Staff lê `users` de alunos via PostgREST direto | Médio — depende de policy em `users` | Revisar `20260625130000_users_pets_staff_select_rls.sql` |
| Agregados snapshot sem RLS | Alto se expuser cross-tenant | Policies por `organization_id` na migration W1 |
| Painel rede multi-org | Alto | Role `network_admin` ou membership em org pai |

---

## 3. Frontend admin (`apps/admin`)

### Páginas e hooks existentes

| Artefato | Função | Gap vs spec |
|----------|--------|-------------|
| `Dashboard.tsx` | Lista turmas da org | OK base |
| `ClassDetail.tsx` | Materiais + alunos | Falta sinais visuais de engajamento |
| `ClassTeacherDashboard.tsx` | Domínio por área + alertas | Parcial — falta lista aluno com cores, acompanhamento |
| `StudentDetail.tsx` | Indicadores individuais | Revisar drill-down sessões |
| `useClassIndicators.ts` | Streak, accuracy, weak topics | Calcula on-the-fly; migrar para snapshots |
| `useTeacherClassInsights.ts` | `computeClassAreaStats`, `computeClassAtRisk` | Lógica correta em shared; UX incompleta |
| `CreateClass.tsx` / modal | Criar turma | OK |
| — | Painel escola (org-wide) | **Ausente** |
| — | Import CSV alunos | **Ausente** |
| — | Export PDF | **Ausente** |
| — | Painel rede | **Ausente** |

### Rotas atuais

```
/                     → Dashboard (turmas)
/classes/new          → CreateClass
/classes/:id          → ClassDetail
/classes/:id/painel   → ClassTeacherDashboard
/classes/:id/students/:studentId → StudentDetail
/calibracao           → Redação (interno)
```

### Rotas propostas (PLAN.md)

```
/escola               → OrgDashboard (coordenação)
/escola/alertas       → OrgRiskAlerts
/escola/export        → OrgReportExport
/escola/turmas        → OrgClassManagement
/rede                 → NetworkDashboard (demo)
/onboarding           → InstitutionalOnboarding (equipe Broto)
```

---

## 4. Lógica compartilhada (`packages/shared`)

### Existente

- `packages/shared/src/teacher/class-p-know-insights.ts`
  - `computeClassAreaStats()` — domínio médio por área ENEM
  - `computeClassAtRisk()` — inativos + struggling (3+ tópicos com p_know < 0.3)
  - Testes Vitest cobrindo casos principais
- `packages/shared/src/utils/class-code.ts` — código de turma
- Tipos: `Class`, enrollments em `@broto/shared`

### A criar

| Módulo | Conteúdo |
|--------|----------|
| `engagement/student-engagement-state.ts` | `engaged` \| `at_risk` \| `missing` a partir de streak + last activity |
| `engagement/org-engagement-index.ts` | Índice de risco de abandono (fórmula documentada) |
| `engagement/compute-engagement-snapshot.ts` | Lógica pura para job de agregação |
| Testes Vitest para todos os acima | Obrigatório |

---

## 5. Edge functions

### Padrão existente a seguir

- Auth: `requireUser()` + `requireClassAccess()` / `requireMembership()`
- CORS: `_shared/cors.ts`
- Agregação similar: `user-progress/index.ts` + `user-progress-aggregate-from-answers.ts`

### Functions propostas

| Function | Método | Escopo |
|----------|--------|--------|
| `engagement-snapshot-refresh` | POST (cron/internal) | Recalcula snapshots class + org |
| `engagement-class-get` | GET | Snapshot + alunos para painel professor |
| `engagement-org-get` | GET | Snapshot org + ranking turmas |
| `student-follow-up-set` | POST | Marca/desmarca acompanhamento |
| `org-students-import` | POST | CSV validado |
| `org-report-export` | GET | PDF ou link somente-leitura |

**Nota:** Prompt original mencionava FastAPI — no Broto o backend é Supabase Edge Functions + Postgres. Não introduzir FastAPI para este módulo.

---

## 6. Job assíncrono de agregação

### Opções avaliadas

| Opção | Prós | Contras |
|-------|------|---------|
| **A. pg_cron + SQL function** | Barato, no Postgres | Lógica complexa (p_know) difícil em SQL puro |
| **B. Edge function + Supabase cron** | Reutiliza TS shared | Depende de config no dashboard |
| **C. Calcular no request (atual)** | Já funciona para turmas pequenas | Não escala; lento com muitas turmas |

**Decisão (D5):** Opção B — edge function `engagement-snapshot-refresh` invocada a cada hora; lógica de cálculo em `@broto/shared`, persistência em tabelas snapshot.

---

## 7. Duplicações a evitar

| Armadilha | Prevenção |
|-----------|-----------|
| Nova tabela `instituicoes` | Usar `organizations` |
| Novo enum de roles paralelo | Estender `organization_memberships.role` se necessário (`network_admin`) |
| Recalcular p_know no painel | Ler `topic_performance` + snapshots |
| Copiar `computeClassAtRisk` no admin | Manter em shared; admin só consome |
| Gate via `admin_profiles` | Usar só `organization_memberships` |

---

## 8. Dependências entre waves

```
W1 Fundação (schema snapshots + RLS staging)
  ↓
W2 Painel Professor (consome snapshots + follow-ups)
  ↓
W3 Painel Escola (org aggregation + export)
  ↓
W4 Onboarding (CSV + convites)
  ↓
W5 Painel Rede (multi-org + demo fixtures)
  ↓
W6 LGPD (audit log + hardening)
```

W4 e W5 podem correr em paralelo após W3.

---

## 9. Riscos residuais

1. **Performance:** hooks atuais fazem 3–4 queries por turma; com 30 turmas o painel escola ficará lento sem snapshots.
2. **Deploy admin:** `apps/admin` ainda sem `vercel.json` — demo comercial precisa de URL estável.
3. **Dado esparso:** turmas novas com 0 respostas — estados vazios são requisito de produto, não bug.
4. **LGPD rede:** gestor de rede não pode ver nomes de alunos por padrão — modelar antes de W5.
