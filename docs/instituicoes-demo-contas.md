# Contas demo — Módulo Instituições

**Senha única (todas):** `BrotoDemo2026!`

Aplicar / atualizar seeds:

```bash
supabase db query --linked -f supabase/scripts/seed-instituicoes-demo.sql
```

Se login falhar após seed:

```bash
supabase db query --linked -f supabase/scripts/fix-network-demo-auth.sql
```

---

## Credenciais por role

| Persona | E-mail | Role | Org | Rota admin | O que testar |
|---------|--------|------|-----|------------|--------------|
| Professor | `teacher@demo` | `teacher` | Escola Demo (EM Alpha) | `/classes/.../painel` | Lista engajamento, follow-up, drill-down |
| Coordenação | `coordenador@demo` | `org_admin` | Escola Demo (EM Alpha) | `/escola` | Ranking, alertas, PDF |
| Diretor / owner | `owner@demo` | `owner` | Escola Demo (EM Alpha) | `/escola` | Mesmo painel escola + permissões owner |
| Gestor de rede | `rede@demo` | `network_admin` | Rede Demo | `/rede` | Comparativo escolas, índice risco (agregados) |
| Administrador geral | `admin@demo` | `broto_admin` | Escola Demo (EM Alpha) | Todas (`/`, `/escola`, `/calibracao`, `/rede`, `/onboarding`) | Acesso unificado a todas as camadas do admin |

---

## Organizações fixture

| Nome | UUID | Tipo |
|------|------|------|
| Rede Demo | `b0e00000-0000-4000-8000-000000000100` | Org pai (rede) |
| EM Alpha | `b0e00000-0000-4000-8000-000000000110` | Escola demo (professor + coordenação) |
| EM Beta | `b0e00000-0000-4000-8000-000000000120` | Escola fixture rede |
| EM Gamma | `b0e00000-0000-4000-8000-000000000130` | Escola fixture rede |

Turma demo do professor: **3º A Demo** — código `DEMO3A`

---

## Smoke automatizado

```bash
NETWORK_DEMO_PASSWORD='BrotoDemo2026!' npm run smoke:network
```
