# Pitfalls Research

**Domain:** Validação e hardening de arquitetura multi-tenant (Supabase + apps mobile/web/admin)
**Researched:** 2026-04-03
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Confiar em checks de frontend para isolamento entre tenants

**What goes wrong:**
O sistema parece correto na UI (filtros por turma/organização), mas consultas diretas no PostgREST ou chamadas de função permitem leitura/escrita cross-tenant porque o controle real não está no banco.

**Why it happens:**
Em sistemas legados com múltiplos frontends, é comum cada cliente aplicar regras de permissão próprias, criando "consistência visual" sem consistência de segurança.

**How to avoid:**
Definir o banco como fonte de verdade: toda tabela sensível com RLS habilitado e políticas baseadas em `auth.uid()` + vínculo explícito com `organization_id`/`class_id`, nunca apenas filtros client-side.

**Warning signs:**
- Mesmo endpoint retorna dados distintos quando chamado por app vs curl direto.
- Policies com `USING (true)` em tabelas não-públicas.
- Diferença de comportamento entre mobile e web para o mesmo usuário.

**Phase to address:**
**Fase futura A — Inventário de superfície de dados e isolamento efetivo**.

---

### Pitfall 2: RLS incompleto (SELECT protegido, UPDATE/INSERT vazando)

**What goes wrong:**
A validação cobre leitura, mas não cobre mutação. Usuário consegue inserir ou atualizar linhas de outro tenant alterando payload (`class_id`, `organization_id`, owner).

**Why it happens:**
Equipes validam só o "happy path" de leitura; em Postgres, política de `SELECT` não substitui `WITH CHECK` para `INSERT/UPDATE`.

**How to avoid:**
Para cada tabela multi-tenant, validar matriz completa `SELECT/INSERT/UPDATE/DELETE` com `USING` + `WITH CHECK` simétricos e teste negativo por operação.

**Warning signs:**
- Existe policy de `SELECT`, mas não de `INSERT`/`UPDATE`.
- `UPDATE` funciona sem política de `SELECT` devidamente modelada.
- Usuário consegue "trocar de tenant" ao editar FKs.

**Phase to address:**
**Fase futura B — Matriz canônica de permissões por operação**.

---

### Pitfall 3: Cadeia de permissão quebrada (membership -> class -> organization)

**What goes wrong:**
A regra valida uma aresta (ex.: usuário pertence à classe), mas não valida o caminho completo até organização. Isso abre buracos de escalonamento lateral entre classes/organizações.

**Why it happens:**
Modelos evoluídos organicamente acumulam shortcuts em policies e edge functions, sem uma definição formal de cadeia de autoridade.

**How to avoid:**
Criar "Permission Chain Spec" único: toda autorização depende de prova explícita do caminho completo (`user -> enrollment/membership -> class -> organization`) com regras de negação padrão.

**Warning signs:**
- Policies usando só `class_id` sem join/vínculo com organização.
- Serviços que aceitam `organization_id` do cliente sem revalidar membership.
- Casos em que admin de classe acessa dados de outra organização.

**Phase to address:**
**Fase futura C — Especificação e enforcement da cadeia de autorização**.

---

### Pitfall 4: Uso inseguro de JWT claims em RLS

**What goes wrong:**
Autorização é baseada em claim mutável (`raw_user_meta_data`) ou claim stale; revogações demoram para refletir e o usuário mantém acesso indevido.

**Why it happens:**
`auth.jwt()` é poderoso, mas equipes tratam qualquer claim como confiável e "tempo real".

**How to avoid:**
Usar `auth.uid()` como base primária de identidade; quando usar claims, restringir a `raw_app_meta_data` e exigir estratégia explícita de refresh/revogação de sessão.

**Warning signs:**
- Policy depende de metadado editável pelo usuário.
- Mudança de papel não surte efeito imediato.
- Incidentes "deslogar e logar resolve acesso indevido".

**Phase to address:**
**Fase futura D — Hardening de claims, sessão e revogação**.

---

### Pitfall 5: Bypass de RLS por roles/funções privilegiadas sem guarda

