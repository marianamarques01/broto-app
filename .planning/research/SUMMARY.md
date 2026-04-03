# Project Research Summary

**Project:** Broto EdTech — Codebase Consolidation
**Domain:** Turborepo monorepo — React Native (Expo) + React web + Supabase code sharing
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

Broto EdTech is a three-app Turborepo monorepo (mobile/Expo, web/Vite, admin/Vite) with a shared package (`@broto/shared`) that is currently ~30% utilized while ~25% of production code is duplicated between mobile and web. This is a codebase health initiative, not a product feature release. The research goal was to identify safe, incremental patterns for pulling duplicated logic up into `packages/shared` without breaking either app during the migration.

The recommended approach is a strict layered consolidation: start with zero-risk cleanups (dead code, formatting, ESLint guardrails), fix the two known race conditions before touching shared code, then move platform-agnostic logic to `packages/shared` using an adapter pattern for storage-touching modules. The key architectural constraint that governs every decision is dual-React instance isolation: `packages/shared` must remain completely React-free. Each app keeps a thin hook wrapper that imports React from its own `node_modules`. This is not a problem to solve — it is the correct architecture and must be preserved.

The principal risks are (1) accidentally moving React-importing code into the shared package causing cryptic "invalid hook call" crashes, (2) silently dropped Promises when web callsites that currently call storage functions synchronously are not updated to `await` the async shared version, and (3) losing `git blame` history by mixing formatting and logic changes in the same commit. All three risks have straightforward mitigations documented in PITFALLS.md. With those guardrails in place, the consolidation work is low-risk and follows well-established patterns already demonstrated in the existing `api-client.ts` split.

## Key Findings

### Recommended Stack

The stack is fixed — this research is about using existing tools correctly, not selecting new ones. The most important finding is that `packages/shared` must stay source-first (no compilation step, `"main": "./src/index.ts"`), which is already correctly configured. No new packages should be added to the monorepo during consolidation. Turborepo's existing `"dependsOn": ["^build"]` pipeline already handles correct build ordering. The single actionable tooling addition is a root `tsconfig.base.json` to deduplicate `strict`, `skipLibCheck`, and other shared compiler options, and a `no-restricted-imports` ESLint rule on `packages/shared/src/**` to automatically catch any React or platform import that would break the dual-React boundary.

**Core technologies:**
- Turborepo 2.8.17: build orchestration — keep as-is, no upgrade needed
- TypeScript 5.4: type system — add root `tsconfig.base.json` to remove per-app duplication
- ESLint 9 flat config: linting — add `no-restricted-imports` rule scoped to `packages/shared` to enforce platform-agnostic boundary
- Vitest 2.x: unit testing for `packages/shared` — zero-config for the Vite toolchain, replaces nothing (currently no tests exist)
- Source-first package exports: no `dist/` in shared packages — already correct, do not change

### Expected Features

This milestone has no product features — its "features" are codebase capabilities. The research distinguishes three tiers of consolidation work.

**Must have (table stakes — consolidation not done without these):**
- Dead code removed from git (`.venv` 3,305 files, ~55 MB; re-export shims) — zero regression risk, unambiguous improvement
- Root Prettier + ESLint config enforced across all apps — prevents new inconsistency from accumulating
- Race conditions fixed (`createCachedStore.refresh()` inflight window; `api-client` 401 boolean flag) — stops known bugs from masking other issues
- Silent error catches replaced with observable errors — surfaces hidden failures for debugging
- Identical duplicates moved to `packages/shared` (`study-area-mock`, `useClass` query logic, `answer-question`, area config data layer) — highest-value, lowest-risk moves
- CORS fail-closed on edge functions — one-line security fix

**Should have (logic consolidation — after P1 is stable):**
- Platform adapter pattern (`IStorage` interface) enabling `daily-missions` unification
- Shared hook cores for `usePet`, `useProgress`, `useUser` (95% identical, only `useFocusEffect` differs)
- Hardcoded taxonomy constants extracted to `packages/shared/src/constants/`
- Retry logic with exponential backoff in shared API layer
- Vitest unit tests for each shared domain module

**Defer to v2+:**
- `useQuestionsFilters` shared core (highest complexity, 500+ lines, depends on adapter pattern being stable)
- Edge function shared middleware pattern
- Service layer / repository pattern
- Any product feature work (onboarding completion, new screens)

