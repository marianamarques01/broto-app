# Requirements: Broto EdTech — Codebase Consolidation

**Defined:** 2026-04-02
**Core Value:** A maintainable, consistent monorepo where business logic lives in one place, bugs are fixed once, and developers can work across apps without friction.

## v1 Requirements

### Dead Code & Repo Hygiene

- [ ] **HYGN-01**: Python .venv directory removed from git tracking and added to .gitignore
- [ ] **HYGN-02**: SVG assets optimized with SVGO (1MB -> ~30KB) and root duplicates removed
- [ ] **HYGN-03**: `packages/ui` audited — removed if unused, documented if used
- [ ] **HYGN-04**: Unnecessary re-export files (`lib/types/questions.ts`) eliminated — apps import directly from `@broto/shared`

### Tooling & Standards

- [ ] **TOOL-01**: Root `tsconfig.base.json` created and extended by all apps/packages
- [ ] **TOOL-02**: Shared Prettier config enforced across all apps (single quotes, no semicolons, consistent trailing commas)
- [ ] **TOOL-03**: Prettier format glob includes mobile source directories (`app/`, `hooks/`, `lib/`, `components/`)
- [ ] **TOOL-04**: Formatting applied as atomic commit with hash added to `.git-blame-ignore-revs`
- [ ] **TOOL-05**: ESLint `no-restricted-imports` rule prevents `packages/shared` from importing `react`
- [ ] **TOOL-06**: ESLint `no-floating-promises` rule enabled across all apps
- [ ] **TOOL-07**: Hook file naming standardized (camelCase across all apps)

### Critical Bug Fixes

- [ ] **BUGF-01**: Race condition in `createCachedStore` fixed — `inflight` deduplication uses Promise-based lock instead of boolean flag
- [ ] **BUGF-02**: Race condition in mobile `api-client.ts` 401 handler fixed — uses Promise instead of boolean `handlingUnauthorized`
- [ ] **BUGF-03**: Silent error swallowing in `ClassContext.tsx` replaced with user-visible error state
- [ ] **BUGF-04**: Silent error swallowing in `daily-missions` catch blocks replaced with proper error propagation
- [ ] **BUGF-05**: `broto-chat.tsx` error handler captures non-ApiError details for debugging

### Security Hardening

- [ ] **SECR-01**: CORS in edge functions fails closed — rejects non-whitelisted origins instead of defaulting to `*`
- [ ] **SECR-02**: CORS logic extracted to shared utility used by all edge functions

### Code Consolidation — Zero-Dependency Moves

- [ ] **CONS-01**: `study-area-mock.ts` (383 lines) moved to `@broto/shared` — single source of truth
- [ ] **CONS-02**: `answer-question.ts` logic moved to `@broto/shared` with `bumpPerformanceDay()` for both apps (closes mobile feature gap)
- [ ] **CONS-03**: `area-config` data layer (colors, labels, slugs) moved to `@broto/shared` — icon bindings remain per-app
- [ ] **CONS-04**: Duplicated types (`UserProfile`, `DailyMissionsState`, `AreaKey`, `SubmitAnswerPayload`) moved to `@broto/shared`
- [ ] **CONS-05**: `useClass` hook core logic moved to shared (React-free store + per-app wrapper)

### Code Consolidation — Adapter Pattern

- [ ] **ADPT-01**: `IStorage` interface defined in `@broto/shared` with `get`, `set`, `remove` methods
- [ ] **ADPT-02**: `AsyncStorageAdapter` (mobile) and `LocalStorageAdapter` (web) implementations created per-app
- [ ] **ADPT-03**: `daily-missions` core logic moved to `@broto/shared` using `IStorage` adapter
- [ ] **ADPT-04**: Shared hook fetcher cores for `usePet`, `useProgress`, `useUser` extracted to `@broto/shared` (React-free stores with per-app hook wrappers)

### Error Resilience

- [ ] **RESL-01**: API clients (mobile + web) implement retry with exponential backoff for network errors
- [ ] **RESL-02**: `useQuestionsFilters` propagates errors visibly instead of returning empty arrays silently

### Testing Foundation

- [ ] **TEST-01**: Vitest configured for `packages/shared` with test script in package.json
- [ ] **TEST-02**: Unit tests for `createCachedStore` (including race condition regression test)
- [ ] **TEST-03**: Unit tests for `daily-missions` shared logic with mock storage adapter
- [ ] **TEST-04**: Unit tests for `answer-question` shared logic

## v2 Requirements

### Deep Consolidation

- **DEEP-01**: `useQuestionsFilters` core logic extracted to shared (highest complexity — deferred until patterns proven)
- **DEEP-02**: `ClassContext` query logic unified (acceptable duplication for now — ~50 lines per app)
- **DEEP-03**: `performance-history` logic moved to shared and adopted by mobile app
- **DEEP-04**: Full service layer abstraction for Supabase (separate initiative)

### Extended Testing

- **EXTT-01**: Jest configured for mobile app with React Native Testing Library
- **EXTT-02**: E2E test framework selected and configured (Detox or Maestro)
- **EXTT-03**: CI pipeline with automated test runs

### Onboarding

- **ONBR-01**: Onboarding flow completed (currently has TODO stubs)
- **ONBR-02**: Diagnostic quiz implemented post-onboarding

## Out of Scope

| Feature | Reason |
|---------|--------|
| Supabase migration to another backend | Too large, separate initiative — consolidation assumes Supabase stays |
| Full service layer abstraction | Incremental improvement only — full abstraction is v2 |
| New user-facing features | This milestone is consolidation only |
| CI/CD pipeline setup | Separate ops milestone |
| Onboarding completion | Separate feature milestone |
| `useQuestionsFilters` full extraction | Highest complexity item — deferred to v2 after patterns proven |
| React version alignment (18 vs 19) | Risk of breaking changes, separate effort |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HYGN-01 | — | Pending |
| HYGN-02 | — | Pending |
| HYGN-03 | — | Pending |
| HYGN-04 | — | Pending |
| TOOL-01 | — | Pending |
| TOOL-02 | — | Pending |
| TOOL-03 | — | Pending |
| TOOL-04 | — | Pending |
| TOOL-05 | — | Pending |
| TOOL-06 | — | Pending |
| TOOL-07 | — | Pending |
| BUGF-01 | — | Pending |
| BUGF-02 | — | Pending |
| BUGF-03 | — | Pending |
| BUGF-04 | — | Pending |
| BUGF-05 | — | Pending |
| SECR-01 | — | Pending |
| SECR-02 | — | Pending |
| CONS-01 | — | Pending |
| CONS-02 | — | Pending |
| CONS-03 | — | Pending |
| CONS-04 | — | Pending |
| CONS-05 | — | Pending |
| ADPT-01 | — | Pending |
| ADPT-02 | — | Pending |
| ADPT-03 | — | Pending |
| ADPT-04 | — | Pending |
| RESL-01 | — | Pending |
| RESL-02 | — | Pending |
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| TEST-03 | — | Pending |
| TEST-04 | — | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 0
- Unmapped: 33 (awaiting roadmap)

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after initial definition*
