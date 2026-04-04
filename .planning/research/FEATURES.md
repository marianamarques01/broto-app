# Feature Research

**Domain:** Milestone de validacao e alinhamento de arquitetura multi-tenant (app ja existente)
**Researched:** 2026-04-03
**Confidence:** HIGH para RLS/isolation e testes de autorizacao (fontes oficiais); MEDIUM para padrao de execucao de milestone (sintese de pratica de mercado)

## Feature Landscape

### Table Stakes (Users Expect These)

Capacidades minimas para um milestone de validacao multi-tenant ser considerado confiavel.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Matriz de autorizacao por cadeia (`membership -> class -> organization`) | Sem matriz explicita, as regras reais ficam implicitas e inconsistentes entre endpoints e clientes. | MEDIUM | Dependencia: modelo conceitual atual em `.planning/PROJECT.md` e mapeamento de entidades no Supabase. Entrega: tabela de permissoes por acao/recurso. |
| Suite de validacao de RLS por tabela critica | Em arquitetura shared-schema, isolamento no banco e baseline de seguranca; sem isso, risco de vazamento cross-tenant. | HIGH | Dependencia: politicas RLS ativas nas tabelas de negocio e usuarios de teste em tenants distintos. Deve cobrir SELECT/INSERT/UPDATE/DELETE. |
| Testes de acesso cruzado (negativos) por perfil | Milestone de alinhamento precisa provar que bypass nao funciona (IDOR, troca de IDs, escalacao). | HIGH | Dependencia: massa de dados multi-tenant e roteiros de ataque controlados (OWASP WSTG authorization + multi-tenant cheat sheet). |
| Evidencia de alinhamento modelo vs implementacao | Em sistemas legados, divergencia entre "como deveria ser" e "como esta" e comum; sem gap map nao ha alinhamento real. | MEDIUM | Dependencia: diagrama/contrato conceitual + leitura de policies, queries e guards atuais em mobile/web/admin/backend. |
| Checklist de consistencia cross-platform (mobile/web/admin) | Regras de permissao precisam ser iguais em todas as superficies; se divergem, isolamento fica fragil. | MEDIUM | Dependencia: inventario de pontos de decisao de permissao nos 3 clientes + APIs/Edge Functions. |
| Criterio de aprovacao/falha por risco | Validacao sem gate objetivo vira "analise sem decisao"; precisa de threshold de bloqueio. | LOW | Dependencia: classificacao de riscos (critico/alto/medio/baixo) e owners para remediacao. |

### Differentiators (Competitive Advantage)

Nao obrigatorios, mas aumentam qualidade, repetibilidade e velocidade em futuros milestones de seguranca/alinhamento.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Harness automatizado de cenarios de tenancy (regressao) | Transforma validacao manual em suite repetivel por release, reduzindo regressao silenciosa. | HIGH | Dependencia: fixtures de tenants, usuarios e memberships; pipeline de execucao (local + CI). |
| "Policy coverage map" (acao -> endpoint -> policy -> teste) | Rastreabilidade ponta a ponta: mostra rapidamente onde ha regra sem teste ou teste sem regra. | MEDIUM | Dependencia: matriz de autorizacao base + inventario de endpoints/queries. |
| Teste de paridade de regra entre plataformas | Detecta diferenca de comportamento entre mobile/web/admin para mesma acao e mesmo usuario. | MEDIUM | Dependencia: definicao unica de cenarios (golden cases) e executor por plataforma. |
| Scorecard de isolamento por tenant boundary | Facilita decisao de roadmap: onde investir primeiro com base em risco residual objetivo. | LOW | Dependencia: evidencias dos testes negativos + severidade OWASP-like. |
| Guardrails para novas features (template de permissao) | Evita drift futuro exigindo "regra + policy + teste" no nascimento de cada feature. | LOW | Dependencia: padrao de PR/checklist e dono tecnico do dominio de acesso. |

### Anti-Features (Commonly Requested, Often Problematic)

Escopos que parecem bons, mas atrapalham milestone de validacao/alinhamento.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Reescrever arquitetura multi-tenant durante a validacao | "Ja que vamos validar, vamos corrigir tudo agora." | Mistura auditoria com rework estrutural, aumenta risco e impede concluir diagnostico confiavel. | Primeiro fechar gap map + riscos priorizados; depois fase dedicada de remediation. |
| Migrar modelo de isolamento (ex.: shared schema -> schema/database por tenant) no mesmo milestone | Parece "solucao definitiva" para isolamento. | Alto impacto operacional e de dados; invalida baseline de comparacao e estoura escopo. | Validar stack atual (Supabase + RLS) e abrir estudo de viabilidade separado. |
| Criar camada de autorizacao totalmente nova no frontend antes de validar regras atuais | Busca padronizacao imediata entre apps. | Pode mascarar falhas existentes e introduzir regressao cross-platform no meio da auditoria. | Mapear regra atual, medir divergencia, depois padronizar incrementalmente. |
| Expandir para features de produto fora do tema (onboarding, UX, novas telas) | Pressao para "aproveitar a janela". | Dilui foco de risco de seguranca/isolamento e reduz profundidade dos testes criticos. | Manter estrito em permissao, isolamento, acesso cruzado e alinhamento modelo-implementacao. |

