# Broto EdTech — Codebase Consolidation

## What This Is

Broto is an EdTech platform for ENEM exam preparation, with a mobile app (React Native/Expo), web app (React/Vite), admin dashboard, and Supabase backend with AI-powered study features via Google NotebookLM. This milestone focuses on consolidating the codebase — eliminating duplication, fixing critical bugs, standardizing patterns, and establishing a healthy foundation for future feature development.

## Core Value

A maintainable, consistent monorepo where business logic lives in one place (`packages/shared`), bugs are fixed once, and developers can work across apps without friction.

## Requirements

### Validated

- ✓ Multi-platform student app (mobile + web) for ENEM preparation — existing
- ✓ Admin dashboard for teachers to manage classes, students, materials — existing
- ✓ Supabase auth with email/password login — existing
- ✓ Question bank with area/topic filtering and search — existing
- ✓ AI chat assistant via Google NotebookLM integration — existing
- ✓ Daily missions system for study gamification — existing
- ✓ Student progress tracking (areas, topics, accuracy) — existing
- ✓ Class enrollment and organization management — existing
- ✓ Cached data hooks pattern with `@broto/shared` createCachedStore — existing
- ✓ Turborepo monorepo with shared types package — existing

### Active

- [ ] Eliminate cross-app code duplication (~25% of codebase)
- [ ] Fix critical race conditions (cache store, 401 handler)
- [ ] Standardize code formatting and naming conventions across all apps
- [ ] Move shared business logic to `packages/shared`
- [ ] Add retry logic and proper error handling to API clients
- [ ] Remove dead code (.venv from git, optimize SVG assets, audit packages/ui)
- [ ] Close feature gaps (mobile missing performance tracking)
- [ ] Fix CORS to fail closed (reject non-whitelisted origins)
- [ ] Establish automated testing foundation

### Out of Scope

- New features (new screens, new capabilities) — this milestone is consolidation only
- Backend migration away from Supabase — too large, separate initiative
- Full service layer abstraction — incremental improvement, not rewrite
- Onboarding completion — separate feature milestone
- CI/CD pipeline setup — separate ops milestone

## Context

**Current state:** The codebase grew organically with mobile-first development, then web was added by copying and adapting mobile code. This created ~25% duplication. The `packages/shared` package exists but only contains ~30% of what should be shared.

**Critical bugs identified:**
1. Race condition in `packages/shared/src/hooks/create-cached-hook.ts` — `inflight` flag can allow duplicate requests
2. Race condition in `apps/mobile/lib/api-client.ts` — boolean `handlingUnauthorized` flag is not atomic
3. Silent error swallowing in ClassContext, daily-missions, broto-chat

**Health grades:** Duplication: D, Consistency: D, Tests: F, Fragility: D, Coupling: C-, Architecture: C

**Codebase map:** Full analysis available in `.planning/codebase/` (7 documents + CRITICAL-ANALYSIS.md)

## Constraints

- **Tech stack**: Existing stack is fixed (React Native/Expo, React/Vite, Supabase, TypeScript) — no migrations
- **Incremental**: Changes must be backward-compatible; apps must keep working throughout
- **No feature regression**: All existing functionality must continue working after consolidation
- **Monorepo structure**: Keep Turborepo, apps/*, packages/* structure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Consolidate to `packages/shared` first | Reduces duplication before standardizing patterns | — Pending |
| Fix race conditions before refactoring | Critical bugs could mask other issues | — Pending |
| Standardize on web conventions (camelCase, single quotes, no semicolons) | Web/admin already consistent, mobile is the outlier | — Pending |
| Keep `createCachedHook` per-app (React isolation) | Intentional pattern to avoid dual-React issues in monorepo | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after initialization*
