# Architecture Patterns

**Domain:** Turborepo monorepo — React Native + React web code sharing
**Researched:** 2026-04-02
**Confidence:** HIGH (direct codebase analysis; no web search required)

---

## Recommended Architecture

The target architecture for `packages/shared` restructuring is **domain-vertical slicing inside a layer-stratified shared package**, combined with the adapter pattern for platform-specific storage.

### Conceptual Structure

```
packages/
  shared/                        # @broto/shared — zero-dep, platform-agnostic
    src/
      types/                     # Domain types (unchanged)
      api/                       # Transport-agnostic API core (unchanged)
      utils/                     # Pure utilities
      domains/                   # NEW: domain business logic
        missions/
          core.ts                # Platform-free state machine
          types.ts               # DailyMissionsState, AreaKey
          storage.ts             # IStorage adapter interface
        area-config/
          data.ts                # AREA_CONFIG data (no imports)
          types.ts               # AreaConfig interface
        answer-question/
          submit.ts              # submitAnswer logic, cache invalidation signature
      stores/                    # createCachedStore (unchanged)
      hooks/                     # create-cached-hook.ts (unchanged — NO React here)

  ui/                            # @broto/ui — React web-only primitives (unchanged)

apps/
  shared-hooks/                  # NEW optional package — or keep per-app
    mobile/
      createCachedHook.ts        # React Native hook wrapper
    web/
      createCachedHook.ts        # React DOM hook wrapper

  mobile/
    adapters/
      storage.ts                 # AsyncStorage implementing IStorage
    hooks/
      create-cached-hook.ts      # (keep in-app — dual-React protection)
    lib/
      daily-missions.ts          # thin re-export calling @broto/shared with adapter

  web/
    adapters/
      storage.ts                 # localStorage implementing IStorage
    hooks/
      createCachedHook.ts        # (keep in-app — dual-React protection)
    lib/
      daily-missions.ts          # thin re-export calling @broto/shared with adapter
```

---

## Component Boundaries

### Current Boundaries (as-is)

| Component | Responsibility | Depends On |
|-----------|---------------|------------|
| `packages/shared` | Types, API core, CachedStore factory | Nothing |
| `packages/ui` | React web UI primitives | React (peer) |
| `apps/mobile` | RN student app | `@broto/shared`, `@broto/ui` (unused), Expo, Supabase SDK |
| `apps/web` | React student app | `@broto/shared`, `@broto/ui`, Supabase, fetch |
| `apps/admin` | React admin app | `@broto/shared` (types only), Supabase |
| `supabase/functions` | Edge Function API | Deno, Supabase JS (ESM) |
| `supabase/services/notebooklm` | AI proxy service | Python, FastAPI, notebooklm-py |

### Target Boundaries (after consolidation)

The boundaries remain the same; only the **internal placement of logic** shifts. No new packages are added for the consolidation milestone. The goal is to pull duplicated logic up into `packages/shared`, not to restructure the package tree.

**Rule for what enters `packages/shared`:**
- Has identical business intent in both apps (same types, same state machine)
- Contains zero platform imports (no `AsyncStorage`, no `localStorage`, no `window`, no `document`, no `React`)
- Can be tested in a plain Node.js environment

**Rule for what stays per-app:**
- React hooks (`useEffect`, `useState`) — dual-React protection
- Platform storage adapters (AsyncStorage vs localStorage)
- Platform navigation (expo-router vs window.location.href)
- App-specific API clients (Supabase SDK vs fetch transport)
- Icon sets (`lucide-react-native` vs `lucide-react`)

---

## Data Flow

### Read Path (data hooks)

```
Component
  └─ useUser() / usePet() / useProgress()    [per-app hook, React-aware]
       └─ CachedStore (module-level singleton) [@broto/shared, React-free]
            └─ api.get('/api/user/me')        [per-app transport]
                 └─ pathToFunctionName()      [@broto/shared, pure util]
                 └─ Supabase SDK (mobile)
                    OR fetch (web/admin)
                 └─ Edge Function (Deno)
                      └─ PostgreSQL (via RLS)
```

