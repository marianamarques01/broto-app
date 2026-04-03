# Feature Research — Monorepo Consolidation

**Domain:** Codebase health initiative — React/RN Turborepo monorepo consolidation
**Researched:** 2026-04-02
**Confidence:** HIGH for structural patterns (well-established); MEDIUM for specific tooling choices (training data, no live verification)

---

## Context

This research maps the feature landscape for a **consolidation milestone**, not a product feature milestone. "Features" here are capabilities the **codebase itself** should have: what makes a monorepo healthy, what makes it painful to work in, and what is a distraction during a consolidation sprint.

The project is a Turborepo with 3 apps (mobile/Expo, web/Vite, admin/Vite) + `packages/shared` + Supabase backend. The shared package is ~30% utilized; ~25% of code is duplicated between mobile and web.

---

## Feature Landscape

### Table Stakes (Codebase Must Have These to Be Healthy)

Missing any of these means the consolidation goal is not met and the codebase remains in a fragile state.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Shared types in one place** | Types duplicated between apps diverge silently over time, causing runtime bugs. Every multi-app monorepo needs a single type source. | LOW | Already partially done. Expand to cover `study-area-mock`, `useQuestionsFilters` filter types, and remove re-export shims (`apps/*/lib/types/questions.ts`). |
| **Shared pure business logic in `packages/shared`** | Logic like `answer-question`, `daily-missions` core, `useClass` query, `ClassContext` query logic exist in 2+ copies. A bug fix in one app leaves the other broken. | MEDIUM | ~500 lines can be moved. Requires platform-agnostic design (no `AsyncStorage`, no `window`). |
| **Platform adapter pattern for storage** | `daily-missions` uses `AsyncStorage` on mobile and `localStorage` on web — same concept, different APIs. Without an adapter, shared code is impossible for storage-touching logic. | MEDIUM | Define `StorageAdapter` interface in shared; inject at app startup. Small surface area. |
| **Single Prettier + ESLint config at root** | Inconsistent formatting (double vs single quotes, semicolons) creates noisy diffs and cognitive overhead when switching between apps. | LOW | Root `eslint.config.mjs` and root `prettier` already exist as devDependencies. Needs config file that mobile opts into. |
| **Consistent file naming convention** | Mobile uses `kebab-case` for hooks, web uses `camelCase`. Ambiguity creates friction and potential build errors on case-sensitive filesystems (CI Linux vs dev macOS). | LOW | Decision is already made in PROJECT.md: standardize on web conventions (camelCase). |
| **Atomic concurrency guards (no boolean flags)** | The `inflight` flag in `create-cached-hook.ts` and `handlingUnauthorized` boolean in `api-client.ts` are known race conditions. They cause duplicate requests and double sign-outs. | MEDIUM | Replace boolean flags with `Promise` locks. Pattern: `let inflight: Promise<T> | null = null`. |
| **Error propagation (no silent `.catch(() => {})`)** | `ClassContext`, `daily-missions`, and `broto-chat` swallow errors. Developers can't debug, users see blank UI. | LOW | Surfaces bugs immediately. Replace silent catches with at minimum `console.error` + re-throw or structured error state. |
| **Dead code removed from git** | `.venv` (3,305 files, ~55 MB) and large binary assets bloat clone time, slow CI, and obscure real changes in PRs. | LOW | `git rm -r --cached supabase/services/notebooklm/.venv` + `.gitignore` entry. One-time fix. |
| **Named exports as default pattern** | Mobile uses `export default function`, web uses named exports. Inconsistent imports complicate refactoring and tree-shaking. | LOW | Standardize on named exports. Aligns with web/admin which are already consistent. |
| **CORS fail-closed** | Current: if `ALLOWED_ORIGINS` env var is empty, CORS accepts any origin. This is a security misconfiguration, not an optimization. | LOW | One-line fix: default to rejecting unknown origins, never `*`. |

### Differentiators (Developer Velocity Gains)

