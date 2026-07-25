# Verificação — Módulo Instituições

**Status:** pendente (preencher ao concluir cada wave)

---

## Wave 1 — Fundação

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| Migrations aplicam local | OK | 2026-07-07 | db push remoto |
| RLS em snapshots + follow_ups | OK | 2026-07-07 | inst_rls_verify.sql |
| inst_rls_cross_tenant.sql | Pendente | | manual com JWT personas |
| pr08_rls_matrix_manual (staging) | Pendente | | manual com JWT personas |
| Deploy 3 edge functions | OK | 2026-07-07 | engagement-* + student-follow-up-set |
| Cron ENGAGEMENT_CRON_SECRET | Pendente | | ver docs/instituicoes-ops.md |
| test:shared verde | OK | 2026-07-07 | 121 testes |
| test:functions verde | OK | 2026-07-07 | 97 testes |

---

## Wave 2 — Painel Professor

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| 3 estados visuais (cor) | OK | 2026-07-07 | aba Alunos no painel |
| Drill-down aluno | Parcial | | link para StudentDetail existente |
| Follow-up persiste | OK | 2026-07-07 | student-follow-up-set |
| Estado vazio turma nova | OK | 2026-07-07 | EmptyClassState |

---

## Wave 3 — Painel Escola

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| Ranking turmas | OK | 2026-07-08 | OrgDashboard + engagement-org-get |
| Alertas cross-turma | OK | 2026-07-08 | OrgRiskAlerts com filtros severidade |
| Export PDF | OK | 2026-07-08 | print CSS MVP — ver `pages/school/README.md` |
| Gate org_admin/owner | OK | 2026-07-08 | OrgAdminRoute + requireMembership na API |
| Import CSV | OK | 2026-07-08 | OrgClassManagement + org-students-import (INST-13 antecipado) |

---

## Wave 4 — Onboarding

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| Criar org sem SQL | | | |
| Convidar professor | | | |
| Import alunos CSV | | | |

---

## Wave 5 — Painel Rede

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| Comparativo multi-escola | OK | 2026-07-08 | NetworkDashboard + engagement-network-get |
| Índice risco documentado | OK | 2026-07-08 | fórmula na UI + compute-org-engagement-index |
| Fixtures rotuladas demo | OK | 2026-07-08 | seed-network-demo.sql + banner is_demo |
| Sem nomes aluno (rede) | OK | 2026-07-08 | assertNetworkViewHasNoStudentNames + smoke script |
| Smoke automatizável | OK | 2026-07-08 | data-testid + npm run smoke:network |

---

## Wave 6 — LGPD

| Check | Resultado | Data | Notas |
|-------|-----------|------|-------|
| LGPD-AUDIT.md gerado | | | |
| Log acesso sensível | | | |
| Resposta "e a LGPD?" pronta | | | |

---

## Demo comercial final

- [ ] RLS sem furo entre tenants
- [ ] Estado vazio não parece bug
- [ ] PDF identidade Broto
- [ ] Rede rotulada demo
- [ ] Frase LGPD pronta