The store is module-level (not React context), so it survives component unmount and serves as an application-wide singleton. React components subscribe and re-render only when the store notifies — the store drives React, not the other way around.

### Write Path (mutations)

```
submitAnswer(payload)                   [per-app lib, can move to @broto/shared]
  └─ api.post('/api/answer/question')   [per-app transport]
  └─ incrementDailyAreaAnswer()         [currently per-app, should move to @broto/shared core]
  └─ bumpPerformanceDay()               [web-only; mobile gap — should align]
  └─ refreshPet() / refreshProgress()   [CachedStore invalidation via store.refresh()]
```

The write path calls into per-app functions (`incrementDailyAreaAnswer`, `bumpPerformanceDay`) that both duplicate business logic and differ in storage backend. This is the primary consolidation target.

### Auth Flow

```
Supabase Auth (client-side session)
  └─ AuthContext / useAuth          [per-app React context, intentionally NOT shared]
       └─ supabase.auth.onAuthStateChange()
       └─ triggers 401 handler in api-client (per-app, intentionally NOT shared)
            └─ mobile: expo-router.replace('/(auth)/login')
            └─ web: window.location.href = '/login'
```

Auth cannot be meaningfully shared. The session mechanics are identical but navigation and signout dispatch differ per platform. Keep separate.

### Cache Invalidation

```
Mutation completes
  └─ store.refresh()   [increments generation counter, clears cached, re-fetches]
       └─ listeners.forEach(fn => fn())   [notifies all subscribed React hooks]
            └─ setData() / setLoading()   [per-app React state update]
```

---

## Patterns to Follow

### Pattern 1: Adapter Interface for Platform Storage

The daily missions module has identical business logic but different storage backends. The correct consolidation approach is a storage interface in `@broto/shared` with platform adapters in each app.

```typescript
// packages/shared/src/domains/missions/storage.ts
export interface IStorage {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

// packages/shared/src/domains/missions/core.ts
export function createDailyMissionsStore(storage: IStorage) {
  // all business logic here — works for AsyncStorage and localStorage
}
```

```typescript
// apps/mobile/adapters/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
export const mobileStorage: IStorage = AsyncStorage

// apps/web/adapters/storage.ts
export const webStorage: IStorage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => localStorage.removeItem(k),
}
```

This eliminates the duplication between `apps/mobile/lib/missions/daily-missions.ts` and `apps/web/src/lib/daily-missions.ts` (currently ~70 lines each, ~90% identical).

**Confidence:** HIGH — this is a well-established pattern for monorepos mixing platforms.

### Pattern 2: Keep createCachedHook Per-App (Do Not Move to Shared)

Both apps have an identical `createCachedHook` wrapper (verified — 41 lines each, byte-for-byte identical except formatting). The temptation is to consolidate this into `@broto/shared`, but it must stay per-app.

**Why:** A Turborepo monorepo with both React Native and React DOM has two separate React instances at runtime. If `@broto/shared` imported React directly, both apps would bundle their own React plus the one from `@broto/shared`, resulting in two React instances per app. This breaks hooks (hooks depend on a single React context registry per runtime).

The pattern already in use — `createCachedStore` is React-free in `@broto/shared`, each app wraps it with its own `useEffect`/`useState` — is correct. Do not change it.

The duplication here is acceptable and intentional. Document it clearly rather than "fixing" it.

**Confidence:** HIGH — dual-React issues in Turborepo are well-documented and the current approach is the standard workaround.

### Pattern 3: Domain-Vertical Slicing Within `packages/shared`

The current `packages/shared` is organized by layer (`types/`, `api/`, `hooks/`, `utils/`). As business logic moves in, organize new code by domain within a `domains/` subdirectory:

