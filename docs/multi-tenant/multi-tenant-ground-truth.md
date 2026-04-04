# Ground Truth — Multi-Tenant e Permissões (Broto)

> Status: final (decisões consolidadas) para validação arquitetural.
> Objetivo: definir comportamento esperado (fonte da verdade) para isolamento entre organizações.

## 1) Escopo e modelo base

- Tenant funcional = `organization`.
- `class` pertence exclusivamente a uma organização.
- Usuário pode ter múltiplos vínculos com organizações, com papéis diferentes por organização.
- Professores e admins existem apenas no contexto de uma organização (não existe papel global de professor).
- Aluno não pode criar organização.

## 2) Regras críticas (fechadas)

1. Isolamento entre tenants é obrigatório: nenhuma leitura/escrita pode atravessar organizações sem autorização explícita.
2. Acesso a turma exige coerência de tenant: usuário só pode acessar ações da turma se tiver vínculo ativo com a organização da turma.
3. Matrícula em turma não pode quebrar escopo organizacional.
4. Papéis são tenant-scoped: permissões são avaliadas por organização, não globalmente.
5. Todo endpoint server-side deve validar autenticação + escopo organizacional antes da operação.

## 3) Casos não definidos (decisões finais)

### 3.1 Entrada em turma sem estar na organização

**Pergunta:** bloquear ou permitir entrada automática na organização?

**Decisão final:**
- Via convite/código de turma: permitir **auto-vínculo controlado** na organização durante o join da turma.
- Via fluxo manual sem convite/código válido: bloquear.

**Justificativa:**
- Melhora UX no onboarding.
- Mantém segurança porque o código/invite vira prova de elegibilidade.
- Evita “join cego” em organização sem artefato de autorização.

**Regra operacional:**
- `join_class` deve ser transacional: (1) validar turma ativa, (2) criar/reativar membership org, (3) criar/reativar matrícula.

### 3.2 Usuário em múltiplas organizações e contexto ativo

**Pergunta:** pode estar em múltiplas organizações simultaneamente? existe contexto ativo?

**Decisão final:**
- Sim, pode ter múltiplos memberships ativos.
- Deve existir `current_organization_id` (contexto ativo de tenant) e `current_class_id` opcional, sempre coerente com a organização ativa.

**Regra operacional:**
- Toda ação tenant-scoped usa `current_organization_id` (ou parâmetro explícito validado).
- Troca de contexto deve limpar cache sensível e recarregar dados tenant-scoped.

### 3.3 Mudança de papel (aluno -> professor/admin)

**Pergunta:** como deve funcionar?

**Decisão final:**
- Mudança de papel ocorre por organização, via ação autorizada de `org_admin`.
- Histórico de vínculos é preservado (status + timestamps), sem “recriar usuário”.

**Regra operacional:**
- Upgrade de papel não apaga vínculos de aluno automaticamente.
- Após mudança de papel, sessão deve ser reavaliada (refresh de claims/permissões).
- Não permitir auto-promoção de privilégios.
- Toda mudança de papel deve gerar registro de auditoria.

### 3.4 Saída ou remoção de usuário da organização

**Pergunta:** o que acontece com acessos?

**Decisão final:**
- Remoção desativa membership e remove acessos imediatos a recursos da organização.
- Matrículas da org devem ser inativadas.
- Se usuário estava com contexto ativo nessa org, trocar para outro contexto válido ou estado “sem organização ativa”.

**Regra operacional:**
- “Hard delete” de histórico acadêmico não é padrão; preferir inativação (auditável).
- Owner não pode remover a si mesmo sem transferir ownership.
- Se não houver outro contexto válido após remoção/saída, usuário permanece em estado “sem organização ativa”.

### 3.5 Comportamento da organização ENEM26

**Perguntas:** entrada automática, saída e divisão de turmas.

**Decisão final:**
- Entrada automática no ENEM26 no signup: **sim**, como fallback público inicial.
- Pode sair: **sim**.
- Turmas em ENEM26: múltiplas turmas com regras normais de matrícula; ENEM26 não deve bypassar regras de isolamento.

**Regra operacional:**
- ENEM26 é tenant público padrão, não um “modo especial sem segurança”.
- Convites/códigos de turma continuam valendo dentro de ENEM26.
- Se o usuário sair do ENEM26 e não tiver outra organização, o sistema mantém estado “sem organização ativa” com fallback controlado.

## 4) Ambiguidades/inconsistências atuais a resolver

1. Membership organizacional ainda não está formalizado como entidade canônica para todos os papéis.
2. Join de turma pode ocorrer sem validação completa de vínculo organizacional em alguns fluxos.
3. Há endpoints com `service_role` que dependem de validações de escopo na aplicação; qualquer falha vira risco de acesso cruzado.
4. O contrato de contexto ativo está definido neste documento, mas ainda precisa ser aplicado de forma uniforme em todos os clientes e endpoints.

## 5) Edge cases que devem entrar nos critérios de validação

- Usuário admin em org A e aluno em org B, alternando contexto na mesma sessão.
- Usuário com 2+ turmas ativas em organizações diferentes.
- Turma desativada com alunos ativos e `current_class_id` apontando para ela.
- Revogação de papel durante sessão ativa.
- Reentrada por código em turma onde matrícula estava inativa.
- Tentativas repetidas de código inválido (rate limit/abuso).

## 6) Riscos de segurança e isolamento

- Risco de cross-tenant access quando endpoint usa `service_role` sem validação forte de org/role.
- Risco de vazamento por cache local ao trocar tenant ativo sem invalidar estado.
- Risco de escalonamento indevido se não houver trilha explícita de autorização para mudança de papel.
- Risco de inconsistência entre RLS e regras de negócio quando a validação fica só na aplicação.

## 7) Melhorias de modelo recomendadas

1. Introduzir tabela canônica `organization_memberships` (`user_id`, `organization_id`, `role`, `status`, `invited_by`, `joined_at`, `left_at`).
2. Garantir coerência matrícula-org via constraint/trigger (classe e membership na mesma organização).
3. Formalizar matriz de permissões por ação (RBAC por tenant).
4. Padronizar contexto ativo com invariantes explícitas (`current_organization_id` + `current_class_id` coerente).
5. Exigir validação defensiva em todo endpoint crítico mesmo com RLS habilitado.

## 8) Prontidão para validação arquitetural

- As decisões de comportamento multi-tenant e permissões foram consolidadas como finais.
- O sistema está funcionalmente consistente para iniciar a validação arquitetural.
- O foco da próxima etapa deve ser garantir aderência de implementação (RLS + edge functions + contexto no cliente) ao contrato definido aqui.

## 9) Riscos residuais objetivos (não bloqueiam a validação arquitetural)

- Endpoints com `service_role` ainda exigem hardening para evitar acesso cruzado por falha de validação.
- A ausência de uma tabela canônica de membership aumenta risco de divergência entre regra de negócio e autorização real.
- Sem invalidacão completa de cache na troca de organização, há risco de exposição residual de dados tenant-scoped no cliente.
