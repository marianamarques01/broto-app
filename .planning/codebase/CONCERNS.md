# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

### [Critical] Python .venv committed to git (3,305 files, ~55 MB)

- Issue: The entire Python virtual environment for the NotebookLM service is tracked in git, including compiled `.pyc` files and `__pycache__` directories.
- Files: `supabase/services/notebooklm/.venv/` (3,305 tracked files), `supabase/services/notebooklm/__pycache__/`
- Impact: Massively bloats the repository, slows clones, and makes dependency management unreliable across environments. Binary `.pyc` files tied to Python 3.12 will not work on other versions.
- Fix approach: Add `.venv/` and `__pycache__/` to `.gitignore`, run `git rm -r --cached supabase/services/notebooklm/.venv supabase/services/notebooklm/__pycache__`, and rely on `requirements.txt` (already present) for reproducible installs. Use `git filter-branch` or `git-filter-repo` to remove from history if repo size is a concern.

### [Critical] Large binary assets committed to git (~8.7 MB)

- Issue: Multiple large image/SVG files are tracked at the repo root and in app directories. These are unoptimized AI-generated assets.
- Files:
  - `Edtech_Brand_Identity_In_a_minimalist_style_a_stylized_green_letter_CU-Juqi8.png` (4.7 MB)
  - `2.svg` (1.1 MB)
  - `new_logo.svg` (1.1 MB)
  - `new_logo_icon.svg` (740 KB)
  - `apps/web/public/new-logo.svg` (1.1 MB)
  - `apps/web/public/new-logo-icon.svg` (740 KB)
  - `apps/mobile/assets/new-logo-icon.svg` (740 KB)
  - `docs/pitch-tcc-broto-dark.pdf` (13 MB)
- Impact: Bloats repo size, slows clones. SVGs over 1 MB are almost certainly unoptimized (vector noise from AI generation). The root-level files appear to be duplicates or working copies of assets that also exist in app directories.
- Fix approach: Optimize SVGs with SVGO (should reduce 1 MB SVGs to ~10-50 KB). Remove root-level duplicates (`2.svg`, `new_logo.svg`, `new_logo_icon.svg`, the PNG). Move the PDF to an external location or use Git LFS.

### [High] Massive code duplication between mobile and web apps

- Issue: Large amounts of business logic, types, mock data, and UI logic are copy-pasted between `apps/mobile/` and `apps/web/`. The monorepo has `packages/shared` but it is underutilized.
- Files (identical or near-identical pairs):
  - `apps/mobile/lib/study-area-mock.ts` (383 lines) <-> `apps/web/src/lib/study-area-mock.ts` (383 lines) -- **byte-for-byte identical**
  - `apps/mobile/lib/types/questions.ts` <-> `apps/web/src/lib/types/questions.ts` -- **identical**
  - `apps/mobile/hooks/use-questions-filters.ts` (502 lines) <-> `apps/web/src/hooks/useQuestionsFilters.ts` (230 lines) -- same logic, divergent formatting/minor differences
  - `apps/mobile/lib/missions/daily-missions.ts` <-> `apps/web/src/lib/daily-missions.ts` -- same logic, minor platform differences (AsyncStorage vs localStorage)
  - `apps/mobile/lib/api/answer-question.ts` <-> `apps/web/src/lib/answer-question.ts` -- same logic
  - `apps/mobile/hooks/use-user.ts` / `UserProfile` type <-> `apps/web/src/hooks/useUser.ts` / `UserProfile` type -- duplicated type definition
  - `apps/mobile/hooks/create-cached-hook.ts` <-> `apps/web/src/hooks/createCachedHook.ts` -- both wrap `@broto/shared`'s `createCachedStore`
- Impact: Bug fixes must be applied in two places. Types drift over time. Increases maintenance burden significantly.
- Fix approach: Move shared types (`Question`, `UserProfile`, `PetData`, etc.), mock data, and platform-agnostic logic to `packages/shared`. Use the existing `@broto/shared` package which is already set up but only contains API client core, cached store, and a few types.

### [High] Onboarding data is never persisted

- Issue: The onboarding flow collects extensive user preferences (target university, target score, skill levels per area, study hours, preferred schedule) but does not save any of it.
- Files:
  - `apps/mobile/app/onboarding.tsx:766-771` -- `// TODO: save data via API` and `// TODO: navigate to diagnostic quiz`
  - `apps/web/src/pages/Onboarding.tsx:578-583` -- identical TODOs