### Architecture Approach

The target structure adds a `domains/` subdirectory inside `packages/shared/src/` organized by business domain rather than layer. This hybrid organization — existing `types/`, `api/`, `utils/`, `stores/` by layer, new `domains/missions/`, `domains/area-config/`, `domains/answer-question/` by business domain — is the right pattern as business logic scales up in the shared package. Migration follows an expand-contract sequence: add the shared version first (nothing breaks), wire adapters per app, verify each app still works, then delete the old per-app files. This ensures both apps remain working throughout.

**Major components:**
1. `packages/shared` — zero-dep, platform-agnostic types, API utilities, domain business logic, `createCachedStore` factory; new `domains/` subdirectory for moved logic
2. Per-app hook wrappers (`createCachedHook`, `usePet`, `useUser`, etc.) — React-aware, thin wrappers over `@broto/shared` stores; stay in each app permanently due to dual-React constraint
3. Per-app storage adapters (`apps/mobile/adapters/storage.ts`, `apps/web/adapters/storage.ts`) — implement `IStorage` interface; bridge `AsyncStorage` and `localStorage` to the shared storage interface
4. Supabase edge functions — remain independent; auth and CORS fixes are internal to each function; `_shared/` helper pattern for reducing boilerplate

### Critical Pitfalls

1. **Dual-React instance crash** — Never import `react`, `react-dom`, `react-native`, or any `expo-*` package inside `packages/shared`. Add the `no-restricted-imports` ESLint rule to `packages/shared/src/**` before any code moves. If a hook calls `useState` or `useEffect`, it stays in the app or is split into a React-free store + per-app wrapper.

2. **Async/sync mismatch silently drops Promises** — The shared `daily-missions` core must use a fully async interface (AsyncStorage is async; localStorage wraps in `Promise.resolve()`). Enable `@typescript-eslint/no-floating-promises` in ESLint before migrating `daily-missions` call sites — TypeScript will not catch unawaited `Promise<void>` without this rule.

3. **Race condition fix re-introduces the bug** — In `createCachedStore.refresh()`, remove `inflight = null` from the `refresh()` body. Do not null `inflight` outside of `fetchData()`'s `finally` block. The fix is surgical: one line deleted, not a refactor. Similarly, replace the `handlingUnauthorized` boolean flag in `api-client.ts` with a Promise lock that is never reset to null after handling (to prevent re-entry from queued inflight 401s).

4. **Formatting commit destroys `git blame`** — Run `prettier --write` as a single isolated commit with zero logic changes, immediately followed by adding that commit hash to `.git-blame-ignore-revs`. Fix the format script glob first — it currently targets `apps/*/src/**` and misses `apps/mobile/app/`, `apps/mobile/hooks/`, and `apps/mobile/lib/`.

5. **Circular dependency when moving `useQuestionsFilters`** — This hook imports `useClass` which imports `ClassContext` which imports the Supabase client. Moving the full hook to shared pulls in app-specific dependencies. Move only the pure async functions (`fetchAreas`, `fetchTopics`, `searchQuestions`, etc.) to shared; keep the hook in each app where it can call `useClass()` locally.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Tooling Baseline and Dead Code Removal
**Rationale:** Every subsequent phase is cleaner and safer with consistent formatting, automated import guardrails, and the `.venv` bloat gone. This phase costs nothing to ship and has zero regression risk. It also establishes the ESLint boundary that prevents future violations.
**Delivers:** Clean git history starting point, enforced platform-agnostic boundary on `packages/shared`, consistent code style across all apps, CORS security fix
**Addresses:** Dead code removal, root Prettier/ESLint enforcement, CORS fail-closed, root `tsconfig.base.json`
**Avoids:** Pitfall 4 (git blame destruction) — format commit is isolated here; Pitfall 1 (dual-React) — ESLint guardrail added before any code moves

