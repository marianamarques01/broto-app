# Painel Rede — demo vs produção

## Arquitetura

| Camada | Real | Fixture (demo) |
|--------|------|----------------|
| Multi-tenant / RLS | ✅ `school_units` + `network_admin` | Mesma arquitetura |
| Dados de engajamento | Snapshots horários (`engagement_snapshots_org`) | Seed com `config.is_demo = true` |
| Nomes de alunos | **Nunca** expostos na API/UI de rede | Idem — só agregados |

A rota `/rede` exige role `network_admin` na org pai (rede). Coordenadores e professores são redirecionados para `/`.

## Índice de risco de abandono

Fórmula v1 (0–100), implementada em `packages/shared/src/engagement/compute-org-engagement-index.ts`:

```
abandonment_risk_index = (
  0.40 × (100 - active_7d_pct) +
  0.35 × (missing_count / total_students × 100) +
  0.25 × (streak_broken_count / total_students × 100)
)
```

Acima de **60** = alto risco (vermelho na UI).

## Seed de demo

```bash
supabase db query --linked -f supabase/scripts/seed-instituicoes-demo.sql
```

Conta gestor rede: `rede@demo` / `BrotoDemo2026!` — ver `docs/instituicoes-demo-contas.md` para todas as roles.

Se o login falhar após seed (auth criado via SQL incompleto):

```bash
supabase db query --linked -f supabase/scripts/fix-network-demo-auth.sql
```

UUIDs fixos no seed — ver cabeçalho do SQL.

## Smoke tests automatizáveis

### 1. Unitários (CI)

```bash
npm run test:shared          # build-network-engagement-view + assertNetworkViewHasNoStudentNames
npm run test:functions       # parseNetworkFilters + authz
```

### 2. Seletores E2E

Definidos em `smoke-selectors.ts`:

| Seletor | `data-testid` |
|---------|----------------|
| Painel | `network-dashboard` |
| Banner demo | `network-demo-banner` |
| Risco médio | `network-summary-risk` |
| Ativos médio | `network-summary-active` |
| Card escola | `network-school-card-{orgId}` |
| Filtro período | `network-filter-period` |
| Filtro regional | `network-filter-regional` |
| Filtro série | `network-filter-grade` |
| Estado vazio | `network-empty-state` |

### 3. Script de smoke (API + seed)

```bash
npm run smoke:network
```

Usa `rede@demo` / `BrotoDemo2026!` por padrão (override com `NETWORK_DEMO_PASSWORD`).

O script valida:

1. Login `network_admin` obtém JWT
2. `GET engagement-network-get` retorna 200
3. Payload não contém `nome`, `userId`, `atRiskAlerts`
4. Pelo menos 1 escola quando seed aplicado

### 4. Smoke manual (projetor)

1. Login `rede@demo` → `/rede`
2. Banner “Dados de demonstração” visível
3. 3 cards de escola com números grandes
4. Filtro regional “Norte” reduz lista
5. Login `coordenador@demo` → `/rede` redireciona para `/`
6. Resposta da API não contém nomes de aluno

## API

`GET engagement-network-get?networkOrgId=&regional=&grade=&periodDays=`

Auth: JWT + membership `network_admin` na org rede.