- Impact: Users complete a multi-step onboarding flow, but all input is discarded. The routine/study plan features cannot personalize without this data.
- Fix approach: Create an edge function (e.g., `onboarding-save`) to persist the onboarding state to the `users` table. The `users` table already has `horas_disponiveis_por_dia` and `data_enem` columns but the onboarding collects much more (course goal, skill levels, preferred time slots).

### [High] Missing edge functions referenced by client code

- Issue: The client code calls API endpoints that have no corresponding edge function in `supabase/functions/`.
- Missing functions:
  - `/api/answer/question` -- called from `apps/mobile/lib/api/answer-question.ts:16` and `apps/web/src/lib/answer-question.ts:15`
  - `/api/auth/signup` -- called from `apps/mobile/app/(auth)/signup.tsx:659`
  - `/api/user/profile` -- called from `apps/mobile/app/(auth)/signup.tsx:679`
- Impact: These functions likely exist on the production Supabase instance but are not in the repository, making the codebase incomplete and non-deployable from source alone. New developers cannot understand or modify these endpoints.
- Fix approach: Export the missing edge functions from the production Supabase project and add them to `supabase/functions/`.

### [Medium] Outdated Deno standard library in edge functions

- Issue: All 6 edge functions import from `https://deno.land/std@0.168.0/http/server.ts`. This is a very old version of the Deno standard library. The `serve` function from `std/http` was deprecated in favor of `Deno.serve()` starting in Deno 1.35+.
- Files: All files in `supabase/functions/*/index.ts`
- Impact: Will eventually break when Supabase updates its Deno runtime. The old `serve()` API has known issues with error handling and performance.
- Fix approach: Migrate to `Deno.serve()` which is built-in and requires no import. Also pin `@supabase/supabase-js` to a specific version instead of `@2`.

### [Medium] Duplicate CORS + auth boilerplate across edge functions

- Issue: Every edge function (6 functions) copy-pastes the same ~25 lines of CORS header logic (`getCorsHeaders`, `json` helper, ALLOWED_ORIGINS parsing) and the same auth pattern (create authed client, verify user, create admin client).
- Files: `supabase/functions/user-me/index.ts`, `supabase/functions/pet-me/index.ts`, `supabase/functions/user-progress/index.ts`, `supabase/functions/class-join/index.ts`, `supabase/functions/broto-chat/index.ts`, `supabase/functions/material-index/index.ts`
- Impact: Any change to CORS logic or auth pattern must be replicated in 6 files. Easy to introduce inconsistencies (e.g., `material-index` already has a weaker auth check than the others -- see Security section).
- Fix approach: Extract shared utilities into a `supabase/functions/_shared/` directory (Supabase supports shared modules via `import_map.json`).

## Known Bugs

### [Medium] Signup on mobile calls an edge function API, web uses Supabase client directly

- Issue: The mobile signup flow calls `api.post('/api/auth/signup', form)` (an edge function), while the web signup uses `supabase.auth.signUp()` directly. This means the mobile signup has additional server-side logic (user profile creation?) that the web signup does not have, or vice versa.
- Files:
  - `apps/mobile/app/(auth)/signup.tsx:658-661` -- uses `api.post('/api/auth/signup')`
  - `apps/web/src/pages/Signup.tsx:31` / `apps/web/src/contexts/AuthContext.tsx:73-79` -- uses `supabase.auth.signUp()`
- Impact: Different signup behavior between platforms. The web signup may not create the `users` row in `public.users` that the rest of the app expects, leading to potential 404s on user-me.

## Security Considerations

### [Critical] `users` and `pets` tables have no RLS enabled

- Issue: The migrations enable RLS on `organizations`, `admin_profiles`, `classes`, `enrollments`, `materials`, `user_question_answers`, `question_topic_mapping`, `topic_performance`, and `tenants` -- but NOT on `public.users` or `public.pets`. Without RLS, any authenticated user can read/modify ANY user's profile or pet data via the Supabase client directly.
- Files: `supabase/migrations/20260317_foundation_organizations_classes.sql` (lines 144-148, 240-243 -- `users` and `pets` are conspicuously absent)
- Current mitigation: The edge functions use the service role key and fetch only the authenticated user's data by ID. However, the Supabase client is exposed on the frontend, and without RLS, direct queries to `users` or `pets` tables are unprotected.
- Recommendations: Add `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;` and `ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;` with policies restricting access to `user_id = auth.uid()` (for pets) and `id = auth.uid()` (for users).