### Phase 2: Race Condition and Error Propagation Fixes
**Rationale:** Race conditions in `createCachedStore` and the 401 handler are currently masking other bugs. Fixing them before moving code to shared ensures the shared code is correct from the start. These fixes are surgical — one file each — and must not be bundled with logic moves.
**Delivers:** Correct request deduplication in all cached stores, single-execution 401 handler, observable errors replacing silent `.catch(() => {})` calls
**Addresses:** `createCachedStore.refresh()` inflight window, `api-client` boolean flag, silent error swallowing in `ClassContext`/`daily-missions`/`broto-chat`
**Avoids:** Pitfall 2 (race fix re-introducing the bug) — fix is one deleted line, not a refactor; Pitfall 8 (401 infinite signout loop)

### Phase 3: Zero-Dependency Code Consolidation
**Rationale:** These are the safest moves — no adapters, no React, no platform APIs. They deliver immediate value (one source of truth for types and mock data) and validate the expand-contract migration pattern before tackling the harder adapter-based moves.
**Delivers:** Single source for `study-area-mock` (383 lines deduplicated), `UserProfile` and question types in `@broto/shared`, area config data layer without icon imports, `useClass` query logic as a shared async function
**Addresses:** Type drift risk (`UserProfile` in two hooks), study area mock duplication, area config duplication (~60% of each file)
**Avoids:** Pitfall 5 (UserProfile type shadowing) — local definitions deleted after shared import wired; Pitfall 6 (circular dependency) — only pure functions move, not the React hook wrappers

### Phase 4: Adapter Pattern and Storage-Touching Logic
**Rationale:** The `IStorage` adapter interface unlocks consolidation of all storage-touching business logic. This is one medium-complexity phase rather than spreading adapter work across multiple phases. Completing it unblocks `daily-missions` and later the hook cores.
**Delivers:** `IStorage` interface in `packages/shared/src/domains/missions/`, per-app storage adapters, unified `daily-missions` core, `answer-question` shared orchestrator (type alignment + shared submit logic)
**Uses:** Adapter pattern from ARCHITECTURE.md Pattern 1; `IStorage` interface (always async)
**Avoids:** Pitfall 3 (async/sync mismatch) — `no-floating-promises` rule enabled at start of this phase; Pitfall 7 (leaky adapter abstraction) — always-async interface, web adapter wraps in `Promise.resolve()`

### Phase 5: Shared Hook Cores and Test Coverage
**Rationale:** By this phase, the shared package contains stable, tested business logic. Hook cores (`usePet`, `useProgress`, `useUser`) are 95% identical and their only platform difference (`useFocusEffect` on mobile) is a thin wrapper concern. Vitest tests on shared code should be written alongside the hook core extraction since there are no tests today.
**Delivers:** Shared fetcher functions for pet/progress/user data, per-app hook wrappers reduced to platform-specific additions only, Vitest unit tests for all `domains/` modules
**Addresses:** 95% hook duplication, zero test coverage (grade F → baseline coverage on shared code)
**Avoids:** Pitfall 1 (dual-React) — hook wrappers stay per-app; only React-free fetcher logic moves to shared

### Phase 6: Complex Consolidation (useQuestionsFilters)
**Rationale:** This is the highest-complexity, highest-risk consolidation target (500+ lines, 3-tier URL resolution on mobile vs 1-tier on web, circular dependency risk via `useClass`). It is deferred until adapter and hook patterns are proven and `packages/shared` has test coverage to catch regressions.
**Delivers:** Shared `searchQuestions`, `fetchAreas`, `fetchTopics`, `fetchQuestionDetail` pure functions; per-app hook wrappers retain `useClass()` dependency; mobile error handling and web parallelism unified in shared core
**Avoids:** Pitfall 6 (circular dependency) — only pure async functions move, the hook stays per-app; Pitfall 11 (module-level cache hot reload) — document restart requirement, add `clearCache()` export for HMR

### Phase Ordering Rationale

