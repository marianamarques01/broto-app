# Domain Pitfalls — Monorepo Consolidation (React/RN + Turborepo + Supabase)

**Domain:** React / React Native Turborepo monorepo consolidation
**Researched:** 2026-04-02
**Confidence:** HIGH — all findings grounded in actual codebase evidence from `.planning/codebase/`

---

## Critical Pitfalls

Mistakes that cause rewrites, runtime crashes, or permanent data loss.

---

### Pitfall 1: Importing React Hooks from a Shared Package (Dual-React Instance)

**What goes wrong:**
If you move a hook that calls `useState`, `useEffect`, or any React hook into `packages/shared` and import it from both `apps/mobile` (React 19) and `apps/web` (React 18), you will get two separate React instances in the same process. React hooks validate they are called from the same React instance that renders the component. The result is a runtime error: "Invalid hook call. Hooks can only be called inside of the body of a function component."

**Why it happens:**
`packages/shared/package.json` currently exports source TypeScript directly (`"main": "./src/index.ts"`). There is no bundling step — each consuming app imports the raw source and its own bundler resolves the `react` import. Mobile resolves to React 19, web resolves to React 18. Two different instances.

**Evidence in this codebase:**
This exact problem was already recognized and the current architecture was designed to avoid it. Both `apps/mobile/hooks/create-cached-hook.ts` and `apps/web/src/hooks/createCachedHook.ts` are intentional thin wrappers that live in each app and call `useState`/`useEffect` from the local React. The comment in each file states: "Keeps React imports local to this app (avoids dual-React in monorepo)." The `createCachedStore` in `@broto/shared` is React-free for this reason.

**Consequences:**
- Cryptic "invalid hook call" crash at runtime, not caught by TypeScript
- Silent failure if the check is somehow bypassed — stale or disconnected state
- Very hard to diagnose because the stack trace points to the hook, not the import

**Prevention:**
- The pattern already established is correct and must be preserved: `@broto/shared` exports only React-free logic (stores, fetchers, types, utilities). Each app gets a thin hook wrapper that calls local React.
- When moving hooks to shared, strip all React imports first. If the hook needs `useState`/`useEffect`, it stays in the app or follows the store+wrapper pattern.
- Apply the test: does this file import from `react`? If yes, it cannot go into `packages/shared` as-is.

**Warning signs:**
- A PR that moves a file containing `import { useState } from 'react'` into `packages/shared`
- Seeing "invalid hook call" in runtime logs after a move
- The React version mismatch (`apps/mobile`: React 19, `apps/web`: React 18) is still active — this constraint is live, not resolved

**Phase:** Must be addressed as a constraint in every phase that touches `packages/shared`. Phase that fixes the React version mismatch (upgrading web/admin to React 19) can relax this constraint, but only after the upgrade is complete and tested.

---

### Pitfall 2: The `refresh()` Race Condition Introduces a New Bug While "Fixing" the Old One

**What goes wrong:**
The current `refresh()` implementation in `packages/shared/src/hooks/create-cached-hook.ts` (lines 62-68) sets `inflight = null` before calling `fetchData()`. If another component calls `fetchData()` concurrently in the same microtask tick, the `if (inflight) return inflight` guard in `fetchData()` will not fire because `inflight` is null at that instant. Two requests go out.

**Evidence in this codebase:**
```typescript
function refresh() {
  generation++
  cached = null
  inflight = null   // ← nulled here
  fetchedAt = 0
  fetchData()       // ← new inflight set here, but between these two lines another caller
                    //    could call fetchData() and see inflight === null
}
```
The generation counter prevents stale data from landing, but the deduplication guard does not work during the window between `inflight = null` and the synchronous assignment inside `fetchData()`. In JavaScript's single-threaded event loop, this window is safe within a single synchronous call stack — but `refreshPet()` and `refreshProgress()` are both called from `submitAnswer()` in `apps/mobile/lib/api/answer-question.ts`, and they share separate store instances, so the concern is per-store deduplication under concurrent focus events on mobile.

**The fix attempt risk:**
When fixing this to use a Promise-based lock (the correct approach), it is easy to introduce a new bug: if the lock is never released on error, all future fetches for that store will hang. The `finally` block in the current implementation (line 53-57) already handles generation-aware cleanup — replicating that logic incorrectly during a refactor is where bugs enter.