### [High] `material-index` edge function has weak authorization

- Issue: The `material-index` function checks for an auth header but does NOT enforce it -- if no auth header is provided, the function continues execution without any user context. The comment says "deeper org-level authorization should be added."
- Files: `supabase/functions/material-index/index.ts:26-39`
- Current mitigation: The function still requires `material_id` and `class_id` (UUIDs), but an attacker who knows these IDs could trigger arbitrary indexing without authentication.
- Recommendations: Make the auth check mandatory (return 401 if no auth header). Add org-level authorization to verify the caller is an admin of the material's organization.

### [Medium] No rate limiting on any edge function

- Issue: None of the 6 edge functions implement rate limiting. The `broto-chat` function proxies to an external AI service (NotebookLM) with a 55-second timeout -- this is especially vulnerable to abuse.
- Files: All `supabase/functions/*/index.ts`
- Current mitigation: None.
- Recommendations: Add rate limiting at the Supabase project level or within each function. At minimum, limit `broto-chat` to prevent a single user from making excessive AI calls.

### [Medium] No password validation on mobile signup

- Issue: The web signup validates `password.length < 6`, but the mobile signup flow has zero client-side password validation before calling the API.
- Files:
  - `apps/web/src/pages/Signup.tsx:25` -- has validation
  - `apps/mobile/app/(auth)/signup.tsx:653-695` -- no password validation
- Current mitigation: Supabase Auth enforces a minimum password length server-side (default 6 chars), but the error message shown to users will be generic.
- Recommendations: Add the same `password.length < 6` check to the mobile signup form.

### [Medium] Hardcoded local Supabase API key in tracked file

- Issue: `.claude/settings.local.json` contains a Supabase API key (`sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`) and default `PGPASSWORD=postgres` credentials. While `.claude/` is not currently tracked in git (confirmed), this file exists locally and could be accidentally committed.
- Files: `.claude/settings.local.json:33`
- Current mitigation: `.claude/` is not in `.gitignore` but is also not currently tracked. The key appears to be a local development key.
- Recommendations: Add `.claude/` to `.gitignore` to prevent accidental commits.

### [Low] `.env` files not comprehensively excluded by `.gitignore`

- Issue: The `.gitignore` excludes `.env` and `.env.*.local` but does NOT exclude patterns like `apps/*/.env`. While these files are currently not tracked, the gitignore relies on nested `.gitignore` files or the apps' own ignore rules rather than being explicit at the root.
- Files: `.gitignore:21-22`
- Current mitigation: The `.env` files in `apps/web/`, `apps/admin/`, and `apps/mobile/` are not tracked (only `.env.example` files are).
- Recommendations: Add `**/.env` and `**/.env.local` to the root `.gitignore` for defense in depth.

## Performance Bottlenecks

### [Medium] Oversized page components (single-file monoliths)

- Issue: Several screen components are excessively large single files containing all logic, styles, sub-components, and data. These are difficult to maintain and can cause performance issues due to React re-rendering the entire tree.
- Files:
  - `apps/mobile/app/onboarding.tsx` -- **1,425 lines** (6 step components, styles, constants, types all in one file)
  - `apps/mobile/app/(auth)/signup.tsx` -- **1,209 lines**
  - `apps/web/src/pages/StudyArea.tsx` -- **1,055 lines**
  - `apps/mobile/app/enem-questions.tsx` -- **965 lines**
  - `apps/mobile/app/(tabs)/routine.tsx` -- **948 lines**
  - `apps/mobile/app/(tabs)/index.tsx` -- **781 lines**
  - `apps/mobile/app/(auth)/login.tsx` -- **750 lines**
- Impact: Difficult to navigate, test, or reason about. Long rebuild/refresh times. Any state change re-renders the entire massive component tree.
- Fix approach: Extract sub-components, hooks, and styles into separate files. Group related files in feature directories (e.g., `features/onboarding/`).

### [Medium] N+1 query pattern in `pet-me` edge function

- Issue: The `pet-me` function makes 4 sequential database queries: user + pet (parallel via `Promise.all`), then count query, then a full row fetch just to filter `is_correct`. The last two queries could be combined.
- Files: `supabase/functions/pet-me/index.ts:69-104`
- Impact: Increased latency on every home screen load (pet data is fetched on focus).
- Fix approach: Combine the count query and the correct-answer query into a single query using Postgres aggregates (`SELECT COUNT(*), SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) ...`).