## Feature Dependencies

```
[Matriz de autorizacao por cadeia]
    └──requires──> [Inventario de recursos e acoes]
    └──enables──> [Policy coverage map]

[Validacao RLS por tabela]
    └──requires──> [Policies ativas + tenants de teste]
    └──enables──> [Scorecard de isolamento]

[Testes de acesso cruzado (negativos)]
    └──requires──> [Massa de dados multi-tenant]
    └──requires──> [Matriz de autorizacao por cadeia]
    └──enables──> [Criterio de aprovacao/falha]

[Alinhamento modelo vs implementacao]
    └──requires──> [Modelo conceitual explicito]
    └──requires──> [Levantamento de regras em mobile/web/admin/backend]
    └──enables──> [Plano de remediation priorizado]

[Consistencia cross-platform]
    └──requires──> [Golden cases de autorizacao]
    └──requires──> [Executor por plataforma]
```

### Dependency Notes

- **A matriz de autorizacao e o primeiro desbloqueio:** sem ela, os testes negativos viram exploracao ad-hoc.
- **Validacao de RLS depende de dados multi-tenant reais:** sem tenants diferentes, nao existe prova de isolamento.
- **Consistencia cross-platform depende de cenarios unicos:** o mesmo caso precisa rodar em mobile/web/admin para detectar drift.
- **Alinhamento modelo-implementacao precisa de duas visoes:** modelo desejado e comportamento atual instrumentado.

## MVP Definition

### Launch With (v1)

Minimo viavel para validar e alinhar arquitetura multi-tenant existente:

- [ ] Matriz de autorizacao por cadeia completa (`membership -> class -> organization`)
- [ ] Validacao de RLS para tabelas criticas com evidencias por operacao (CRUD)
- [ ] Testes de acesso cruzado negativos para perfis-chave (aluno, admin, membro de outra org)
- [ ] Relatorio de gaps modelo vs implementacao com severidade e impacto
- [ ] Checklist de consistencia cross-platform para regras de permissao/isolamento
- [ ] Gate de aprovacao com criterios objetivos (bloqueia release quando risco critico aberto)

### Add After Validation (v1.x)

- [ ] Harness automatizado de regressao multi-tenant
- [ ] Policy coverage map integrado ao fluxo de review
- [ ] Scorecard de isolamento por dominio funcional

### Future Consideration (v2+)

- [ ] Guardrails obrigatorios para novas features (regra + policy + teste)
- [ ] Programa continuo de auditoria de autorizacao por trimestre

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Matriz de autorizacao por cadeia | HIGH | MEDIUM | P1 |
| Validacao RLS por tabela critica | HIGH | HIGH | P1 |
| Testes de acesso cruzado negativos | HIGH | HIGH | P1 |
| Gap map modelo vs implementacao | HIGH | MEDIUM | P1 |
| Checklist cross-platform de regras | HIGH | MEDIUM | P1 |
| Gate de aprovacao/falha | HIGH | LOW | P1 |
| Harness automatizado de regressao | HIGH | HIGH | P2 |
| Policy coverage map | MEDIUM | MEDIUM | P2 |
| Scorecard de isolamento | MEDIUM | LOW | P2 |
| Guardrails para novas features | MEDIUM | LOW | P3 |

**Priority key:**
- P1: obrigatorio para considerar o milestone validado
- P2: acelera manutencao e reduz regressao no curto prazo
- P3: governanca continua apos alinhamento inicial

## Sources

- Projeto interno: `/Users/marianamsamp/enem-mobile/.planning/PROJECT.md`
- Supabase docs (RLS em Postgres): [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security) (HIGH)
- OWASP Multi-Tenant Security Cheat Sheet: [cheatsheetseries.owasp.org/.../Multi_Tenant_Security_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html) (HIGH)
- OWASP WSTG Authorization Testing: [owasp.org/.../05-Authorization_Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/) (HIGH)
- Pesquisa de ecossistema (sintese de mercado, validar com contexto do repositorio): resultados web de 2026 para "multi-tenant validation checklist" e "Supabase RLS best practices" (MEDIUM)

---
*Feature research for: validacao e alinhamento de arquitetura multi-tenant no Broto*
*Researched: 2026-04-03*