**What goes wrong:**
Funções `SECURITY DEFINER`, `service_role` ou roles com `BYPASSRLS` viram atalho permanente; qualquer bug de validação nessas rotas expõe dados de múltiplos tenants.

**Why it happens:**
Atalhos de admin são introduzidos para resolver bloqueios de performance/operação e ficam sem boundary claro de uso.

**How to avoid:**
Minimizar superfícies de bypass, isolar funções privilegiadas em schema não exposto, impor validação interna de tenant e auditoria de chamadas administrativas.

**Warning signs:**
- Funções privilegiadas em schema exposto via API.
- Endpoint administrativo reutilizado por fluxo de produto.
- Não existe trilha de auditoria para operações com privilégio elevado.

**Phase to address:**
**Fase futura E — Governança de privilégios e trilha de auditoria**.

---

### Pitfall 6: Views materializadas/lógicas expondo dados sem `security_invoker`

**What goes wrong:**
View criada com comportamento padrão contorna expectativa de RLS e vaza dados agregados ou detalhados cross-tenant.

**Why it happens:**
Views são tratadas como "somente leitura segura", sem revisar semântica de segurança no Postgres/Supabase.

**How to avoid:**
Em Postgres 15+, usar `security_invoker = true` quando a view deve obedecer RLS; em cenários legados, restringir grants e mover views sensíveis para schemas não expostos.

**Warning signs:**
- Dados corretos na tabela base, mas incorretos na view.
- View acessível por `anon/authenticated` sem revisão de RLS.
- Relatórios agregados exibem números incompatíveis com escopo do usuário.

**Phase to address:**
**Fase futura F — Revisão de views, relatórios e caminhos indiretos**.

---

### Pitfall 7: Falta de testes adversariais de isolamento (só happy path)

**What goes wrong:**
Validação "passa" porque só cobre usuário autorizado; cenários de invasão lateral entre tenants não são exercitados.

**Why it happens:**
Testes de app não substituem testes de política SQL; sem suíte de negação, regressões passam despercebidas.

**How to avoid:**
Adicionar suíte de testes de banco (pgTAP/Supabase CLI) com pares de tenants A/B, cobrindo tentativas explícitas de leitura e mutação cross-tenant.

**Warning signs:**
- Não existe teste "usuário A tentando acessar tenant B".
- CI valida UI e API, mas não valida políticas SQL.
- Mudança em migration de policy sem teste de regressão.

**Phase to address:**
**Fase futura G — Testes de isolamento e regressão de autorização**.

---

### Pitfall 8: Divergência entre mobile/web/admin na resolução de contexto de tenant

**What goes wrong:**
Cada frontend resolve tenant ativo de forma diferente (cache, contexto local, fallback), gerando comportamentos inconsistentes de acesso e bugs difíceis de reproduzir.

**Why it happens:**
Código duplicado e evolução independente por plataforma criam regras de autorização implícitas diferentes.

**How to avoid:**
Centralizar contrato de resolução de contexto (`tenant_id`, `class_id`, papéis efetivos) em módulo compartilhado e validar observabilidade por plataforma.

**Warning signs:**
- Mesmo usuário vê datasets distintos entre plataformas.
- Troca de turma/organização não invalida cache em todos os apps.
- Bugs "só no mobile" ou "só no web" para permissão.