## Fragile Areas

### [High] Supabase client initialization inconsistency across apps

- Issue: Each app initializes the Supabase client differently. Mobile uses a singleton pattern with `AsyncStorage` for auth persistence. Web and admin create a plain client with no explicit storage config (defaults to `localStorage`). The mobile client wraps creation in `createClient()`, while web/admin export a module-level `supabase` constant.
- Files:
  - `apps/mobile/lib/supabase/client.ts` -- singleton with AsyncStorage
  - `apps/web/src/lib/supabase.ts` -- module-level `createClient()` with no storage config
  - `apps/admin/src/lib/supabase.ts` -- identical to web
- Why fragile: If the initialization pattern changes (e.g., adding `autoRefreshToken: true`), it must be updated in 3 places. The web/admin clients do not configure auth persistence options, which may cause issues with SSR or certain browser configurations.
- Fix approach: Move Supabase client creation to `packages/shared` with platform-specific storage adapters passed as parameters.

### [Medium] Auth context divergence between apps

- Issue: The mobile app uses a simple `useAuth` hook returning `{ status, session }`, while the web app has a full `AuthContext` with `signIn/signUp/signOut` and profile fetching. The admin app has its own `AdminAuthContext`. None of these share code.
- Files:
  - `apps/mobile/hooks/use-auth.ts` -- minimal, no signIn/signUp
  - `apps/web/src/contexts/AuthContext.tsx` -- full context with profile fetching
  - `apps/admin/src/contexts/AdminAuthContext.tsx` -- admin-specific context
- Why fragile: Auth bugs (e.g., the deadlock that was fixed by separating userId from profile fetch) must be fixed independently in each app.
- Safe modification: When changing auth behavior, check all three implementations.

### [Medium] `user-progress` edge function has a silent fallback query

- Issue: If the first query (with `area_key` column) fails, it silently retries without the `area_key` column. This suggests schema migration uncertainty -- the code doesn't know if the column exists.
- Files: `supabase/functions/user-progress/index.ts:84-98`
- Why fragile: Masks real database errors. If the `area_key` column is successfully added in production, the fallback branch becomes dead code but is never removed. If the first query fails for a reason other than a missing column, the error is silently swallowed.
- Fix approach: Remove the fallback once the `area_key` column is confirmed in production. Add proper error handling that distinguishes "column not found" from other errors.

## Scaling Limits

### [Medium] JSON file storage for notebook mapping

- Issue: The NotebookLM Python service stores the `class_id -> notebook_id` mapping in a local JSON file (`data/notebook_map.json`). This is a single point of failure and cannot scale to multiple service instances.
- Files: `supabase/services/notebooklm/main.py:36-53`
- Current capacity: Works for a single-instance deployment.
- Limit: Will lose data if the container is restarted without persistent volumes. Cannot be horizontally scaled.
- Scaling path: Store the mapping in the database (the `classes` table already has a `notebook_id` column). The edge function `material-index` already writes `notebook_id` to the `classes` table.

### [Low] Questions data fetched from static JSON files

- Issue: The questions/exam data is fetched from static JSON files hosted on Supabase Storage or a configured base URL. This works for a fixed question bank but has no pagination, search, or filtering at the data layer.
- Files: `apps/mobile/hooks/use-questions-filters.ts:30-48`, `apps/web/src/hooks/useQuestionsFilters.ts`
- Current capacity: Works for the current ENEM question bank (~hundreds of questions).
- Limit: Cannot scale to thousands of questions. Client downloads entire area JSON files and filters in-memory.
- Scaling path: Move questions to a database table with server-side filtering and pagination.

## Dependencies at Risk

### [Medium] React version mismatch across apps

- Issue: The mobile app uses React 19.1.0 and React Native 0.81.5, while the web and admin apps use React ^18.3.0. The shared UI package (`@broto/ui`) declares `peerDependencies: { "react": "^18.0.0" }`. Running React 19 in mobile while shared packages expect React 18 can cause subtle hook/context issues.
- Files:
  - `apps/mobile/package.json:39-40` -- `"react": "19.1.0"`, `"react-dom": "19.1.0"`
  - `apps/web/package.json:15-16` -- `"react": "^18.3.0"`, `"react-dom": "^18.3.0"`
  - `apps/admin/package.json:14-15` -- `"react": "^18.3.0"`, `"react-dom": "^18.3.0"`
  - `packages/ui/package.json:7` -- `"peerDependencies": { "react": "^18.0.0" }`
