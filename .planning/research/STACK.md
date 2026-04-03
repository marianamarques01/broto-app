# Technology Stack — Monorepo Consolidation

**Project:** Broto EdTech — Codebase Consolidation
**Researched:** 2026-04-02
**Scope:** Tooling and patterns for sharing code across React Native (Expo) + React (Vite) + Supabase in the existing Turborepo monorepo

---

## Context

The stack is fixed. This research is not about picking technology — it is about how to best use the existing stack (`Turborepo 2.x`, `TypeScript 5.4`, `React Native / Expo SDK 54`, `React 18/19`, `Vite 5`, `ESLint 9 flat config`, `Prettier 3`) to share code safely across three apps. Every recommendation below is constrained to patterns that work within the current versions without adding new dependencies.

---

## Recommended Stack for Consolidation

### Monorepo Orchestration

| Technology | Current Version | Purpose | Assessment |
|------------|-----------------|---------|------------|
| Turborepo | 2.8.17 | Build orchestration, task caching | Keep as-is. 2.x is current, no upgrade needed. |

**Internal package strategy: source-first (no compilation step in `packages/shared`).**

The current `packages/shared/package.json` already does this correctly:

```json
{
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

This is the right pattern for this monorepo. Each consuming app's bundler (Vite, Metro) resolves the TypeScript source directly. There is no `build` step for `packages/shared`, and none should be added. This approach eliminates a class of "forgot to rebuild shared" bugs.

**Do NOT switch to compiled packages.** Compiled packages (with a `dist/` output and a `build` script) require `typecheck` to depend on `^build`, which is already configured in `turbo.json`. This creates latency in the dev loop and adds a rebuild-on-change burden that is not warranted for internal-only packages. Source-first is simpler and works because Metro and Vite both handle `.ts` imports in workspace packages.

### TypeScript Configuration

| Approach | Recommended | Why |
|----------|-------------|-----|
| Path aliases (`@/*`) per app | YES — keep existing | Already working, no change needed |
| TypeScript project references | NO | Over-engineering for a 3-app monorepo with no compilation step in shared packages |
| Shared `tsconfig.base.json` at root | YES — add this | Removes duplication of `strict`, `skipLibCheck`, `noFallthroughCasesInSwitch` across app tsconfigs |

**What to do:** Create `tsconfig.base.json` at the monorepo root with common `compilerOptions`. Each app `tsconfig.json` should `extends: "../../tsconfig.base.json"` and only override what differs (target, lib, jsx, paths, include).

**What NOT to do:** Do not add TypeScript project references (`references: []` in tsconfig). Project references require `composite: true` and a `build` step. They are designed for large repos where incremental compilation is a bottleneck. In this repo, `tsc --noEmit` for type-checking is sufficient, and Vite/Metro handle the actual transpilation.

**Confidence:** HIGH — based on direct inspection of existing `tsconfig.json` files and Turborepo's documented `just-in-time` package pattern.

### Code Sharing Pattern: The React Instance Problem

**This is the most critical constraint in the stack.**

React Native (Expo SDK 54) currently runs React 19.1.0 while web/admin run React 18.3.x. Importing any React hook from `packages/shared` (or from `packages/ui`) into a mobile app would cause two React instances to be loaded simultaneously, breaking the rules of hooks.

**The existing solution is correct and must be preserved:**

```
packages/shared/src/hooks/create-cached-hook.ts  ← React-free store factory
apps/mobile/hooks/create-cached-hook.ts          ← thin React 19 wrapper
apps/web/src/hooks/createCachedHook.ts           ← thin React 18 wrapper
```

The `createCachedStore()` function in `@broto/shared` uses a plain pub/sub pattern (no React imports). Each app provides its own `useEffect`/`useState` wrapper that imports React from the app's own `node_modules`. This is the canonical solution for the dual-React problem in monorepos.

**Rule to enforce going forward:** `packages/shared` must never import from `react`, `react-native`, `react-dom`, or any platform-specific package. It is a platform-agnostic TypeScript library. ESLint can enforce this via a `no-restricted-imports` rule on the shared package.

**Confidence:** HIGH — directly observable in the codebase; the React instance isolation pattern is well-established in the React Native ecosystem.

### Adapter Pattern for Platform-Specific APIs

The biggest blocker to sharing logic is the `daily-missions.ts` case: the business logic is identical across platforms but the storage layer differs (`AsyncStorage` on mobile, `localStorage` on web).

**Recommended pattern: storage adapter injection.**

Define an interface in `@broto/shared`:

```typescript
// packages/shared/src/storage/types.ts
export interface SyncStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AsyncStorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
```

Move the `daily-missions` logic to `packages/shared`, accepting a storage adapter as a parameter. Each app passes its concrete adapter at initialization:

- Mobile: wraps `@react-native-async-storage/async-storage`
- Web: wraps `localStorage` in a Promise-based adapter

This is the same pattern already used for the API client: shared core (`pathToFunctionName`, `mergeParamsIntoBody`) + platform-specific `invoke` implementation in each app.

**Do NOT use platform-specific file suffixes (`.ios.ts`, `.native.ts`, `.web.ts`) in `packages/shared`.** Metro supports these suffixes but Vite does not. Using platform extensions in shared packages breaks web builds. Keep all platform divergence in the app layer via adapters.

**Confidence:** HIGH — the existing `api-client.ts` already demonstrates this pattern working in production.

### ESLint Configuration

| Approach | Recommended | Why |
|----------|-------------|-----|
| Root flat config (`eslint.config.mjs`) | YES — already exists | ESLint 9 flat config is the current standard |
| App-level overrides in root config | YES | Use `files` glob patterns to add React Native rules for mobile, RN-specific ignores for web |
| `eslint-plugin-react-native` | Optional | Only needed if RN-specific lint rules are wanted; not required for consolidation |
| Shared config package (`packages/eslint-config`) | NO | Unnecessary indirection for a 3-app monorepo with a single root config |

**What to do:** Keep the single root `eslint.config.mjs`. Add a `no-restricted-imports` rule scoped to `packages/shared/src/**` that errors on importing `react`, `react-native`, `react-dom`, `expo-*`, and `@react-native-*`. This enforces the platform-agnostic boundary automatically.

```javascript
// eslint.config.mjs addition
{
  files: ['packages/shared/src/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['react', 'react-dom', 'react-native', 'expo*', '@react-native*']
    }]
  }
}
```

**Confidence:** HIGH — ESLint 9 flat config supports `files`-scoped rules natively.

### Prettier Configuration

The existing root `.prettierrc` already enforces web/admin conventions (no semicolons, single quotes). The problem is that mobile code was written with double quotes and semicolons before the root config existed or was enforced.

**What to do:** No Prettier config changes needed. Run `npm run format` once to reformat all mobile files to match the root `.prettierrc`. This is the standardization step, not a tooling change.

**Do NOT create per-app Prettier configs.** Multiple Prettier configs in a monorepo create the split-convention problem that already exists. The root config is the single source of truth.

**Confidence:** HIGH — Prettier respects the nearest config file, but the root config applies to all files when no closer config exists.

### Package Structure: What Goes Where

Based on analysis of the ~25% code duplication identified in `CRITICAL-ANALYSIS.md`:

| Code | Current Location | Target | Blocker |
|------|-----------------|--------|---------|
| `study-area-mock.ts` (383 lines) | Duplicated in both apps | `packages/shared/src/` | None — no platform deps |
| `types/questions.ts` | Duplicated (re-export) | Remove; import from `@broto/shared` directly | None |
| `useQuestionsFilters` core logic (search, filter, cache) | Duplicated (502 vs 230 lines, diverged) | `packages/shared/src/` | None — pure TS, no platform deps |
| `daily-missions.ts` business logic | Duplicated with incompatible storage APIs | `packages/shared/src/` with storage adapter | Requires adapter pattern |
| `answer-question.ts` | Duplicated | `packages/shared/src/` | `api` and `incrementDailyAreaAnswer` must be injected or imported from shared |
| `area-config.ts` (non-icon parts: labels, colors, slug mappings) | Duplicated | `packages/shared/src/` | Icons use platform-specific libs (`lucide-react` vs `lucide-react-native`) — split data from icons |
| `ClassContext` query logic | Duplicated (1 query vs 2 queries) | `packages/shared/src/` as a plain async function | React Context wrapper stays per-app |
| `useUser`, `usePet`, `useProgress` hooks | Duplicated (95% identical) | The React hook wrapper stays per-app; move the data-fetching logic to shared as a fetcher function | `useFocusEffect` is mobile-only |
| `performance-history.ts` | Web-only | Keep in web until mobile needs it; don't over-share |

**Area config icons specifically:** The icon component (`BookOpen`, `Globe2` etc.) comes from `lucide-react` on web and `lucide-react-native` on mobile. These are different packages. The shared package can export the data layer (`label`, `color`, `slug`) but NOT the icon component. Each app provides its own icon mapping.

**Confidence:** HIGH — derived from direct code inspection. The only architectural judgment call is the storage adapter pattern for `daily-missions`, which follows the established `api-client` precedent.

### React Version Misalignment

| App | React Version |
|-----|--------------|
| `apps/mobile` | 19.1.0 |
| `apps/web` | 18.3.x |
| `apps/admin` | 18.3.x |

**This is a non-issue for the consolidation milestone** because `packages/shared` contains no React code and `packages/ui` is currently unused by mobile. The misalignment only matters if `packages/ui` is ever extended to support React Native, which is out of scope.

**Do NOT attempt to unify React versions.** Expo SDK 54 requires React 19; web/admin on React 18 is stable. Upgrading web/admin to React 19 is a separate initiative requiring validation.

**Confidence:** HIGH — version requirements are enforced by Expo's peerDependency constraints.

### Testing Foundation

Current state: zero automated tests (grade F per CRITICAL-ANALYSIS.md).

For the consolidation milestone, the goal is to establish a baseline, not full coverage. The right tool is **Vitest** for unit testing the shared package.

| Tool | Purpose | Why |
|------|---------|-----|
| `vitest ^2.x` | Unit tests for `packages/shared` | Same config as Vite (zero-config for `.ts` files), fast, no Babel needed |
| No testing of React components yet | Deferred | Component tests require JSDOM/RN test renderer setup; higher cost, lower ROI for consolidation |

**Do NOT add Jest.** The repo uses Vite for web apps. Using Vitest avoids the dual-config complexity of maintaining both Jest (with Babel transforms) and Vite. Vitest is the de facto standard for Vite-based TypeScript projects.

**Do NOT add testing-library yet.** Component tests for the consolidation milestone are premature. The value in this milestone is testing pure business logic in `packages/shared` (e.g., `createCachedStore` race condition fix, `daily-missions` adapter logic).

**Confidence:** MEDIUM — Vitest is the standard choice for Vite-based repos (HIGH confidence). Whether to add it in this milestone vs a dedicated testing milestone is a prioritization judgment (MEDIUM confidence).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Package strategy | Source-first (no build step in shared) | Compiled packages with `dist/` | Adds rebuild burden, dev loop friction, no benefit for internal-only packages |
| TypeScript config sharing | Root `tsconfig.base.json` | TypeScript project references | Project references require `composite: true` and compilation; over-engineering for 3 apps |
| Platform divergence | Adapter/injection pattern | Platform file extensions (`.native.ts`, `.web.ts`) | Vite does not support `.native.ts` extensions; only Metro does |
| ESLint structure | Single root `eslint.config.mjs` with `files` scopes | Separate `packages/eslint-config` | Unnecessary indirection for 3 apps |
| Unit testing | Vitest | Jest | Vite-based repo; Vitest is zero-config for this setup; Jest requires Babel transforms |
| React version unification | Leave misaligned | Upgrade web/admin to React 19 | Expo SDK 54 locks mobile to React 19; upgrading web introduces risk outside consolidation scope |

---

## Implementation Order

1. **Root `tsconfig.base.json`** — Low risk, unlocks consistent strict mode everywhere. No behavior change.
2. **ESLint `no-restricted-imports` for `packages/shared`** — Automated guardrail. Catches violations before code review.
3. **Prettier reformatting of mobile** — One-time `npm run format`. Normalizes conventions. Should be a standalone commit.
4. **Move zero-dependency duplicates** — `study-area-mock.ts`, `types/questions.ts`, area config data layer. Safe — no adapter needed.
5. **Storage adapter + shared `daily-missions`** — Requires new interface in shared + adapter in each app.
6. **Shared `useQuestionsFilters` core** — Largest logic unification. The mobile version (502 lines) has superior error handling and URL resolution; use it as the source of truth.
7. **Vitest for `packages/shared`** — Add after logic is moved in; test the new shared code.

---

## What NOT to Do

- **Do not add `packages/eslint-config` or `packages/tsconfig`** as separate workspace packages. The overhead of maintaining separately versioned config packages is not worth it for 3 apps. Root-level files work fine.
- **Do not move `createCachedHook` to shared.** The React instance isolation is intentional. Each app's thin wrapper is 41 lines. This is the correct architecture, not a duplication problem.
- **Do not use `.native.ts` / `.web.ts` file extensions in `packages/shared`.** Only Metro understands these. Vite will try to import the base file with no platform suffix and may pick up the wrong one or fail.
- **Do not add `react-query` or `zustand` to consolidate state management.** The existing `createCachedStore` pattern is well-designed and already solving the problem. Introducing a new state library requires migrating all existing hooks and adds a learning curve with no consolidation benefit.
- **Do not move `ClassContext` React component to shared.** The context itself uses `createContext`/`useEffect`/`useState` — all React imports. Only the underlying Supabase query (the `load()` async function) can be shared. The React wrapper stays per-app.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Internal package source-first pattern | HIGH | Directly verified in codebase; documented Turborepo pattern |
| React instance isolation | HIGH | Observable in codebase; matches React docs on hooks rules |
| Adapter pattern for platform APIs | HIGH | Already demonstrated by `api-client.ts` split |
| ESLint flat config `files` scoping | HIGH | ESLint 9 flat config documentation pattern |
| Vitest for shared package | MEDIUM | WebSearch/WebFetch unavailable; based on training data that Vitest is standard for Vite repos (August 2025 cutoff) |
| TypeScript base config (no project references) | HIGH | Based on direct inspection; project refs offer no benefit without compilation |

---

## Sources

- Direct codebase inspection: `packages/shared/`, `apps/mobile/`, `apps/web/`, `apps/admin/`, `turbo.json`, `eslint.config.mjs`, `tsconfig.json` files
- `.planning/codebase/CRITICAL-ANALYSIS.md` — duplication analysis and health grades
- `.planning/codebase/ARCHITECTURE.md` — CachedStore pattern documentation
- Knowledge cutoff: August 2025 (Turborepo 2.x, ESLint 9 flat config, Vitest 2.x)
