# Contexto — Módulo Instituições (Professor → Escola → Rede)

**Phase ID:** `instituicoes`  
**Tipo:** feature transversal (admin + shared + supabase)  
**Status:** planejamento aprovado · execução não iniciada  
**Prazo comercial alvo:** demo vendável em 4–6 semanas (ago–nov/2026)

---

## Por que este módulo é prioridade #1 do roadmap comercial

O Broto precisa deixar de ser percebido como “app de aluno” e virar produto vendável a escola, cursinho, SESI e — futuramente — secretaria. Sem o painel institucional:

- Não existe decisor B2B (coordenador/mantenedor não compra o que não gerencia).
- Não existe argumento B2G (alerta precoce de abandono exige agregação em nível de rede).
- Não existe atestado técnico para editais futuros.

**Implicação de prioridade:** bom o suficiente para demo de vendas em 4–6 semanas, mesmo incompleto — não precisa nascer pronto para 500 escolas.

---

## Documentos obrigatórios (ler antes de codar)

1. [`docs/multi-tenant/multi-tenant-ground-truth.md`](../../../docs/multi-tenant/multi-tenant-ground-truth.md)
2. [`docs/multi-tenant/multi-tenant-permissions-matrix.md`](../../../docs/multi-tenant/multi-tenant-permissions-matrix.md)
3. [`docs/instituicoes-arquitetura.md`](../../../docs/instituicoes-arquitetura.md)
4. [`.planning/phases/instituicoes/RESEARCH.md`](./RESEARCH.md) — gap analysis repo vs spec
5. [`.planning/phases/instituicoes/PLAN.md`](./PLAN.md) — waves e requisitos INST-*
6. [`docs/broto-f2-admin.md`](../../../docs/broto-f2-admin.md) — admin existente

---

## Mapeamento spec → código existente

| Conceito do documento de produto | Entidade / código no Broto | Status |
|----------------------------------|----------------------------|--------|
| Instituição (tenant) | `organizations` | ✅ Existe |
| Unidade escolar | `organizations` (MVP) ou `school_units` (fase rede) | ⚠️ Fundir no MVP |
| Turma | `classes` | ✅ Existe |
| Vínculo usuário + papel | `organization_memberships` (`student`, `teacher`, `org_admin`, `owner`) | ✅ Existe |
| Vínculo aluno ↔ turma | `enrollments` | ✅ Existe |
| Convite / onboarding | `class-join` RPC + `access_code` | ⚠️ Parcial |
| p_know por habilidade | `topic_performance.p_know` + BKT em `answer-question` | ✅ Existe |
| Painel professor | `apps/admin` → `ClassTeacherDashboard`, `useTeacherClassInsights` | ⚠️ Parcial |
| Agregados de engajamento | — | ❌ Não existe (calcular on-the-fly hoje) |
| Marcação “acompanhamento” | — | ❌ Não existe |
| Painel escola / rede | — | ❌ Não existe |

---

## Personas e superfícies de UX

O painel tem **duas superfícies distintas**, não uma só adaptada:

| Persona | Pergunta ao abrir | Frequência | Superfície |
|---------|-------------------|------------|------------|
| **Professor** | Quem da minha turma está travado ou sumiu? Em qual habilidade? | Diária/semanal | Camada 1 — rápida, baixo atrito |
| **Coordenador (escola)** | Quais turmas precisam de intervenção antes do conselho? | Semanal | Camada 2 — agregação + alertas |
| **Diretor/Mantenedor** | Isso justifica renovar o contrato? | Mensal | Camada 2 — export PDF / prova de valor |
| **Gestor de rede** | Quais escolas estão em risco de abandono? | Mensal/trimestral | Camada 3 — projetor, números grandes |
| **Vendas** | O que mostro em 15 min que fecha? | Toda reunião | Demo script + Camadas 1–3 |

---

## Escopo por camada

### Camada 1 — Professor (MVP, construir primeiro)

- Lista de alunos com **três sinais visuais** (cor > número): engajado, em risco, sumido.
- Visão por habilidade/tópico com `p_know` baixo em massa na turma.
- Drill-down aluno: sessões recentes, acertos/erros, última atividade.
- Ação: marcar aluno para **acompanhamento** (sinal para coordenação).
- Zero configuração: professor loga e vê a turma.

**Base existente:** `useClassIndicators`, `useTeacherClassInsights`, `computeClassAtRisk` em `@broto/shared`.

### Camada 2 — Escola/Coordenação (MVP+)

- Visão agregada de turmas + ranking de engajamento.
- Alertas de risco cross-turma (queda abrupta de engajamento).
- Relatório exportável (PDF/link).
- Gestão: CSV de alunos, criar turmas, vincular professores.

### Camada 3 — Rede (demo comercial)

- Visão multi-escola comparativa.
- Índice de risco de abandono por escola/regional.
- Filtros por período, série, componente.
- **Dados de demo permitidos** — arquitetura multi-tenant real desde o dia 1.

---

## Requisitos não-funcionais (não negociáveis)

1. **Multi-tenancy real** — RLS + authz em edge functions; zero vazamento entre orgs.
2. **RBAC tenant-scoped** — professor → turmas; coordenador → org; gestor rede → escopo de rede.
3. **LGPD por design** — agregados na rede; nome de aluno só para vínculo pedagógico direto.
4. **Performance com dado esparso** — estados vazios bem desenhados.
5. **Exportável** — PDF/CSV/link para reuniões.
6. **Agregados assíncronos** — job periódico, não recalcular tudo no request.

---

## Decisões já tomadas

| # | Decisão | Escolha |
|---|---------|---------|
| D1 | Tenant funcional | `organization` (ground truth existente) |
| D2 | Unidade escolar no MVP | Fundir com `organizations`; `school_units` só na fase rede |
| D3 | Backend de agregação | Edge Functions + tabelas snapshot Postgres (não FastAPI) |
| D4 | App do painel | `apps/admin` (não web aluno) |
| D5 | Cálculo de engajamento | Job horário via `pg_cron` ou edge function agendada |
| D6 | Painel rede com dados simulados | Permitido para demo; flag `is_demo` em org/fixtures |
| D7 | Notificações push/e-mail de alerta | **Fora do MVP** — registro basta na v1 |
| D8 | Integração SGP/estadual | **Fora do MVP** |
| D9 | Fórmula de risco customizável por cliente | **Fora do MVP** — fórmula única documentada |

---

## O que NÃO construir ainda

- Notificações automáticas de alerta (v2).
- Integração com sistemas acadêmicos estaduais.
- Customização de fórmula de risco por cliente.
- App mobile nativo do painel institucional.

---

## Checklist antes de demo comercial

- [ ] RLS testada sem furo entre tenants (ver Wave 1)
- [ ] Estado vazio/dado escasso não quebra a tela
- [ ] Export PDF com identidade Broto
- [ ] Painel rede rotulado como demo quando usar fixtures
- [ ] Frase pronta para “e a LGPD?” (Wave 6)