**Prevention:**
- Fix the race condition using a Promise-based lock where `inflight` holds the Promise itself (already partially done — `inflight: Promise<T | null> | null`). The fix is to NOT null `inflight` in `refresh()` before calling `fetchData()`. Instead, let `refresh()` increment generation and call `fetchData()`, which will reset `inflight` correctly after the current request completes.
- Write a test for the race condition before fixing it. The fix is small (remove `inflight = null` from `refresh()`), and a test is the only way to verify the timing behavior.
- Review the `finally` block carefully — it must only null `inflight` when `gen === generation` to avoid nulling a newer in-flight request.

**Warning signs:**
- After the fix, duplicate API calls still appearing in network logs during rapid navigation
- Store showing loading state permanently after a network error (lock never released)

**Phase:** Race condition fix phase. This is a surgical change to one file — do not refactor the surrounding code at the same time.

---

### Pitfall 3: Async/Sync API Mismatch When Unifying `daily-missions`

**What goes wrong:**
Mobile's `daily-missions.ts` is fully async (all functions return `Promise`). Web's is fully sync (localStorage is synchronous). If you create a unified version in `@broto/shared` using an adapter pattern, callers that currently do `incrementDailyAreaAnswer(...)` (web, fire-and-forget sync) will break if the shared version returns a Promise — they will silently drop the Promise without awaiting it.

**Evidence in this codebase:**
`apps/web/src/lib/answer-question.ts` line 17: `incrementDailyAreaAnswer({ areaKey, isCorrect })` — no `await`, no `.catch()`. This works now because the web version is synchronous. The mobile version (line 18 in `apps/mobile/lib/api/answer-question.ts`) does: `incrementDailyAreaAnswer(...).catch(() => {})` — it awaits via `.catch()`.

When you unify behind an async interface (the right choice since AsyncStorage is async), every web call site must add `await` or `.catch()`. Missing even one silently drops the state update.

**Consequences:**
- Daily mission counters not incrementing on web after the migration
- No error at all — the Promise is created and garbage collected
- TypeScript will NOT catch this — `Promise<void>` assigned to nothing is valid

**Prevention:**
- Make the shared version return `Promise<DailyMissionsState>` and enforce async at the call site
- Use `void` explicitly at call sites where fire-and-forget is intentional: `void incrementDailyAreaAnswer(...)`
- Enable `@typescript-eslint/no-floating-promises` in ESLint config — this rule catches unawaited Promises. The current root `eslint.config.mjs` does not have this rule.
- Audit all callers of `incrementDailyAreaAnswer` across both apps before merging

**Warning signs:**
- Web daily mission UI stops updating after an answer is submitted
- ESLint rule `no-floating-promises` absent from config before the migration

**Phase:** shared business logic consolidation phase. Add `no-floating-promises` to ESLint at the start of that phase, not after.

---

## Moderate Pitfalls

---

### Pitfall 4: Formatting Standardization Breaks Git Blame for the Entire File History

**What goes wrong:**
Running `prettier --write` across mobile source files (converting double quotes to single quotes, removing semicolons, adding trailing commas) rewrites every line in those files. `git blame` then shows the formatting commit as the author of every line. Bisecting a bug introduced before the formatting change becomes painful.

**Evidence in this codebase:**
Mobile uses double quotes and semicolons. Web uses single quotes and no semicolons. The root `.prettierrc` (single quotes, no semicolons) is already set, but the `format` script in root `package.json` targets `apps/*/src` — it would reformat mobile's entire source tree in one commit.

**Consequences:**
- `git blame` attribution lost for all mobile files
- `git bisect` becomes unreliable across the formatting boundary
- PRs touching formatting + logic changes are impossible to review

**Prevention:**
- Separate formatting commits from logic commits. One PR: only `prettier --write`, zero logic changes. The commit message should note "reformatting only — use `git blame --ignore-rev` to skip this commit."
- Add the formatting commit hash to `.git-blame-ignore-revs` immediately after merging
- Never mix formatting changes with code changes in the same PR, ever

**Warning signs:**
- A PR that changes both file formatting and logic
- `git blame` showing the same author/date for every line in a file after a merge

**Phase:** Formatting standardization phase. This phase should be one atomic commit that is immediately added to `.git-blame-ignore-revs`.

---

### Pitfall 5: Moving `UserProfile` Type to Shared Breaks the Existing Local Type Definition Silently

**What goes wrong:**
Both `apps/mobile/hooks/use-user.ts` and `apps/web/src/hooks/useUser.ts` define a local `UserProfile` interface inline. If you move this type to `@broto/shared` and the shared version has a different shape (even one extra optional field), TypeScript may not catch the mismatch at all — it will pass structural compatibility checks while the runtime object from the API has the old shape.