```
packages/shared/src/
  types/            # keep (domain types — already here)
  api/              # keep (transport utilities)
  utils/            # keep (class-code, etc.)
  stores/           # keep (createCachedStore)
  domains/          # NEW — one directory per business domain
    missions/       # daily missions state machine + IStorage adapter
    area-config/    # AREA_CONFIG data without icon imports
    performance/    # performance-history core (new, mirrors web-only module)
```

Layer organization (types/, api/, etc.) works for infrastructure. Domain organization (missions/, area-config/) works for business logic. The hybrid is better than picking one for everything.

**Confidence:** HIGH — this follows the "screaming architecture" principle and is the standard approach in large TypeScript monorepos.

### Pattern 4: Area Config Split — Data vs Icons

`area-config.ts` is duplicated between mobile and web but cannot be fully consolidated because icon imports differ: mobile uses `lucide-react-native`, web uses `lucide-react`. These are separate npm packages that produce different bundle output.

The solution: split into data (shareable) and presentation (per-platform).

```typescript
// packages/shared/src/domains/area-config/data.ts
// Contains: labels, slugs, colors — NO icon imports
export const AREA_KEYS = ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'] as const
export type AreaKey = typeof AREA_KEYS[number]
export interface AreaData { label: string; short: string; color: string; glow: string; textColor: string }
export const AREA_DATA: Record<AreaKey, AreaData> = { ... }

// apps/mobile/theme/area-config.ts (keep, extends with RN icons)
import { AREA_DATA } from '@broto/shared'
import { BookOpen, ... } from 'lucide-react-native'
// merge AREA_DATA with icon assignments

// apps/web/src/lib/area-config.ts (keep, extends with DOM icons)
import { AREA_DATA } from '@broto/shared'
import { BookOpen, ... } from 'lucide-react'
// merge AREA_DATA with icon assignments
```

This moves ~60% of each file's content (the data) to shared, while each app retains only the icon-binding layer.

**Confidence:** HIGH — platform-split icon packages are a documented constraint in RN + web monorepos.

### Pattern 5: `submitAnswer` as a Shared Orchestrator

The write path for answering a question is nearly identical in both apps but diverges due to `performance-history` being web-only. After fixing that gap (mobile is missing `performance-history`), `submitAnswer` can be shared.

```typescript
// packages/shared/src/domains/answer-question/submit.ts
// Takes injected dependencies instead of importing platform code directly
export function createSubmitAnswer(deps: {
  api: { post: (path: string, body: unknown) => Promise<void> }
  incrementDailyAreaAnswer: (params: { areaKey: string; isCorrect: boolean }) => void
  bumpPerformanceDay: (isCorrect: boolean) => void
  refreshPet: () => void
  refreshProgress: () => void
}) {
  return async function submitAnswer(payload: SubmitAnswerPayload): Promise<void> { ... }
}
```

Each app instantiates this factory with its own cache refresh functions and storage-backed mission/performance functions.

**Note:** This is an advanced pattern. For the consolidation milestone, simply aligning types and moving `SubmitAnswerPayload` to shared is sufficient. Full factory extraction can come later.

**Confidence:** MEDIUM — correct pattern but adds indirection; benefit is proportional to how often the orchestration logic diverges.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Moving React Hooks into `@broto/shared`

**What:** Placing `createCachedHook`, `useUser`, `usePet`, or any `useEffect`/`useState` usage inside `packages/shared`.
**Why bad:** Causes dual-React instantiation. Hooks silently break (wrong context registry). Error message is confusing: "Hooks can only be called inside a function component."
**Instead:** Keep the store in `@broto/shared` (React-free). Keep the `createCachedHook` wrapper per-app.

### Anti-Pattern 2: Importing Platform Packages from `@broto/shared`

