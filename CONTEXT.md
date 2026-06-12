# CONTEXT.md — Índice mestre do projeto Broto

Leia este arquivo **antes** de qualquer tarefa de código, refactor ou deploy.

---

## O que é o Broto

Plataforma EdTech de preparação para o ENEM com:
- **Web (aluno)** — `apps/web/` — produto principal
- **Admin (professor)** — `apps/admin/` — turmas, materiais, indicadores
- **Shared** — `packages/shared/` — lógica de negócio platform-agnostic
- **Backend** — `supabase/` — PostgreSQL, Auth, 19 Edge Functions (Deno)

**Decisão atual (2026-06):** foco em web + admin + shared. Mobile nativo (`apps/mobile/`) está planejado para remoção — ver `.planning/PRODUCTION-ROADMAP.md` etapa 1.3.

---

## Estrutura do monorepo

```
broto/
├── apps/
│   ├── web/          # React 18 + Vite — aluno
│   └── admin/        # React 18 + Vite — professor
├── packages/
│   └── shared/       # Tipos, hooks core, API helpers, mock-exam, missions
├── supabase/
│   ├── functions/    # Edge Functions Deno
│   ├── migrations/   # SQL (23+ migrations, multi-tenant RLS)
│   └── services/     # NotebookLM (Python)
├── docs/             # Documentação de produto e multi-tenant
└── .planning/        # Roadmaps GSD e produção
```

**Workspaces:** npm + Turborepo. Comandos na raiz:

```bash
npm run dev          # todos os apps
npm run build        # build de produção
npm run typecheck    # TypeScript strict
npm run test:shared  # Vitest em packages/shared
npm run lint         # ESLint
```

**Gates de CI (rodar localmente antes do PR):** `npm run lint && npm run typecheck && npm run test:shared && npm run build` — o workflow `.github/workflows/ci.yml` executa os mesmos jobs em paralelo.

---

## Regras obrigatórias (sempre checar)

| Arquivo | Quando ler |
|---------|------------|
| `.cursor/rules/00-contexto-projeto.mdc` | Toda sessão |
| `.cursor/rules/01-arquitetura-monorepo.mdc` | Mudanças em apps/ ou packages/ |
| `.cursor/rules/02-seguranca.mdc` | Auth, API, RLS, input, HTML |
| `.cursor/rules/03-qualidade-codigo.mdc` | Qualquer código novo ou refactor |
| `.cursor/rules/04-producao.mdc` | Deploy, env, CI/CD |
| `.cursor/rules/05-supabase-functions.mdc` | Edge functions |

---

## Documentação de domínio

| Documento | Conteúdo |
|-----------|----------|
| `docs/multi-tenant/multi-tenant-ground-truth.md` | Modelo de organizações e memberships |
| `docs/multi-tenant/multi-tenant-permissions-matrix.md` | Quem pode o quê |
| `docs/multi-tenant/multi-tenant-implementation-pr-checklist.md` | Checklist RLS/CORS |
| `docs/broto-f3-web-aluno.md` | Features do web aluno |
| `docs/broto-f2-admin.md` | Features do admin |
| `docs/db.md` | Schema e tabelas |
| `.planning/PRODUCTION-ROADMAP.md` | **Plano para produção com prompts** |
| `.planning/NEXT-REFACTOR-PLAN.md` | Histórico de consolidação v1.1 |

---

## Pontos de entrada no código

| Área | Arquivo chave |
|------|---------------|
| Auth web | `apps/web/src/contexts/AuthContext.tsx` |
| Auth admin | `apps/admin/src/contexts/AdminAuthContext.tsx` |
| API client web | `apps/web/src/lib/api-client.ts` |
| Shared exports | `packages/shared/src/index.ts` |
| Authz backend | `supabase/functions/_shared/authz.ts` |
| CORS backend | `supabase/functions/_shared/cors.ts` |
| RLS migrations | `supabase/migrations/20260410120000_pr08_rls_membership_core.sql` |

---

## Gates de qualidade (rodar antes de PR)

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:shared   # ou npm run test quando web tiver testes
npm run build
```

**Estado conhecido (2026-06-11):**
- `test:shared` — 19 testes, verde
- `typecheck` — admin quebrado (`router.tsx:72`) até etapa 1.2 do roadmap
- CI — inexistente até etapa 1.1

---

## O que NÃO fazer

1. **Não** colocar lógica de UI ou React em `packages/shared`
2. **Não** criar imports entre `apps/web` e `apps/admin`
3. **Não** usar `service_role` em edge functions sem validar authz antes
4. **Não** aceitar CORS de origens não listadas em produção
5. **Não** renderizar HTML de questões sem DOMPurify (web)
6. **Não** commitar `.env`, `dist/`, ou secrets
7. **Não** recomeçar o projeto do zero — backend e shared têm valor

---

## Roadmap ativo

Seguir `.planning/PRODUCTION-ROADMAP.md` fase por fase:

1. **Fundação** — CI, fix admin, remover mobile, higiene
2. **Qualidade** — quebrar arquivos grandes, testes, consolidar shared
3. **Produção** — deploy web/admin/functions, RLS staging, Sentry
4. **Features** — só após fases 1–3