These are not required for a healthy codebase, but they pay dividends in long-term developer speed and confidence. They are appropriate targets for phases 2–3 of consolidation, after the table stakes are stable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Shared hook cores with platform-specific wrappers** | `usePet`, `useProgress`, `useUser` are 95% identical between mobile and web. A shared core + thin platform wrapper eliminates the "bug in mobile, not in web" problem class. | MEDIUM | Pattern: `packages/shared/src/hooks/use-pet.core.ts` (pure logic) + `apps/mobile/hooks/usePet.ts` (adds `useFocusEffect`) + `apps/web/src/hooks/usePet.ts` (adds `refreshIfStale`). |
| **Shared `useQuestionsFilters` core** | Largest duplication at 500+ lines. Mobile has better error messages; web has better parallelism. A shared core could have both. | HIGH | High complexity because of architectural differences (3-tier URL resolution vs 1-tier). Don't attempt until simpler hooks are moved first. Dependency: platform adapter pattern. |
| **Retry logic with exponential backoff** | Currently: one failure = broken UX. Retry handles transient network issues transparently. Critical for mobile (unreliable connections). | MEDIUM | Implement once in `packages/shared/src/api/retry.ts`, used by both app API clients. Pattern is well-understood; `p-retry` or hand-rolled are both fine. |
| **Automated tests for `packages/shared`** | Zero tests currently (grade: F). Tests on shared code have the highest leverage — they protect logic used by all 3 apps. | MEDIUM | Vitest is the natural choice (already using Vite toolchain on web/admin). Target: unit tests for `createCachedHook`, `generateClassCode`, `answer-question`, `daily-missions` core. |
| **Hardcoded taxonomy extracted to constants** | `IDIOMAS_TOPIC_ID = '__idiomas'` and 20+ topic mappings in edge functions are scattered magic strings. A single `packages/shared/src/constants/taxonomy.ts` makes them discoverable and testable. | LOW | High value for low cost. Dependency: nothing. Can be done independently. |
| **`packages/ui` audited and either used or removed** | The package exists, is referenced by `@broto/web`, but no real components are imported from it. Dead package = confusion about where components should live. | LOW | Audit imports; if empty, delete. If partially used, document what it contains and its intended scope. |
| **`import type` enforced consistently** | TypeScript `import type` reduces bundle sizes and clarifies intent. Currently inconsistent in mobile. | LOW | ESLint rule `@typescript-eslint/consistent-type-imports` enforces this automatically once a shared config exists. Free after ESLint consolidation. |
| **Edge function CORS + auth middleware** | All edge functions repeat the same CORS and auth check boilerplate. A shared middleware reduces copy-paste and ensures security changes propagate everywhere. | MEDIUM | Deno doesn't have npm middleware, but a shared `_shared/` directory with helper functions works well in Supabase edge functions. |

### Anti-Features (Things to Deliberately NOT Do During Consolidation)

These seem like good ideas during a consolidation sprint, but each one expands scope, introduces regression risk, or creates the wrong kind of coupling.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full Supabase abstraction layer / repository pattern** | Supabase is coupled everywhere; abstracting it seems like the right fix. | This is a rewrite, not a refactor. Touching every data call in all 3 apps + edge functions while also moving logic risks massive regression. The benefit (backend swappability) is not a current requirement. | Incrementally extract the query logic into hook/service functions. Don't introduce interfaces/repositories yet. |
| **New shared UI component library** | `packages/ui` exists; building shared components seems natural. | Mobile and web use entirely different rendering systems (React Native views vs DOM). True shared UI is impossible without a compatibility layer (React Native Web), which is a separate initiative. | Style tokens / design constants can be shared. Components cannot. Keep platform-specific UI in each app. |
| **Migrate mobile to React 19** | Web is on React 19.1.0, mobile is also on 19.1.0 — they look aligned, but Expo's React Native compatibility matrix is the constraint, not the version number. | Expo SDK 54 has specific React/React Native version requirements. Changing this during consolidation is an unforced error that can break native builds. | Leave React version decisions to Expo upgrade cycles. |
| **Service layer / full architecture refactor** | Business logic is in components; a service layer is the correct long-term pattern. | Introducing a new architectural layer (`Component → Hook → Service → Repository`) during consolidation means touching every component in every app. This is scope expansion that delays the actual consolidation work. | Move logic to `packages/shared` first. The service layer can emerge naturally in a subsequent milestone once shared logic exists. |
| **Onboarding completion** | TODOs exist in onboarding files; "cleanup" feels like it includes fixing them. | Onboarding is a product feature (new user flow), not a code health issue. Completing it adds untested product scope to a consolidation milestone. | Explicitly out of scope. File a separate feature milestone for onboarding. |
| **Switching from Supabase SDK to raw fetch in shared** | Reducing dependency on `@supabase/supabase-js` in shared feels like decoupling. | The SDK is already a dependency in all apps; avoiding it in shared creates inconsistency. Shared code that needs auth should receive a Supabase client via injection, not avoid it entirely. | Inject the Supabase client into shared services rather than importing it directly. |
| **`createCachedHook` merged into shared** | The pattern is duplicated between mobile and web; DRY instinct says consolidate. | React hooks must use the React instance of the consuming app. Sharing a hook implementation across apps that use different React instances causes the "invalid hook call" error. This is the documented reason it's intentionally kept per-app. | Keep `createCachedHook` in each app. Share only the *type definitions* and the `createCachedStore` primitive from shared (already correct). |

---

## Feature Dependencies

```
[Shared Prettier/ESLint config]
    └──enables──> [Consistent naming convention migration]
                      └──enables──> [Shared hook cores with wrappers]

[Platform adapter pattern (StorageAdapter)]
    └──requires──> [Shared daily-missions core]
    └──requires──> [Shared useQuestionsFilters core] (later)

[Atomic concurrency guards]
    └──enables──> [Shared hook cores with wrappers]  (safe to share once fixed)

[Error propagation fixed]
    └──enables──> [Automated tests for packages/shared]  (tests need observable errors)

[Dead code removed]
    └──enables──> [Accurate dependency audit]

[Shared types fully populated]
    └──enables──> [Shared pure business logic]
                      └──enables──> [Shared hook cores with wrappers]
```

### Dependency Notes

