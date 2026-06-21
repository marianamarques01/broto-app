# Broto EdTech — Consolidação do monorepo

**Última atualização:** 2026-06-19  
**Status de execução:** `.planning/STATE.md`

## What This Is

Broto is an EdTech platform for ENEM exam preparation, with a web app (React/Vite) for students, an admin dashboard for teachers, and a Supabase backend with AI-powered study features via Google NotebookLM. The native mobile app was removed in 2026-06; active work is web + admin + shared + supabase hardening toward production.

## Core Value

A maintainable, consistent monorepo where business logic lives in one place (`packages/shared`), backend auth/types are explicit, and CI gates prevent regressions.

## Requirements

### Validated

- ✓ Web student app for ENEM preparation
- ✓ Admin dashboard (classes, students, materials)
- ✓ Supabase auth (email/password)
- ✓ Question bank with area/topic filtering (`filters-core` in shared)
- ✓ AI chat via NotebookLM (`broto-chat`)
- ✓ Daily missions + progress tracking
- ✓ Class enrollment and multi-tenant RLS (PR-08)
- ✓ CI pipeline (lint, typecheck, test:shared, build)
- ✓ Typecheck verde (web + admin)
- ✓ Edge functions com `_shared/authz.ts` + `_shared/cors.ts`
- ✓ `database.types.ts` gerado via Supabase CLI (linked)

### Active

- [ ] Testes Deno nas edge functions (`authz`, validação)
- [ ] Testes Vitest no web (api-client, hooks críticos)
- [ ] Deploy produção (web, admin, functions) — Fase 3 do roadmap
- [ ] RLS validado em staging
- [ ] Observabilidade (Sentry)
- [ ] Higiene repo (`.venv`, assets grandes — ver CONCERNS)
- [ ] Extrair CSS monolítico (`app.css` ~23k linhas)
- [ ] Reconciliar drift schema prod ↔ migrations (`user_question_answers`)

### Out of Scope (este milestone)

- Reescrever backend fora do Supabase
- Novas features de produto grandes (landing B2B, etc.) sem gate de qualidade
- `apps/mobile` — removido

## Context

**Current state (2026-06-19):** Fase 1 do roadmap em grande parte concluída (CI, typecheck, mobile removido). Fase 2 parcial (StudyArea refatorado, shared filters). Passes P6/P7 entregaram type safety no Supabase. Próximo: Passe 8 ou Fase 2.3 (testes edge).

**Gates:** `npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run build` — verdes.

**Planning docs:** `.planning/STATE.md` é a fonte de verdade; `.planning/codebase/*` é snapshot de abril/2026 (arquivado).

## Constraints

- **Tech stack** fixo: React/Vite, Supabase, TypeScript
- **Incremental** — apps funcionando a cada passo
- **Diff mínimo** em passes de engenharia (P6–P8)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remover mobile | Web é produto principal | ✅ 2026-06 |
| `requireUser()` centralizado | Fail closed, menos boilerplate | ✅ P7 |
| `area_key` versionado em `topic_performance` | Missões diárias sem fallback silencioso | ✅ P7 + migration remota |
| Tipos via `gen types --linked` | Sem Docker local | ✅ P7 |
| `legacyUnauthorizedMessage` | Preservar 401 "Unauthorized" em endpoints legados | ✅ P7 |

---
*Atualizar este arquivo em marcos de fase; detalhe operacional em STATE.md.*