**What:** `import AsyncStorage from '@react-native-async-storage/async-storage'` or `localStorage` references inside `packages/shared/`.
**Why bad:** `@broto/shared` is consumed by web apps that bundle for DOM. AsyncStorage import fails in Vite/web builds. localStorage fails in React Native at import time.
**Instead:** Use the IStorage adapter interface. Each app passes its own storage implementation when initializing the domain module.

### Anti-Pattern 3: Organizing Shared Code Purely by Layer

**What:** Adding `packages/shared/src/business/missions.ts`, `business/performance.ts`, `business/area-config.ts` — all business logic in one flat directory organized by layer.
**Why bad:** As the package grows, layer directories become unmaintainable buckets. Refactoring one domain means touching files scattered across `types/`, `utils/`, `business/`.
**Instead:** Group by domain inside `domains/`. Each domain directory owns its types, core logic, and adapter interfaces.

### Anti-Pattern 4: Shared ClassContext

**What:** Moving `ClassContext` / `ClassProvider` into `@broto/shared` or `packages/ui`.
**Why bad:** ClassContext uses React Context API (same dual-React problem). Additionally, mobile uses `createClient()` (Expo-specific Supabase init) while web uses a module-level `supabase` singleton — the Supabase client cannot be shared.
**Instead:** Keep ClassContext duplicated. The mobile and web versions already share the same types (`Class`, `Organization` from `@broto/shared`) and the same query structure. The duplication here is ~50 lines of structural boilerplate, not business logic.

### Anti-Pattern 5: Creating New Packages for Single-Purpose Extraction

**What:** Creating `packages/missions`, `packages/area-config`, `packages/performance` as separate Turborepo packages.
**Why bad:** Each new package multiplies `package.json` files, workspace resolution overhead, and build graph edges. For a three-app monorepo consolidation, adding packages adds friction without benefit.
**Instead:** Consolidate everything into `packages/shared/src/domains/`. The existing `@broto/shared` package is already the correct container.

---

## Component Communication Map

```
                      @broto/shared
                      (zero deps)
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    apps/mobile       apps/web          apps/admin
    (RN/Expo)         (React+Vite)      (React+Vite)
         │                 │
   AsyncStorage       localStorage
   supabase SDK       fetch + apikey
   expo-router        window.location
   lucide-react-native  lucide-react
         │                 │
         └────────┬────────┘
                  │
         Supabase Edge Functions
         (Deno, all 6 functions)
                  │
         ┌────────┴────────┐
         │                 │
      PostgreSQL      NotebookLM
      (RLS enforced)  Python service
```

**Direction rule:** Arrows flow downward only. Apps depend on packages; packages do not depend on apps. Edge Functions do not know about apps. The Python service does not know about Edge Functions (it receives HTTP only).

---

## Turborepo Build Order

The current `turbo.json` correctly uses `"dependsOn": ["^build"]` which enforces topological sort. Given the dependency graph:

```
packages/shared  ──────────────────────────────► (built first)
packages/ui (depends on shared via peer)  ──────► (built second)
apps/mobile  (depends on shared)  ──────────────► (built third, parallel with web/admin)
apps/web     (depends on shared, ui)  ──────────► (built third, parallel)
apps/admin   (depends on shared)  ──────────────► (built third, parallel)
```

**Correct build order enforced by Turborepo:**
1. `packages/shared` — built first (no internal dependencies)
2. `packages/ui` — built after `packages/shared`
3. `apps/*` — all three built in parallel after their package dependencies are ready

**For typecheck:** The same order applies. `typecheck` also uses `"dependsOn": ["^build"]` which ensures packages are compiled before apps typecheck against them. This is correct.

**For dev mode:** `dev` has `"cache": false, "persistent": true`. All apps start in parallel. Since `packages/shared` uses `"exports"` pointing to source TypeScript (or compiled output), dev mode works without a watch build of the shared package. If `packages/shared` is migrated to use `.ts` source directly (via `tsconfig` path aliases and no dist step), this remains efficient.