**Evidence in this codebase:**
Both files have identical `UserProfile` definitions with 7 fields: `id, nome, email, image, onboardingDone, dataEnem, horasDisponiveisPorDia`. Neither app re-exports from `@broto/shared` for this type — they define it locally. The `@broto/shared` types package already has `types/student.ts`, `types/class.ts`, etc. but does NOT have `UserProfile` — the type lives in two places and could drift.

**Consequences:**
- Fields that exist in one app's type but not the shared type cause compile errors only in the app that had the extra field
- The more dangerous direction: shared type adds a required field that the API doesn't return → runtime undefined access

**Prevention:**
- When moving the type, diff both app definitions first. They are currently identical.
- After moving to shared, delete the local definitions and import from `@broto/shared` — do not have both the import and the local definition active simultaneously (they will shadow each other or the local one will win)
- Verify the API actually returns all fields in the shared type by checking the `user-me` edge function response shape

**Warning signs:**
- A file that imports `UserProfile` from `@broto/shared` AND also has a local `interface UserProfile` in the same file
- TypeScript showing no errors after the move, but the API shape was never checked

**Phase:** Type consolidation phase (early, before hooks are moved).

---

### Pitfall 6: Circular Dependency When Moving Business Logic to Shared

**What goes wrong:**
If `packages/shared` imports from an app (or from a package that imports from an app), you get a circular dependency. Turborepo cannot build the graph. The error is typically a module resolution failure or an infinite loop during bundling, not a clear "circular dependency" error.

**Evidence in this codebase:**
`packages/shared/src/index.ts` currently exports from `./api/api-client`. The `api-client` in shared is React-free and app-agnostic. The risk appears when moving hooks: `use-user.ts` (mobile) imports `api` from `@/lib/api-client` — if that hook is moved to shared and brings the app-specific `api-client` import with it, shared would depend on app code.

The specific risk is `useQuestionsFilters` — it imports `useClass` from `@/hooks/use-class`, which imports `ClassContext` from `@/contexts/ClassContext`, which imports `supabase` from `@/lib/supabase/client`. Moving the full hook to shared would pull in the entire Supabase client dependency chain from the app.

**Consequences:**
- Turborepo build graph fails or produces incorrect build ordering
- Vite/Metro bundler enters resolution loop
- The symptom often looks like "cannot find module" rather than "circular dependency"

**Prevention:**
- When moving code to shared, check every import in the file. If any import path starts with `@/` (app-specific alias), that dependency cannot come along.
- Extract only the pure computation logic into shared. Keep the `useClass` dependency in the app-side wrapper.
- For `useQuestionsFilters`, the correct pattern is: move `searchQuestions`, `fetchAreas`, `fetchExams`, `fetchTopics`, `fetchQuestionDetail` (pure async functions) to shared, keep the hook in each app where it can call `useClass()` locally.
- Use Turborepo's `--graph` command to visualize dependency order before and after a move

**Warning signs:**
- A file in `packages/shared` containing an import like `import { supabase } from '@broto/mobile/...'` or any `@/` path
- Build errors that mention module resolution failures in `packages/shared` after a move

**Phase:** Shared business logic phase. Check imports before every move.

---

### Pitfall 7: Over-Abstracting the Adapter Pattern Creates a Leaky Abstraction

**What goes wrong:**
When creating a platform adapter (e.g., a `StorageAdapter` interface to abstract `AsyncStorage` vs `localStorage`), it is tempting to expose the full API of the underlying storage. The result is an interface so broad that it reveals which platform you are on — the web adapter has to fake async behavior that localStorage doesn't need, and mobile has to fake sync methods that AsyncStorage doesn't have. Code written against the abstraction ends up testing which platform it's on to call the right version, defeating the purpose.

**Evidence in this codebase:**
`daily-missions.ts` is a good candidate for this pitfall. The mobile version is async because `AsyncStorage.getItem()` is async. The web version is sync because `localStorage.getItem()` is sync. A naive adapter interface would be:

```typescript
interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
}
```

This union return type forces every call site to handle both cases — the abstraction leaked. The correct approach is: always async in the interface, web adapter wraps sync calls in `Promise.resolve()`.

**Consequences:**
- Call sites end up with platform-detection logic that the adapter was supposed to eliminate
- Type errors when the unified interface doesn't match what TypeScript expects at the call site
- Tests for the adapter are harder to write than tests for the original code

