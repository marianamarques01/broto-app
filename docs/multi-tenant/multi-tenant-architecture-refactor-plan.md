# Plano de Refatoração Arquitetural — Multi-Tenant

> Base: `docs/multi-tenant-ground-truth.md`
> Objetivo: alinhar implementação (DB + RLS + Edge Functions + frontend) ao modelo final de isolamento e permissões por organização.
> Estratégia: migração incremental, sem corte abrupto, mantendo o sistema funcional.

## Princípios de execução

- **Segurança primeiro:** nenhuma etapa reduz isolamento entre tenants.
- **Expand -> Migrate -> Contract:** introduzir estrutura nova em paralelo, migrar uso, só então remover legado.
- **Compatibilidade temporária:** durante a transição, manter leitura/escrita em modelo antigo + novo quando necessário.
- **Rollback por fase:** cada fase deve ser revertível sem corromper dados.

## Visão geral de fases

| Fase | Foco | Dependências |
|---|---|---|
| 1 | Fundação de dados (membership + contexto ativo) | Nenhuma |
| 2 | Hardening de autorização server-side | Fase 1 |
| 3 | RLS tenant-scoped final | Fases 1 e 2 |
| 4 | Fluxos críticos (class-join + signup ENEM26) | Fases 1, 2 e 3 |
| 5 | Frontend com contexto de organização | Fases 1 e 4 |
| 6 | Contract/cleanup + auditoria final | Fases 1-5 |

---

## Fase 1 — Fundação de dados

### Objetivo
Criar os artefatos canônicos para multi-org e contexto ativo sem quebrar fluxos atuais.

### Mudanças
- Criar `organization_memberships` com colunas mínimas:
  - `id`, `user_id`, `organization_id`, `role`, `status`, `invited_by`, `joined_at`, `left_at`, `created_at`, `updated_at`.
- Adicionar `current_organization_id` em `public.users` (nullable na introdução).
- Constraints/índices:
  - unicidade por usuário+organização ativa;
  - índices por `(user_id, status)` e `(organization_id, status)`;
  - check de `role` e `status`.
- Backfill inicial:
  - gerar memberships para admins via `admin_profiles`;
  - gerar memberships de alunos por `enrollments -> classes.organization_id`;
  - preencher `users.current_organization_id` com base em `current_class_id` quando possível.

### Riscos
- Duplicidade de memberships no backfill.
- Inconsistência de `current_class_id` com organização real.

### Mitigação
- Migração idempotente com `ON CONFLICT DO NOTHING`.
- Script de validação pós-migração (contagens, órfãos, conflitos).

### Critérios de sucesso
- `organization_memberships` populada para 100% dos usuários ativos.
- `users.current_organization_id` preenchido para usuários com turma ativa.
- Zero inconsistências críticas em relatório de validação.

---

## Fase 2 — Hardening de autorização em Edge Functions

### Objetivo
Eliminar autorização ad hoc e padronizar checagem de identidade + escopo organizacional.

### Mudanças
- Criar camada compartilhada em `supabase/functions/_shared/authz.ts` (ou equivalente):
  - `requireUser(req)`;
  - `requireMembership(userId, organizationId, role?)`;
  - `requireClassAccess(userId, classId, minRole?)`;
  - `resolveActiveContext(userId)`.
- Refatorar todas as funções:
  - `material-index`: auth obrigatório + verificação de role org_admin/teacher da organização da turma/material.
  - `broto-chat`: validar contexto ativo coerente (classe pertence à organização ativa ou classId explícito validado).
  - `user-me`, `pet-me`, `user-progress`: remover dependência implícita de contexto legado quando aplicável.
- Política explícita de negação: sem contexto válido -> `403`/`400` controlado.

### Riscos
- Regressão funcional por checagens novas.
- Aumento de latência por joins de autorização.

### Mitigação
- Feature flag de enforcement estrito por função.
- Índices para consultas de membership e classe.

### Critérios de sucesso
- 100% das Edge Functions críticas usando helper único de authz.
- Nenhuma função crítica com auth opcional.
- Testes de autorização (positivo/negativo) cobrindo casos cross-tenant.

---

## Fase 3 — RLS tenant-scoped final

### Objetivo
Fazer o banco impor isolamento por organização como primeira linha de defesa.

### Mudanças
- Revisar policies para usar `organization_memberships` (não `admin_profiles` como fonte primária).
- Regras principais:
  - acesso por membership ativo na organização do recurso;
  - permissões por role tenant-scoped;
  - `enrollments` só permite insert/update quando usuário tem membership da org da turma.
- Criar trigger/constraint de coerência:
  - matrícula deve sempre apontar para turma da mesma organização de membership do aluno.
- Manter políticas legadas em paralelo por janela curta com monitoramento, depois desativar.

### Riscos
- Bloqueio inesperado de fluxos por policy restritiva.
- Complexidade de migração de policy em produção.