**Implication for consolidation:** Adding new files to `packages/shared/src/domains/` does not require any `turbo.json` changes. The existing pipeline handles it. Only if a new *package* were added would `turbo.json` need updating (to add the new package's build task to the graph).

---

## Migration Strategy: Moving Duplicated Code to Shared Safely

The constraint is that both apps must keep working throughout. This dictates an "expand-contract" approach:

### Phase 1 — Expand: Add to shared without removing from apps

1. Create `packages/shared/src/domains/missions/types.ts` — export `DailyMissionsState`, `AreaKey`
2. Create `packages/shared/src/domains/missions/storage.ts` — export `IStorage` interface
3. Create `packages/shared/src/domains/missions/core.ts` — export `createDailyMissionsStore(storage: IStorage)`
4. Add exports to `packages/shared/src/index.ts`

At this point, both apps still use their own mission files. Nothing breaks.

### Phase 2 — Migrate app-by-web: Wire adapters, redirect imports

1. In `apps/web`: create `src/adapters/storage.ts`, replace `src/lib/daily-missions.ts` with a thin wrapper that calls the shared core with the web adapter
2. Verify web app still works
3. In `apps/mobile`: create `adapters/storage.ts`, replace `lib/missions/daily-missions.ts` the same way
4. Verify mobile app still works

### Phase 3 — Contract: Remove the duplicated originals

Only after both apps successfully use the shared version, delete the old per-app implementations.

### Verification at each step

Since there are no tests today (confirmed: Tests: F grade), verification is manual smoke-testing during migration. The consolidation milestone should add at least one test per shared domain module to catch regressions. Tests in `packages/shared` run in Node.js without React or platform dependencies — this is a significant advantage of the domain-vertical structure.

---

## Scalability Considerations

| Concern | Current (3 apps, ~2 devs) | After consolidation |
|---------|--------------------------|---------------------|
| Bug fix blast radius | Fix same bug twice (mobile + web) | Fix once in shared domain |
| Adding a new data type | Add to `types/`, update two apps | Add to `types/`, apps pick up automatically |
| Adding a new app (e.g., student web v2) | Copy duplication pattern | Consume shared domains, write platform adapter |
| Build time | Fast (3 apps in parallel) | Unchanged — no new packages |
| TypeScript compilation | `^build` ensures package built first | Unchanged |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Dual-React hook isolation | HIGH | Direct code verification; well-documented monorepo pattern |
| Adapter pattern for storage | HIGH | Direct code verification; IStorage is a standard approach |
| Build order / turbo.json | HIGH | Direct `turbo.json` read; `^build` topological sort is documented behavior |
| Domain-vertical slicing | HIGH | Synthesized from codebase structure analysis |
| Area config split strategy | HIGH | Verified icon imports differ between apps (`lucide-react-native` vs `lucide-react`) |
| Migration sequence (expand-contract) | HIGH | Standard safe-migration pattern; no tests means more caution required |

---

## Sources

- Direct codebase analysis: `packages/shared/src/hooks/create-cached-hook.ts`, `apps/mobile/hooks/create-cached-hook.ts`, `apps/web/src/hooks/createCachedHook.ts` — confirmed identical logic, dual-React pattern intentional
- Direct codebase analysis: `apps/mobile/lib/missions/daily-missions.ts` vs `apps/web/src/lib/daily-missions.ts` — confirmed ~90% duplication, diverge only on AsyncStorage vs localStorage
- Direct codebase analysis: `apps/mobile/theme/area-config.ts` vs `apps/web/src/lib/area-config.ts` — confirmed platform split on icon package imports
- Direct codebase analysis: `turbo.json` — `"dependsOn": ["^build"]` confirms topological build order
- `.planning/PROJECT.md` — Key Decision: "Keep `createCachedHook` per-app (React isolation)" confirmed as intentional
- `.planning/codebase/ARCHITECTURE.md` — Component boundaries and data flow (primary reference)