**Prevention:**
- Always pick the more constrained interface: if one platform is async, the adapter is async. The sync platform wraps in `Promise.resolve()`.
- Start with the minimum needed interface, not the full storage API. For `daily-missions`, the adapter needs exactly three methods: `getItem`, `setItem`, `removeItem`. Not the full `AsyncStorage` or `localStorage` interface.
- Write the tests for the adapter before writing the adapter.

**Warning signs:**
- An interface method that returns `T | Promise<T>` (union type on the return)
- An adapter that calls `typeof localStorage !== 'undefined'` — the platform check leaked into the implementation that was supposed to hide it

**Phase:** Adapter pattern phase (medium-term). Applies to `daily-missions` and potentially `api-client`.

---

### Pitfall 8: Fixing the 401 Race Condition Introduces a New Infinite Signout Loop

**What goes wrong:**
The current fix attempt in `apps/mobile/lib/api-client.ts` (lines 15-28) uses a boolean `handlingUnauthorized` flag. The correct fix is a Promise-based lock. However, if the lock is implemented incorrectly — specifically if `signOut()` itself triggers another 401 response that re-enters the handler — you get an infinite loop: sign out → 401 → sign out → 401.

**Evidence in this codebase:**
The current `handleUnauthorizedOnce()` resets the flag in `finally` (line 27: `handlingUnauthorized = false`). This means if two 401s arrive simultaneously, the first one sets the flag, starts the async signout, and the second one checks the flag synchronously — returns immediately. But after `finally` runs, the flag is reset to `false`. If a third 401 arrives after the signout (from an inflight request that was already queued), the handler fires again. The boolean approach is not sufficient for this reason.

**Prevention:**
- Replace the boolean with a `Promise | null` lock: `let handlingUnauthorized: Promise<void> | null = null`. If it is non-null, return the existing Promise (callers wait rather than being silently dropped). After the signout+navigation completes, set to `null`.
- Do NOT reset the flag to `false` after the operation. Once a 401 is handled, all subsequent 401s in that session should be ignored until auth state changes.
- Add a test that fires 3 concurrent 401 responses and verifies `signOut()` was called exactly once.

**Warning signs:**
- Multiple "redirecting to login" console logs on a single 401 event
- The `router.replace` called multiple times in rapid succession

**Phase:** Race condition fix phase, same PR as the `createCachedStore` race fix.

---

## Minor Pitfalls

---

### Pitfall 9: Prettier Config Exists but Mobile Files Were Never Formatted Against It

**What goes wrong:**
The root `.prettierrc` exists and specifies `singleQuote: true, semi: false`. The `format` script covers `apps/*/src`. However, mobile source files are in `apps/mobile/app/`, `apps/mobile/hooks/`, `apps/mobile/lib/`, `apps/mobile/components/` — paths that contain double quotes and semicolons today. Running `format` will not touch mobile files under `app/` or `hooks/` because the glob is `apps/*/src/**`.

**Evidence:** Root `package.json` format script: `"prettier --write \"apps/*/src/**/*.{ts,tsx}\""`. Mobile app uses `apps/mobile/app/` not `apps/mobile/src/`.

**Prevention:**
- Expand the format script glob to include `apps/mobile/app/**`, `apps/mobile/hooks/**`, `apps/mobile/lib/**`, `apps/mobile/components/**` before running the formatting migration.
- Alternatively, add a `src/` entry point directory in mobile that re-exports from subdirectories — but this is more work than fixing the glob.

**Warning signs:**
- Running `npm run format:check` reports zero violations on mobile files even though they have double quotes

**Phase:** Formatting standardization phase. Fix the glob before running format.

---

### Pitfall 10: Removing Dead Code (`packages/ui`) Before Verifying It Is Truly Unused

**What goes wrong:**
`packages/ui` has no visible imports in `apps/`. If deleted naively, and there is a runtime import that TypeScript resolved via a type-only path (e.g., a type from `@broto/ui` used only in `.d.ts` files), builds will silently fail on the type check step.

**Evidence:** `packages/ui/package.json` exists. CRITICAL-ANALYSIS.md section 6.3 notes it "nao aparece em nenhum import dos apps" but this was a grep of source files — not of generated type declarations.