### Mitigação
- Rollout em ambiente staging com datasets reais.
- Test matrix RLS por perfil (aluno, professor, org_admin, usuário multi-org).

### Critérios de sucesso
- Nenhum acesso cross-tenant possível via cliente autenticado.
- Policies legadas descontinuadas sem regressão.
- `EXPLAIN` de queries críticas dentro do orçamento de performance.

---

## Fase 4 — Fluxos críticos de domínio

### Objetivo
Alinhar join e signup ao comportamento final definido no ground truth.

### Mudanças
- `class-join` transacional:
  - validar turma ativa;
  - criar/reativar membership da organização da turma;
  - criar/reativar enrollment;
  - atualizar `current_organization_id` e `current_class_id` de forma coerente.
- Centralizar signup:
  - fluxo único server-side para garantir regras ENEM26;
  - entrada automática no ENEM26;
  - política de saída: suportar estado sem organização ativa com fallback controlado.
- Definir fluxo de saída/remoção:
  - inativar membership + inativar enrollments relacionados;
  - resolver contexto ativo após saída.

### Riscos
- Condições de corrida em join simultâneo.
- Falhas parciais em updates de contexto.

### Mitigação
- RPC ou transação SQL com lock lógico.
- Idempotência em joins repetidos.

### Critérios de sucesso
- Join por código sempre resulta em estado consistente membership+enrollment+contexto.
- Signup sempre gera estado inicial válido (ENEM26 ou sem org ativa conforme regra).
- Saída de organização revoga acesso imediatamente.

---

## Fase 5 — Frontend com contexto ativo de organização

### Objetivo
Garantir que mobile/web/admin operem sempre em `current_organization_id` explícito.

### Mudanças
- Introduzir `OrganizationContext` compartilhado (ou padrão equivalente por app):
  - tenant ativo, lista de memberships, troca de contexto.
- Ajustar `ClassContext` para depender de organização ativa.
- Atualizar chamadas de API/hooks para carregar recursos do tenant ativo.
- Invalidar caches user-scoped/tenant-scoped ao trocar organização.
- UI mínima de troca de organização (quando multi-org).

### Riscos
- Exposição de dados de tenant anterior via cache local.
- inconsistência de navegação em sessão com múltiplas orgs.

### Mitigação
- Namespace de cache por `user_id + organization_id`.
- Guard central de rota/contexto inválido.

### Critérios de sucesso
- Troca de organização não vaza dados entre tenants.
- Todas as telas críticas respeitam tenant ativo.
- Comportamento consistente entre mobile, web e admin.

---

## Fase 6 — Contract e limpeza de legado

### Objetivo
Remover caminhos antigos e fechar arquitetura final.

### Mudanças
- Descontinuar dependências de autorização via `admin_profiles` como fonte primária (manter apenas se necessário para compat).
- Remover políticas/queries legadas que não usam membership canônico.
- Consolidar documentação técnica:
  - arquitetura final;
  - matriz de permissões por ação;
  - runbooks operacionais.
- Auditoria final de segurança e isolamento.

### Riscos
- Remoção prematura de compatibilidade.
- lacunas de documentação para manutenção futura.

### Mitigação
- Checklist de corte por feature flag.
- janela de observabilidade antes do cleanup definitivo.

### Critérios de sucesso
- Arquitetura sem dualidade de modelo de autorização.
- Documentação atualizada e auditável.
- Checklist final de isolamento 100% aprovado.

---

## Migração de dados (resumo pragmático)

1. **Backfill memberships**
   - Admins via `admin_profiles`.
   - Alunos via `enrollments -> classes.organization_id`.
2. **Backfill contexto ativo**
   - `current_organization_id` a partir de `current_class_id`.
3. **Reconciliação**
   - Usuários sem vínculo: entrar em fluxo ENEM26/fallback controlado.
4. **Validação**
   - relatório de órfãos e inconsistências antes de ativar enforcement completo.

## Dependências críticas entre etapas

- Sem Fase 1 não existe base para Fase 2/3.
- Fase 3 (RLS final) deve entrar antes do rollout pleno de frontend multi-org.
- Fase 4 (`class-join`/signup) depende de authz hardening da Fase 2.
- Fase 6 só após métricas estáveis em produção/staging.

## Riscos transversais

- **Segurança:** endpoints com `service_role` sem check rigoroso.
- **Integridade:** estados parciais em join/signup.
- **Operação:** regressão por policy RLS restritiva sem staging robusto.

## Definição de pronto global

O alinhamento ao ground truth é considerado concluído quando:

- isolamento cross-tenant está garantido em DB + API + cliente;
- permissões são tenant-scoped e auditáveis;
- `current_organization_id` é usado de forma consistente em todo o sistema;
- fluxos de join/signup/saída respeitam o contrato funcional final.