- Impact: Potential runtime errors when sharing components or hooks between apps. The peer dependency warning may be suppressed but the incompatibility is real.
- Migration plan: Either upgrade web/admin to React 19 or pin mobile to React 18. Update `@broto/ui` peer dependencies accordingly.

### [Low] `docs/package-lock.json` tracked with Playwright dependencies

- Issue: The docs directory has its own `package.json` and `package-lock.json` tracked in git, including Playwright for PDF export. This adds unnecessary complexity and dependency surface.
- Files: `docs/package.json`, `docs/package-lock.json`, `docs/scripts/export-pitch-pdf.mjs`
- Impact: Low. Adds tracked files that most developers won't need. The local `docs/node_modules/` (containing Playwright) is not tracked but is generated on install.
- Migration plan: Move the PDF export to a CI script or remove if no longer needed.

## Test Coverage Gaps

### [Critical] Zero tests in the entire codebase

- What's not tested: Everything. There are no test files (`.test.ts`, `.spec.ts`, or `__tests__/` directories) anywhere in `apps/` or `packages/`. No test runner is configured (no Jest, Vitest, or Testing Library in any `package.json`). No test scripts in any `package.json`.
- Files: The entire `apps/` and `packages/` source tree.
- Risk: Any refactoring, dependency upgrade, or feature addition can introduce regressions with no safety net. The duplicated code between mobile and web is especially risky -- divergence may go unnoticed.
- Priority: **Critical**. At minimum, add unit tests for:
  1. `packages/shared/src/api/api-client.ts` -- the shared API utilities
  2. `packages/shared/src/hooks/create-cached-hook.ts` -- the caching layer
  3. Edge functions -- the server-side business logic
  4. Auth flows -- signup/login/signout across apps

## Missing Critical Features

### [Medium] Diagnostic quiz not implemented

- Issue: The onboarding flow has a placeholder for a diagnostic quiz (`// TODO: navigate to diagnostic quiz`) that would assess the student's initial skill level. This is referenced but never built.
- Files: `apps/mobile/app/onboarding.tsx:771`, `apps/web/src/pages/Onboarding.tsx:583`
- Blocks: Personalized study plan generation, accurate initial skill assessment.

### [Medium] Routine generation not connected to frontend

- Issue: The NotebookLM Python service has a `/routine/generate` endpoint that creates personalized study routines via AI, but the mobile and web routine screens appear to use hardcoded/mock data rather than calling this endpoint.
- Files:
  - `supabase/services/notebooklm/main.py:349-386` -- endpoint exists
  - `apps/mobile/app/(tabs)/routine.tsx` -- 948-line routine screen with no API call to routine generation
- Blocks: Dynamic, AI-personalized study routines.

## Code Quality Issues

### [Medium] Silent error swallowing throughout the codebase

- Issue: Many `catch` blocks are empty or swallow errors with `.catch(() => {})`. While some of these are intentional fire-and-forget operations (like cache invalidation), others hide real failures.
- Files (examples of concerning swallowed errors):
  - `apps/mobile/app/(auth)/signup.tsx:682` -- `catch {}` after avatar upload (user gets no feedback)
  - `apps/mobile/app/(auth)/login.tsx:414,417` -- empty catch blocks
  - `apps/web/src/contexts/AuthContext.tsx:57-58` -- `catch { // ignore }` on profile fetch
  - `apps/mobile/app/(tabs)/index.tsx:295,371` -- `.catch(() => {})` on mission state
  - `apps/web/src/lib/performance-history.ts:45` -- empty catch on localStorage operations
- Impact: Makes debugging difficult. Users may experience silent failures with no error feedback.
- Fix approach: At minimum, log errors even when the UI doesn't need to react. Replace empty catch blocks with `catch (err) { console.error('context', err) }`.

### [Low] `as any` type assertions in React Native styles

- Issue: Several React Native components use `as any` to bypass TypeScript type checking for percentage-based width values.
- Files:
  - `apps/mobile/components/auth/AuthShared.tsx:124-125`
  - `apps/mobile/app/study-area.tsx:178`
  - `apps/mobile/app/(tabs)/questions.tsx:178`
- Impact: Suppresses type safety. Could mask runtime errors.
- Fix approach: Use proper React Native style types or create a helper for percentage widths.

---

*Concerns audit: 2026-04-02*