- **Shared config requires nothing upstream:** It's the first unlock. Everything downstream benefits from it.
- **Platform adapter requires shared types:** The `StorageAdapter` interface is a type; types must be stable before adapters are defined.
- **Tests require stable shared logic:** Writing tests against code that is actively being restructured creates churn. Tests belong after each consolidation unit stabilizes, not before.
- **`useQuestionsFilters` consolidation requires adapter pattern:** The storage and URL differences make this impossible without adapters. It's the last hook to move, not the first.
- **`createCachedHook` must NOT be consolidated:** React instance isolation is the constraint. This is a hard dependency on the per-app architecture decision.

---

## MVP Definition

For this milestone, "MVP" means the **minimum set of consolidation work that delivers a materially healthier codebase** without partial states that create new confusion.

### Launch With (v1 — Core Consolidation)

- [ ] Dead code removed (`.venv`, large binary assets, re-export shims) — unambiguous improvement with zero regression risk
- [ ] Root Prettier + ESLint config enforced across all apps — prevents new inconsistency from accumulating
- [ ] Race conditions fixed (`create-cached-hook.ts`, `api-client.ts` 401 handler) — stops known bugs from masking other issues
- [ ] Silent error catches replaced with observable errors — surfaces hidden failures
- [ ] Identical duplicates moved to `packages/shared` (`study-area-mock`, `useClass`, `answer-question`) — highest-value, lowest-risk moves
- [ ] CORS fail-closed — security correctness, one-line fix

### Add After Core Is Stable (v1.x — Logic Consolidation)

- [ ] Platform adapter pattern (`StorageAdapter`) — enables the next layer
- [ ] `daily-missions` unified with adapter — once adapter exists, this is straightforward
- [ ] `usePet`, `useProgress`, `useUser` shared cores — high-value once patterns are stable
- [ ] Hardcoded taxonomy extracted to constants — independent, low-risk
- [ ] Retry logic in shared — after API clients are consistent

### Future Consideration (v2+ — Architecture Improvement)

- [ ] Automated tests for `packages/shared` — correct target, but writing tests during active restructuring creates churn
- [ ] `useQuestionsFilters` shared core — highest complexity, highest risk, defer until simpler hooks are proven
- [ ] Edge function middleware pattern — correct improvement, but Supabase edge functions are not the consolidation bottleneck
- [ ] Service layer / repository pattern — separate architectural milestone

---

## Feature Prioritization Matrix

| Feature | Dev Value | Implementation Cost | Priority |
|---------|-----------|---------------------|----------|
| Remove `.venv` from git | HIGH | LOW | P1 |
| Root Prettier/ESLint config | HIGH | LOW | P1 |
| Fix race conditions (cache + 401) | HIGH | MEDIUM | P1 |
| Fix silent error catches | HIGH | LOW | P1 |
| Move identical duplicates to shared | HIGH | LOW | P1 |
| CORS fail-closed | MEDIUM | LOW | P1 |
| Platform adapter (StorageAdapter) | HIGH | MEDIUM | P2 |
| Unified `daily-missions` | HIGH | MEDIUM | P2 |
| Shared hook cores (`usePet`, etc.) | HIGH | MEDIUM | P2 |
| Taxonomy constants extracted | MEDIUM | LOW | P2 |
| Retry logic in shared | MEDIUM | MEDIUM | P2 |
| Automated tests for shared | HIGH | MEDIUM | P2 |
| `packages/ui` audited/removed | LOW | LOW | P2 |
| `useQuestionsFilters` shared core | HIGH | HIGH | P3 |
| Edge function middleware | MEDIUM | MEDIUM | P3 |
| Service layer / repository pattern | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for consolidation milestone to be considered done
- P2: High value, add once P1 work is stable
- P3: Correct direction, separate milestone

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes identification | HIGH | Derived directly from CRITICAL-ANALYSIS.md with established patterns |
| Platform adapter pattern | HIGH | Well-documented pattern in RN monorepos; AsyncStorage/localStorage adapter is standard |
| React instance isolation (`createCachedHook`) | HIGH | Documented React constraint; violating it produces known "invalid hook call" error |
| Testing tool recommendation (Vitest) | MEDIUM | Strong fit given Vite toolchain; could not verify against live Turborepo docs |
| Complexity estimates | MEDIUM | Based on codebase analysis; actual effort may vary based on hidden coupling |
| Anti-features list | HIGH | Each anti-feature has a concrete rationale grounded in the codebase's constraints |

---

## Sources

- `/Users/marianamsamp/enem-mobile/.planning/codebase/CRITICAL-ANALYSIS.md` — primary source for current duplication, fragility, and inconsistency data
- `/Users/marianamsamp/enem-mobile/.planning/PROJECT.md` — scope constraints, out-of-scope decisions, key decisions log
- Turborepo documentation (training data, August 2025 cutoff) — workspace structure, task pipeline patterns
- React documentation on hook rules (training data) — React instance isolation rationale for `createCachedHook`
- React Native / Expo documentation on platform differences (training data) — AsyncStorage vs localStorage adapter pattern

---

*Feature research for: Broto EdTech — Codebase Consolidation milestone*
*Researched: 2026-04-02*