- **Tooling before logic moves**: The ESLint `no-restricted-imports` rule on `packages/shared` must exist before any code moves there — it is the automated safety net. Without it, a well-intentioned PR can silently break the platform-agnostic boundary.
- **Race fixes before new shared code**: Moving bug-containing code to shared spreads bugs to both apps simultaneously. Fix first, move second.
- **Zero-dep before adapter-dep**: Establish the expand-contract migration pattern with the simplest cases first. The pattern is identical for all moves; learning it on low-risk files reduces errors on the harder adapter-based moves.
- **Adapter before hook cores**: The `IStorage` interface must exist and be stable before the hook cores are extracted, because `usePet`/`useUser`/`useProgress` all interact with the same cached store pattern that `daily-missions` uses.
- **Tests alongside Phase 5**: Vitest should not be added to an actively restructuring codebase (churn). Phase 5 is the first phase where shared code is stable enough for tests to have lasting value.
- **`useQuestionsFilters` last**: It has the most architectural divergence between apps, the highest line count, and the circular dependency risk. Every preceding phase builds the skills and patterns needed to do it safely.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Adapter Pattern):** The `answer-question` orchestrator factory pattern (ARCHITECTURE.md Pattern 5) involves injected dependencies and is marked MEDIUM confidence. Validate the exact injection shape against both app's `submitAnswer` call sites before committing to the interface.
- **Phase 6 (useQuestionsFilters):** The 3-tier URL resolution in mobile vs 1-tier in web is an architectural divergence not fully mapped. Needs a dedicated pre-phase analysis of the two implementations to define the shared core boundary.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Tooling):** ESLint flat config `files` scoping and `tsconfig.base.json` are HIGH-confidence patterns with direct codebase verification.
- **Phase 2 (Race Conditions):** The fix is one line (`inflight = null` removal). The correct pattern (Promise-based lock with generation check) is already present in the file — it just has one incorrect line.
- **Phase 3 (Zero-dep consolidation):** Pure file moves with no platform API dependencies. Standard TypeScript module extraction.
- **Phase 5 (Hook cores + Vitest):** Vitest setup for a Vite-based repo is zero-config; hook core extraction follows the same expand-contract pattern established in Phase 3.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection; all recommendations are constraints from existing versions, not choices |
| Features | HIGH | Derived from CRITICAL-ANALYSIS.md with direct code evidence; anti-features have concrete codebase rationale |
| Architecture | HIGH | All patterns verified against actual files; dual-React and adapter patterns are directly observable |
| Pitfalls | HIGH | All 8 moderate/critical pitfalls cite specific file paths and line numbers in the codebase |

**Overall confidence:** HIGH

### Gaps to Address

- **Vitest integration in Turborepo pipeline**: Vitest is the correct choice (MEDIUM confidence) but `turbo.json` task configuration for a `test` task in `packages/shared` was not verified against live Turborepo 2.x docs. Validate the pipeline config when adding Vitest in Phase 5.
- **`packages/ui` dependency in `apps/web/package.json`**: The package is declared as a dependency but no source imports are visible. This could be an unused declaration (safe to remove) or a type-only dependency that greps miss. Must be investigated before any dead code removal phase work touches `packages/ui`.
- **`bumpPerformanceDay` mobile gap**: Mobile's `submitAnswer` does not call `bumpPerformanceDay` (web-only). Whether this is an intentional product decision or an unimplemented feature gap needs clarification before Phase 4 consolidates `answer-question`. Copying web's call without understanding the intent could introduce incorrect behavior on mobile.
- **Complexity estimate for `useQuestionsFilters`**: The 3-tier vs 1-tier URL resolution architectural difference is noted but not fully mapped. A dedicated code reading session is needed before Phase 6 planning to define the exact shared/per-app boundary.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `packages/shared/src/`, `apps/mobile/`, `apps/web/`, `apps/admin/`, `turbo.json`, `eslint.config.mjs`, all `tsconfig.json` files — all architectural findings
- `.planning/codebase/CRITICAL-ANALYSIS.md` — duplication inventory, health grades, dead code catalog
- `.planning/codebase/ARCHITECTURE.md` — component boundaries, CachedStore pattern documentation
- `.planning/PROJECT.md` — scope constraints, key decisions, out-of-scope list

### Secondary (MEDIUM confidence)
- Turborepo 2.x documentation (training data, August 2025 cutoff) — workspace source-first package pattern, `^build` topological sort
- React documentation on hook rules (training data) — dual-React instance isolation rationale
- React Native / Expo documentation (training data) — AsyncStorage adapter pattern, platform file extension constraints

### Tertiary (LOW confidence / needs live verification)
- Vitest 2.x + Turborepo integration (training data) — `test` task configuration in `turbo.json` for `packages/shared`

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
