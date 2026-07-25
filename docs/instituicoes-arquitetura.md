# Arquitetura — Módulo Instituições

**Versão:** 1.0 · Julho 2026  
**Status:** especificação aprovada para implementação  
**Relacionados:** [CONTEXT](../.planning/phases/instituicoes/CONTEXT.md) · [PLAN](../.planning/phases/instituicoes/PLAN.md) · [ground truth multi-tenant](./multi-tenant/multi-tenant-ground-truth.md)

---

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/admin (React/Vite)                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Camada 1     │  │ Camada 2     │  │ Camada 3     │          │
│  │ Professor    │  │ Escola       │  │ Rede (demo)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Functions (Deno)                                          │
│  engagement-*-get · student-follow-up-set · org-students-import │
│  org-report-export · engagement-snapshot-refresh (cron)         │
│  authz: requireUser → requireMembership / requireClassAccess    │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ engagement_     │  │ topic_          │  │ organization_   │
│ snapshots_*     │  │ performance     │  │ memberships     │
│ student_follow_ │  │ users · enroll- │  │ classes ·       │
│ ups             │  │ ments · answers │  │ organizations   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          ▲
          │ job horário
┌─────────┴─────────┐
│ packages/shared   │
│ compute-engagement│
│ computeClassAtRisk│
│ student-engagement│
│ -state            │
└───────────────────┘
```

---

## Modelo de dados

### Entidades existentes (não duplicar)

| Entidade | Tabela | Notas |
|----------|--------|-------|
| Instituição | `organizations` | Tenant root |
| Turma | `classes` | FK `organization_id` |
| Matrícula aluno | `enrollments` | FK `class_id`, `student_id`, `status` |
| Membership | `organization_memberships` | Roles: `student`, `teacher`, `org_admin`, `owner` |

### Entidades novas (Wave 1)

#### `engagement_snapshots_class`

Snapshot de engajamento por turma, recalculado periodicamente.

```sql
CREATE TABLE public.engagement_snapshots_class (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id              uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  computed_at           timestamptz NOT NULL DEFAULT now(),
  total_students        int NOT NULL DEFAULT 0,
  active_7d_count       int NOT NULL DEFAULT 0,
  active_7d_pct         numeric(5,2) NOT NULL DEFAULT 0,
  streak_broken_count   int NOT NULL DEFAULT 0,
  missing_count         int NOT NULL DEFAULT 0,  -- sem uso há N dias
  missing_days_threshold int NOT NULL DEFAULT 7,
  avg_p_know_by_area    jsonb NOT NULL DEFAULT '{}',  -- { "matematica": 0.42, ... }
  weak_topics           jsonb NOT NULL DEFAULT '[]',  -- top tópicos fracos em massa
  at_risk_student_ids   uuid[] NOT NULL DEFAULT '{}',
  UNIQUE (class_id, computed_at)
);
```

#### `engagement_snapshots_org`

Agregado por organização (soma/média das turmas ativas).

```sql
CREATE TABLE public.engagement_snapshots_org (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  computed_at             timestamptz NOT NULL DEFAULT now(),
  total_classes           int NOT NULL DEFAULT 0,
  total_students          int NOT NULL DEFAULT 0,
  active_7d_pct           numeric(5,2) NOT NULL DEFAULT 0,
  abandonment_risk_index  numeric(5,2) NOT NULL DEFAULT 0,  -- ver fórmula abaixo
  class_rankings          jsonb NOT NULL DEFAULT '[]',  -- [{ class_id, name, active_7d_pct }]
  at_risk_alerts          jsonb NOT NULL DEFAULT '[]',
  UNIQUE (organization_id, computed_at)
);
```

#### `student_follow_ups`

Marcação de acompanhamento pelo professor.

```sql
CREATE TABLE public.student_follow_ups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  class_id        uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  marked_by       uuid NOT NULL REFERENCES auth.users(id),
  note            text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  UNIQUE (class_id, student_id, status)  -- um active por aluno/turma
);
```

### Entidades fase rede (Wave 5)

#### `school_units` (opcional até W5)

```sql
CREATE TABLE public.school_units (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_org_id  uuid NOT NULL REFERENCES public.organizations(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),  -- escola filha
  regional_label  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## Estados de engajamento do aluno

Lógica pura em `packages/shared/src/engagement/student-engagement-state.ts`:

| Estado | Cor (UI) | Critério (defaults) |
|--------|----------|---------------------|
| `engaged` | Verde | Resposta nos últimos 7 dias **e** streak > 0 |
| `at_risk` | Amarelo | Streak quebrado (streak = 0) mas resposta nos últimos 14 dias |
| `missing` | Vermelho | Sem resposta há ≥ 7 dias (`INACTIVE_DAYS`) |

Parâmetros configuráveis via `organizations.config.engagement` (futuro); MVP usa constantes documentadas.

---

## Índice de risco de abandono (org / rede)

Fórmula v1 (documentar em reuniões técnicas):

```
abandonment_risk_index = (
  0.40 × (1 - active_7d_pct) +
  0.35 × (missing_count / total_students) +
  0.25 × (streak_broken_count / total_students)
) × 100
```

Escala 0–100. Acima de 60 = alto risco (cor vermelha na UI rede).

---

## RBAC por camada

| Ação | student | teacher | org_admin | owner | network_admin* |
|------|---------|---------|-----------|-------|----------------|
| Ver turma própria | — | ✅ | ✅ | ✅ | escopo rede |
| Ver alunos da turma | — | ✅ | ✅ | ✅ | agregado only |
| Marcar acompanhamento | — | ✅ | ✅ | ✅ | — |
| Ver painel escola | — | — | ✅ | ✅ | ✅ |
| Export PDF org | — | — | ✅ | ✅ | ✅ |
| Import CSV alunos | — | — | ✅ | ✅ | — |
| Ver nomes aluno (rede) | — | ✅ | ✅ | ✅ | ❌ default |
| Ver painel rede | — | — | — | — | ✅ |

\* `network_admin` — role novo ou membership em org pai; definir na Wave 5.

---

## RLS (princípios)

1. Toda tabela nova inclui `organization_id` denormalizado para policy simples.
2. Reutilizar `app_user_is_active_member_of_org(organization_id)`.
3. Snapshots: SELECT se membership staff ativa na org; INSERT/UPDATE só `service_role` (job).
4. `student_follow_ups`: professor da turma ou org_admin da org.
5. Testes de violação cross-tenant obrigatórios antes de merge.

---

## Pipeline de agregação

```
[Cron horário]
     │
     ▼
engagement-snapshot-refresh (edge function, service_role após validação interna)
     │
     ├─► Para cada org com membership staff ativa (ou todas via service_role):
     │     Para cada class ativa:
     │       1. Buscar enrollments ativos
     │       2. Buscar users (streak), answers (7d), topic_performance
     │       3. computeEngagementSnapshot() em shared
     │       4. UPSERT engagement_snapshots_class
     │     Agregar org → engagement_snapshots_org
     │
     └─► Retornar contagem processada (observabilidade)
```

**SLA:** snapshot com até 1h de defasagem — aceitável para painel gestor.

---

## API (edge functions)

### `GET engagement-class-get?classId=`

- Auth: `requireClassAccess(classId)`
- Retorna: último snapshot + lista alunos com `engagementState` + follow-ups ativos
- Fallback: se snapshot ausente, calcular inline (turma pequena) com flag `computed_inline: true`

### `GET engagement-org-get?organizationId=`

- Auth: `requireMembership(orgId, ['org_admin', 'owner'])`
- Retorna: último snapshot org + ranking turmas + alertas

### `POST student-follow-up-set`

- Body: `{ classId, studentId, note?, action: 'mark' | 'resolve' }`
- Auth: `requireClassAccess` + role teacher+

### `POST org-students-import`

- Body: CSV parseado ou multipart
- Auth: org_admin+
- Validação linha a linha; transação parcial com relatório de erros

### `GET org-report-export?organizationId=&format=pdf`

- Auth: org_admin+
- Gera PDF com identidade Broto (logo, cores org)

---

## LGPD

| Camada | Dado pessoal | Regra |
|--------|--------------|-------|
| Professor | Nome, desempenho individual | OK — vínculo pedagógico |
| Escola | Nome + turma em alertas | OK — coordenação |
| Rede | Apenas agregados | Sem nome de aluno por default |
| Export PDF | Conforme camada solicitante | Watermark + data geração |
| Audit log | `sensitive_data_access_log` | Wave 6 — toda leitura de drill-down aluno |

---

## Demo comercial (rede)

- Organizações seed com `config.is_demo = true`
- Fixture script: `supabase/scripts/seed-network-demo.sql`
- Banner interno no admin: “Dados de demonstração”
- README em `apps/admin/src/pages/network/` documentando o que é real vs fixture

---

## Fora de escopo técnico

- FastAPI / serviço Python separado para agregação
- Push notifications
- Integração SGP
- Mobile nativo do painel