**Prevention:**
- Run `grep -r "@broto/ui"` across all `apps/` and `packages/` before deleting
- Check `package.json` dependencies in each app for `"@broto/ui": "*"` — `apps/web/package.json` includes `"@broto/ui": "*"` in its dependencies (confirmed in web's package.json line 5)
- The web app depends on `@broto/ui` — investigate why before deleting

**Warning signs:**
- Web app's `package.json` lists `@broto/ui` as a dependency but no import appears in source files — this is suspicious, not conclusive

**Phase:** Dead code removal phase. Investigate before delete, not delete and see what breaks.

---

### Pitfall 11: Module-Level Cache Maps in `useQuestionsFilters` Survive Hot Reloads

**What goes wrong:**
Both versions of `useQuestionsFilters` declare module-level `Map` instances for caching (`topicMappingCache`, `examDetailsCache`). In development with Vite or Expo hot reload, these maps are not cleared when the module reloads. A developer who edits the questions data and expects to see the update will see stale cached data instead.

**Evidence:** `apps/mobile/hooks/use-questions-filters.ts` lines 78, 91. `apps/web/src/hooks/useQuestionsFilters.ts` lines 29, 41. Both files declare identical module-level Map caches.

**Consequences:** Confusing development experience. Questions not updating after data changes during development. Works correctly in production (clean page loads).

**Prevention:**
- This is acceptable for production. For development ergonomics, document that the dev server must be fully restarted (not just hot reloaded) to see questions data changes.
- When the shared version is extracted, add a `clearCache()` export that development tooling can call on HMR invalidation.

**Phase:** Minor concern, note during `useQuestionsFilters` consolidation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Fix race conditions | Race fix in `createCachedStore.refresh()` introduces loose `inflight` window | Remove `inflight = null` from `refresh()`, do NOT add separate nulling outside `fetchData()` |
| Fix 401 handler | Boolean flag reset in `finally` enables re-entry | Use Promise-based lock, do not reset after completion |
| Formatting standardization | Git blame destroyed for all mobile files | Isolate in single commit, add to `.git-blame-ignore-revs` |
| Formatting standardization | Prettier glob misses `apps/mobile/app/` and `apps/mobile/hooks/` | Expand glob before running |
| Move types to shared | Local `UserProfile` in two hooks will shadow the shared import | Delete local definitions, verify API shape matches |
| Move business logic to shared | Moving hooks that call `useState`/`useEffect` crashes at runtime | All React-importing code stays in apps; shared is React-free only |
| Move business logic to shared | `useQuestionsFilters` depends on `useClass` → `supabase` — circular if fully moved | Move pure functions only; keep hook in each app |
| Adapter pattern for `daily-missions` | Async/sync mismatch causes silent dropped Promises at call sites | Enable `no-floating-promises` ESLint rule before migration |
| Adapter pattern for `daily-missions` | Adapter leaks platform details via union return type | Always async interface; web wraps sync in `Promise.resolve()` |
| Remove dead code | `packages/ui` has a declared dep in `apps/web/package.json` — grep before delete | Investigate the dep, do not delete first |
| Close feature gaps (mobile perf tracking) | `bumpPerformanceDay` is called in web's `submitAnswer` but not in mobile's | Verify mobile gap is intentional before copying web logic |

---

## Sources

All findings are HIGH confidence — derived directly from code in this repository:

- `packages/shared/src/hooks/create-cached-hook.ts` — race condition analysis (lines 33-68)
- `apps/mobile/lib/api-client.ts` — 401 handler analysis (lines 15-28)
- `apps/mobile/hooks/create-cached-hook.ts` and `apps/web/src/hooks/createCachedHook.ts` — dual-React pattern evidence (comment in both files)
- `apps/mobile/lib/missions/daily-missions.ts` vs `apps/web/src/lib/daily-missions.ts` — async/sync interface mismatch
- `apps/mobile/lib/api/answer-question.ts` vs `apps/web/src/lib/answer-question.ts` — feature gap and adapter risk
- `apps/mobile/hooks/use-questions-filters.ts` vs `apps/web/src/hooks/useQuestionsFilters.ts` — circular dep risk
- `apps/mobile/hooks/use-user.ts` and `apps/web/src/hooks/useUser.ts` — duplicate type risk
- `package.json` (root) — format script glob mismatch evidence
- `.prettierrc` — config exists, mobile conventions diverge
- `apps/web/package.json` — `@broto/ui` dependency declared despite no visible source imports
- `.planning/codebase/CRITICAL-ANALYSIS.md` — health grades, duplication inventory
- `.planning/codebase/CONCERNS.md` — fragile areas, tech debt catalog