**Phase to address:**
**Fase futura H — Alinhamento cross-frontend + invalidation de contexto**.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusar endpoint administrativo para fluxo de usuário | Entrega rápida | Superfície de bypass cresce | Nunca |
| Fazer validação só no frontend | Menos SQL/policies | Vazamento cross-tenant silencioso | Nunca |
| Política genérica `USING (true)` para destravar feature | Remove bloqueio imediato | Exposição ampla de dados | Apenas tabela explicitamente pública |
| Copiar regra de permissão entre apps sem contrato central | Rapidez local | Drift entre mobile/web/admin | Só como mitigação temporária com prazo |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + RLS | Confiar em claim editável para autorização | Basear em `auth.uid()` + tabela de vínculo tenant |
| Edge Functions + DB | Repassar `tenant_id` do cliente sem revalidar | Derivar escopo do usuário autenticado no backend |
| Service role usage | Colocar chave privilegiada em fluxo cliente | Restringir ao backend seguro e com auditoria |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Policies sem índice em colunas de tenant | Latência alta em listagens | Indexar `organization_id`, `class_id`, `user_id` usados em policy | ~10k+ linhas por tabela operacional |
| Policies com joins pesados por linha | CPU alta no banco | Reescrever policy para conjuntos/funções bem delimitadas | Crescimento de concorrência e relatórios |
| Falta de filtro explícito na query do app | Scan amplo apesar de RLS | Sempre filtrar por chave de escopo no cliente também | Listagens paginadas com alto volume |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Role com `BYPASSRLS` sem governança | Exposição total de dados | Revisão periódica de roles e rotação de credenciais |
| `SECURITY DEFINER` em schema exposto | Escalonamento de privilégio | Manter em schema privado e restringir EXECUTE |
| Dependência de JWT stale para acesso crítico | Janela de acesso indevido após revogação | Refresh forçado em mudanças de papel + validação server-side |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Acesso negado genérico sem contexto | Suporte não consegue diagnosticar | Erros de autorização com motivo rastreável (sem vazar dados) |
| Mudança de turma sem invalidar cache | Usuário vê dados "misturados" | Invalidar cache por troca de escopo e recarregar estado |
| Inconsistência entre plataformas | Percepção de bug/intermitência | Contrato único de permissão e testes E2E cruzados |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **RLS habilitado:** falta cobrir todas as operações (`SELECT/INSERT/UPDATE/DELETE`) com testes negativos.
- [ ] **Permissões validadas no app:** falta provar isolamento contra chamadas diretas ao banco/API.
- [ ] **Modelo de tenant documentado:** falta mapear cada regra real para `membership -> class -> organization`.
- [ ] **Correções aplicadas:** falta suíte de regressão para impedir reabertura de vazamentos.
- [ ] **Admin seguro:** falta inventário e auditoria de superfícies com bypass de RLS.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Vazamento cross-tenant por policy | HIGH | Congelar escrita, corrigir policy, rodar testes adversariais, auditar acesso histórico, comunicar incidente |
| Drift de permissão entre apps | MEDIUM | Canonizar contrato de autorização, alinhar wrappers por plataforma, adicionar testes cruzados |
| Uso indevido de role privilegiada | HIGH | Revogar/rotacionar credenciais, restringir grants, mover função para schema privado, auditar chamadas |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Frontend como fonte de autorização | Fase A — Inventário de superfície | Teste direto via API sem frontend bloqueia cross-tenant |
| RLS incompleto por operação | Fase B — Matriz canônica de permissões | Matriz CRUD validada por tenant A/B |
| Cadeia membership->class->organization quebrada | Fase C — Enforcement da cadeia | Casos negativos por salto de nível falham |
| Claims JWT inseguras/stale | Fase D — Hardening de sessão/claims | Mudança de papel revoga acesso no SLA definido |
| Bypass de RLS sem controle | Fase E — Governança de privilégios | Inventário de roles/funções + auditoria de uso |
| Views/relatórios vazando dados | Fase F — Revisão de caminhos indiretos | Relatórios respeitam escopo de tenant em testes |
| Falta de testes adversariais | Fase G — Testes de isolamento | CI bloqueia merge com regressão de policy |
| Divergência mobile/web/admin | Fase H — Alinhamento cross-frontend | Mesma identidade/escopo gera mesma autorização em todas plataformas |

## Sources

- Supabase RLS docs (oficial): https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL Row Security Policies (oficial, v18 current): https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase database testing + pgTAP: https://supabase.com/docs/guides/database/testing
- Supabase Postgres roles (service role, authenticator, authenticated): https://supabase.com/docs/guides/database/postgres/roles
- Supabase JWTs e semântica de claims/expiração: https://supabase.com/docs/guides/auth/jwts
- Contexto do projeto Broto: `.planning/PROJECT.md`

---
*Pitfalls research for: validação e alinhamento multi-tenant no Broto*
*Researched: 2026-04-03*
