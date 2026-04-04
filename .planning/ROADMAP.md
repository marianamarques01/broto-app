# Roadmap: Broto EdTech — Codebase Consolidation

## Overview

Starting from a codebase with ~25% duplication, critical race conditions, and zero test coverage, this milestone transforms the Broto monorepo into a maintainable foundation. The work moves in one direction: establish guardrails first, fix bugs second, move logic third, verify with tests last. Each phase leaves the codebase in a working, shippable state.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Tooling, Hygiene & Security** - Establish guardrails, kill dead code, fix CORS, format everything
- [ ] **Phase 2: Bug Fixes & Error Propagation** - Fix known race conditions and replace silent error swallowing
- [ ] **Phase 3: Code Consolidation** - Move all shared logic to `packages/shared` using zero-dep and adapter patterns
- [ ] **Phase 4: Tests & Resilience** - Add retry logic, propagate filter errors visibly, and cover shared modules with unit tests

## Phase Details

### Phase 1: Tooling, Hygiene & Security
**Goal**: The repo is clean, consistent, and guarded against future violations before any logic moves
**Depends on**: Nothing (first phase)
**Requirements**: HYGN-01, HYGN-02, HYGN-03, HYGN-04, TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, SECR-01, SECR-02
**Success Criteria** (what must be TRUE):
  1. `git ls-files | grep .venv` returns nothing — Python environment is fully untracked
  2. Running `prettier --check` across all apps exits 0 — all source files conform to the shared config, and the format commit hash is recorded in `.git-blame-ignore-revs`
  3. Importing `react` inside any file under `packages/shared/src/` triggers an ESLint error at lint time
  4. All Supabase edge functions reject requests from non-whitelisted origins with a 403 — no `Access-Control-Allow-Origin: *` defaults remain
  5. `packages/ui` has either been removed from the monorepo (if unused) or has a comment in its `package.json` explaining its purpose
**Plans**: 9 plans

Plans:
- [x] 01-01-PLAN.md — Git hygiene: untrack .venv, optimize SVGs, remove packages/ui (HYGN-01, HYGN-02, HYGN-03)
- [x] 01-02-PLAN.md — TypeScript config baseline: create root tsconfig.base.json and extends (TOOL-01)
- [x] 01-09-PLAN.md — Dead code: remove question type re-export wrappers and update imports (HYGN-04)
- [x] 01-03-PLAN.md — Tooling config: fix Prettier glob, add ESLint guards (TOOL-02, TOOL-03, TOOL-05, TOOL-06)
- [x] 01-04-PLAN.md — Atomic formatting commit only (TOOL-04)
- [x] 01-05-PLAN.md — CORS extraction and hardening in edge functions (SECR-01, SECR-02)
- [ ] 01-06-PLAN.md — Gap closure HYGN-02: aggressive SVG optimization with byte-budget validation
- [ ] 01-07-PLAN.md — Register formatting SHA in .git-blame-ignore-revs (TOOL-04)
- [ ] 01-08-PLAN.md — Rename mobile hooks to camelCase in isolated commit (TOOL-07)

### Phase 2: Bug Fixes & Error Propagation
**Goal**: Known bugs are fixed and all previously silent errors are observable before any code moves to shared
**Depends on**: Phase 1
**Requirements**: BUGF-01, BUGF-02, BUGF-03, BUGF-04, BUGF-05
**Success Criteria** (what must be TRUE):
  1. Rapid successive calls to `createCachedStore.refresh()` produce exactly one in-flight network request — the Promise-based lock prevents duplicates
  2. Triggering a 401 response while multiple requests are in-flight causes exactly one token refresh and sign-out, never an infinite loop
  3. A class-fetch failure in `ClassContext` surfaces a visible error state in the UI instead of silently returning empty data
  4. A failure in `daily-missions` fetch or update causes the error to propagate up to the caller instead of being swallowed in a catch block
**Plans**: TBD

### Phase 3: Code Consolidation
**Goal**: All duplicated business logic lives in `packages/shared` with zero React or platform imports — both apps import from one source of truth
**Depends on**: Phase 2
**Requirements**: CONS-01, CONS-02, CONS-03, CONS-04, CONS-05, ADPT-01, ADPT-02, ADPT-03, ADPT-04, RESL-01, RESL-02
**Success Criteria** (what must be TRUE):
  1. `study-area-mock`, `UserProfile`, `DailyMissionsState`, `AreaKey`, `SubmitAnswerPayload`, and area config data all resolve from `@broto/shared` in both apps — no local duplicate definitions remain
  2. Mobile app gains `bumpPerformanceDay()` behavior on answer submission — the same shared `answer-question` module drives both apps
  3. `IStorage` interface exists in `packages/shared` and both apps provide working adapter implementations — `daily-missions` logic runs identically on mobile (AsyncStorage) and web (localStorage)
  4. Shared fetcher cores for `usePet`, `useProgress`, and `useUser` exist in `packages/shared` with no React imports — each app wraps them in thin hook files
  5. API clients (mobile + web) retry transient network errors with exponential backoff before surfacing failures to callers
**Plans**: TBD

### Phase 4: Tests & Resilience
**Goal**: The shared package has a test suite that catches regressions and `useQuestionsFilters` errors are visible to users
**Depends on**: Phase 3
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. `pnpm test` (or `turbo run test`) in `packages/shared` runs Vitest and exits 0 with a passing test suite
  2. The `createCachedStore` race condition is covered by a regression test that would have caught the original bug
  3. `daily-missions` shared logic is covered by unit tests that use a mock `IStorage` adapter — no real storage or network calls
  4. `answer-question` shared logic is covered by unit tests exercising both the happy path and error cases
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Tooling, Hygiene & Security | 0/5 | In progress | - |
| 2. Bug Fixes & Error Propagation | 0/? | Not started | - |
| 3. Code Consolidation | 0/? | Not started | - |
| 4. Tests & Resilience | 0/? | Not started | - |
