# Requirements: Broto EdTech — Codebase Consolidation

**Defined:** 2026-04-02
**Core Value:** A maintainable, consistent monorepo where business logic lives in one place, bugs are fixed once, and developers can work across apps without friction.

## v1 Requirements

### Dead Code & Repo Hygiene

- [x] **HYGN-01**: Python .venv directory removed from git tracking and added to .gitignore
- [x] **HYGN-02**: SVG assets optimized with SVGO (1MB -> ~30KB) and root duplicates removed
- [x] **HYGN-03**: `packages/ui` audited — removed if unused, documented if used
- [x] **HYGN-04**: Unnecessary re-export files (`lib/types/questions.ts`) eliminated — apps import directly from `@broto/shared`

### Tooling & Standards

- [x] **TOOL-01**: Root `tsconfig.base.json` created and extended by all apps/packages
- [x] **TOOL-02**: Shared Prettier config enforced across all apps (single quotes, no semicolons, consistent trailing commas)
- [x] **TOOL-03**: Prettier format glob includes mobile source directories (`app/`, `hooks/`, `lib/`, `components/`)
- [x] **TOOL-04**: Formatting applied as atomic commit with hash added to `.git-blame-ignore-revs`
- [x] **TOOL-05**: ESLint `no-restricted-imports` rule prevents `packages/shared` from importing `react`
- [ ] **TOOL-06**: ESLint `no-floating-promises` rule enabled across all apps — *regra activa em `eslint.config.mjs`; ainda há violações no código (ex. admin) — limpeza pendente*
- [x] **TOOL-07**: Hook file naming standardized (camelCase across all apps)

### Critical Bug Fixes

- [x] **BUGF-01**: Race condition in `createCachedStore` fixed — `inflight` deduplication uses Promise-based lock instead of boolean flag
- [x] **BUGF-02**: Race condition in mobile `api-client.ts` 401 handler fixed — uses Promise instead of boolean `handlingUnauthorized`
- [x] **BUGF-03**: Silent error swallowing in `ClassContext.tsx` replaced with user-visible error state
- [x] **BUGF-04**: Silent error swallowing in `daily-missions` catch blocks replaced with proper error propagation
- [ ] **BUGF-05**: `broto-chat.tsx` error handler captures non-ApiError details for debugging — *mensagem genérica para não-ApiError; sem log estruturado*

### Security Hardening

- [x] **SECR-01**: CORS in edge functions fails closed — rejects non-whitelisted origins instead of defaulting to `*`
- [x] **SECR-02**: CORS logic extracted to shared utility used by all edge functions

### Code Consolidation — Zero-Dependency Moves

- [x] **CONS-01**: `study-area-mock.ts` (383 lines) moved to `@broto/shared` — single source of truth
- [x] **CONS-02**: `answer-question.ts` logic moved to `@broto/shared` with `bumpPerformanceDay()` for both apps (closes mobile feature gap)
- [ ] **CONS-03**: `area-config` data layer (colors, labels, slugs) moved to `@broto/shared` — icon bindings remain per-app — *diferido: ver ROADMAP Phase 3 nota de excepção*
- [x] **CONS-04**: Duplicated types (`UserProfile`, `DailyMissionsState`, `AreaKey`, `SubmitAnswerPayload`) moved to `@broto/shared`
- [ ] **CONS-05**: `useClass` hook core logic moved to shared (React-free store + per-app wrapper) — *não entregue nesta onda*

### Code Consolidation — Adapter Pattern

- [x] **ADPT-01**: `IStorage` interface defined in `@broto/shared` with `getItem` / `setItem` / `removeItem` (async)
- [x] **ADPT-02**: `AsyncStorageAdapter` (mobile) and `LocalStorageAdapter` (web) implementations created per-app
- [x] **ADPT-03**: `daily-missions` core logic moved to `@broto/shared` using `IStorage` adapter
- [x] **ADPT-04**: Shared hook fetcher cores for `usePet`, `useProgress`, `useUser` extracted to `@broto/shared` (React-free stores with per-app hook wrappers)

### Error Resilience

- [x] **RESL-01**: API clients (mobile + web) implement retry with exponential backoff for network errors
- [x] **RESL-02**: `useQuestionsFilters` propagates errors visibly instead of returning empty arrays silently

### Testing Foundation

- [x] **TEST-01**: Vitest configured for `packages/shared` with test script in package.json
- [x] **TEST-02**: Unit tests for `createCachedStore` (including race condition regression test)
- [x] **TEST-03**: Unit tests for `daily-missions` shared logic with mock storage adapter
- [x] **TEST-04**: Unit tests for `answer-question` shared logic

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
| HYGN-01 | Phase 1 | Satisfied |
| HYGN-02 | Phase 1 | Satisfied |
| HYGN-03 | Phase 1 | Satisfied |
| HYGN-04 | Phase 1 | Satisfied |
| TOOL-01 | Phase 1 | Satisfied |
| TOOL-02 | Phase 1 | Satisfied |
| TOOL-03 | Phase 1 | Satisfied |
| TOOL-04 | Phase 1 | Satisfied |
| TOOL-05 | Phase 1 | Satisfied |
| TOOL-06 | Phase 1 | Open (violações remanescentes) |
| TOOL-07 | Phase 1 | Satisfied |
| SECR-01 | Phase 1 | Satisfied |
| SECR-02 | Phase 1 | Satisfied |
| BUGF-01 | Phase 2 | Satisfied |
| BUGF-02 | Phase 2 | Satisfied |
| BUGF-03 | Phase 2 | Satisfied |
| BUGF-04 | Phase 2 | Satisfied |
| BUGF-05 | Phase 2 | Open |
| CONS-01 | Phase 3 | Satisfied |
| CONS-02 | Phase 3 | Satisfied |
| CONS-03 | Phase 3 | Deferred |
| CONS-04 | Phase 3 | Satisfied |
| CONS-05 | Phase 3 | Open |
| ADPT-01 | Phase 3 | Satisfied |
| ADPT-02 | Phase 3 | Satisfied |
| ADPT-03 | Phase 3 | Satisfied |
| ADPT-04 | Phase 3 | Satisfied |
| RESL-01 | Phase 3 | Satisfied |
| RESL-02 | Phase 3 | Satisfied |
| TEST-01 | Phase 4 | Satisfied |
| TEST-02 | Phase 4 | Satisfied |
| TEST-03 | Phase 4 | Satisfied |
| TEST-04 | Phase 4 | Satisfied |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0
- Satisfied (2026-04-05): 28 — Open/Deferred: TOOL-06, BUGF-05, CONS-03, CONS-05 (ver lista acima)

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-05 — reconciliado com código (fases 2–4); itens Open/Deferred explícitos*
