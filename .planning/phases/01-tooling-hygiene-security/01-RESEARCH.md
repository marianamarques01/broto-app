# Phase 1: Tooling, Hygiene & Security - Research

**Researched:** 2026-04-02
**Domain:** Monorepo tooling (ESLint, Prettier, TypeScript), repo hygiene (git, SVGs, dead code), Supabase Edge Function CORS
**Confidence:** HIGH — all findings grounded in direct codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Remove `.venv/` and `__pycache__/` from git with `git rm -r --cached`, add both to `.gitignore`. Do NOT use `git filter-branch` — the history rewrite is not worth the risk for this milestone.
- **D-02:** Optimize SVGs using SVGO CLI (`npx svgo`). Target files: `2.svg`, `new_logo.svg`, `new_logo_icon.svg` at root, plus duplicates in `apps/web/public/` and `apps/mobile/assets/`. Remove root-level duplicates that also exist in app directories.
- **D-03:** For `packages/ui` — first `grep -r "@broto/ui" apps/` to check if any app imports it. If `apps/web/package.json` declares it as dependency but no source files import from it, remove the dependency entry. If truly no imports anywhere, remove the entire package directory. If imports exist, add a `"description"` field to its `package.json` explaining purpose.
- **D-04:** Remove `apps/mobile/lib/types/questions.ts` and `apps/web/src/lib/types/questions.ts` — update imports to use `@broto/shared` directly.
- **D-05:** Standardize on web/admin conventions: single quotes, no semicolons, trailing commas. Mobile is the outlier that gets reformatted.
- **D-06:** Create root `.prettierrc` with shared config. All apps extend it (no per-app overrides).
- **D-07:** Fix Prettier glob in root `package.json` to include mobile paths: `"apps/mobile/{app,hooks,lib,components,contexts,theme}/**/*.{ts,tsx}"` in addition to `"apps/*/src/**/*.{ts,tsx}"`.
- **D-08:** Format commit must be a single atomic commit. Immediately after, add the commit hash to `.git-blame-ignore-revs` in a separate commit.
- **D-09:** Hook file renaming: rename mobile hooks from kebab-case to camelCase (`use-pet.ts` -> `usePet.ts`, `use-auth.ts` -> `useAuth.ts`, etc.). Update all imports referencing old names.
- **D-10:** Create root `tsconfig.base.json` with shared `compilerOptions` (strict, target, module, jsx settings). Each app's `tsconfig.json` extends it via `"extends": "../../tsconfig.base.json"`, adding only app-specific paths/includes.
- **D-11:** Do NOT add TypeScript project references — the codebase uses source-first packages (no compilation step), and project references would add unnecessary complexity.
- **D-12:** Add `no-restricted-imports` rule scoped to `packages/shared/src/**` that blocks `react`, `react-native`, `expo-*`, and any platform-specific module. Error message: "packages/shared must remain platform-agnostic — use adapter pattern for platform APIs".
- **D-13:** Enable `@typescript-eslint/no-floating-promises` rule with `"error"` severity across all apps. This MUST be in place before Phase 3's async adapter migrations.
- **D-14:** Use ESLint 9 flat config with file-scoped rules — the `eslint.config.mjs` at root already exists. Add shared package restrictions as a new config block.
- **D-15:** In all Supabase edge functions, change CORS default behavior: if `ALLOWED_ORIGINS` env var is empty or unset, reject with 403 instead of defaulting to `*`. Only allow origins explicitly listed.
- **D-16:** Extract CORS logic into `supabase/functions/_shared/cors.ts` utility. All edge functions import from there instead of duplicating the CORS block.
- **D-17:** Keep existing `ALLOWED_ORIGINS` env var pattern (comma-separated string) — no schema change needed.

### Claude's Discretion

- Exact SVGO configuration flags (default `--multipass` is fine)
- Order of operations within this phase (as long as formatting comes before hook renaming)
- Whether to create `.editorconfig` alongside `.prettierrc`
- Exact `tsconfig.base.json` settings beyond the ones listed

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HYGN-01 | Python .venv directory removed from git tracking and added to .gitignore | D-01: `git rm -r --cached` procedure verified; 3,306 tracked files confirmed in git |
| HYGN-02 | SVG assets optimized with SVGO (1MB -> ~30KB) and root duplicates removed | D-02: svgo not installed on host — must use `npx svgo`; target SVGs identified at root and in apps |
| HYGN-03 | `packages/ui` audited — removed if unused, documented if used | D-03: source grep confirms NO source-file imports of `@broto/ui` anywhere in `apps/`; only `apps/web/package.json` dep entry remains |
| HYGN-04 | Unnecessary re-export files (`lib/types/questions.ts`) eliminated — apps import directly from `@broto/shared` | D-04: both files confirmed to be `export * from '@broto/shared'`; 4 mobile callers and 5 web callers identified |
| TOOL-01 | Root `tsconfig.base.json` created and extended by all apps/packages | D-10: web and admin tsconfigs are near-identical; mobile extends `expo/tsconfig.base`; base config extractable |
| TOOL-02 | Shared Prettier config enforced across all apps (single quotes, no semicolons, consistent trailing commas) | D-05/D-06: `.prettierrc` already exists with correct settings; mobile code not yet formatted against it |
| TOOL-03 | Prettier format glob includes mobile source directories (`app/`, `hooks/`, `lib/`, `components/`) | D-07: current glob `apps/*/src/**` misses all mobile paths; verified mobile uses `apps/mobile/app/` not `src/` |
| TOOL-04 | Formatting applied as atomic commit with hash added to `.git-blame-ignore-revs` | D-08: `.git-blame-ignore-revs` file does not exist yet — must be created |
| TOOL-05 | ESLint `no-restricted-imports` rule prevents `packages/shared` from importing `react` | D-12: flat config block with `files: ['packages/shared/src/**']` pattern; eslint.config.mjs already supports this |
| TOOL-06 | ESLint `no-floating-promises` rule enabled across all apps | D-13: rule not currently in eslint.config.mjs; requires `parserOptions.project` to work with typescript-eslint |
| TOOL-07 | Hook file naming standardized (camelCase across all apps) | D-09: 6 mobile hooks in kebab-case confirmed; all callers must be updated before rename |
| SECR-01 | CORS in edge functions fails closed — rejects non-whitelisted origins instead of defaulting to `*` | D-15: current logic confirmed to default to `*` when ALLOWED_ORIGINS is empty; fix is surgical |
| SECR-02 | CORS logic extracted to shared utility used by all edge functions | D-16: `supabase/functions/_shared/` directory does NOT exist yet — must be created; 6 functions each have inline CORS |
</phase_requirements>

---

## Summary

Phase 1 is purely tooling and hygiene work — no business logic changes. The codebase has accumulated debt across three areas: repo pollution (3,306 Python `.venv` files tracked in git, unoptimized SVGs, dead `packages/ui`), formatting/tooling inconsistency (mobile uses double quotes and semicolons while web uses single quotes and no semicolons, ESLint missing two important rules, no shared tsconfig base), and CORS permissiveness (all 6 edge functions default to `*` when `ALLOWED_ORIGINS` is unset).

All locked decisions (D-01 through D-17) are verified against the actual codebase. Every piece of infrastructure already exists in a form that makes the changes straightforward: `.prettierrc` already has the right settings (mobile just wasn't formatted against it), `eslint.config.mjs` is already ESLint 9 flat config (just needs two new rule blocks), the edge functions already have identical inline CORS blocks (just needs extraction). The work is systematic, not exploratory.

**Primary recommendation:** Execute in dependency order — hygiene first (git, SVGs, dead code), then tooling configuration (tsconfig, Prettier fix, ESLint rules), then format commit, then hook renaming, then CORS extraction. Formatting must precede hook renaming to avoid merge conflicts.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prettier | ^3.8.1 (already installed) | Code formatter | Already in root devDependencies — no install needed |
| ESLint | ^9.28.0 (already installed) | Linter | Already in root devDependencies — flat config at eslint.config.mjs |
| typescript-eslint | ^8.57.1 (already installed) | TypeScript ESLint rules | Already present — provides `no-floating-promises` rule |
| SVGO | CLI via `npx svgo` | SVG optimization | Standard SVG optimizer; not installed globally — use npx |
| git | system | Untrack cached files | Standard — `git rm -r --cached` removes from tracking without deleting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@typescript-eslint/eslint-plugin` | ^8.57.1 (via typescript-eslint) | `no-floating-promises` rule | Already bundled — no separate install |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npx svgo` | `svgo` global install | npx is zero-install; global install is faster for repeated runs but overkill for a one-time optimization pass |
| `git rm -r --cached` | `git filter-branch` or BFG | Decisions explicitly locked against filter-branch; `--cached` is correct — removes tracking without deleting files |

**Installation:** No new installs required. All tooling is already in `package.json`. SVGO runs via `npx svgo`.

---

## Architecture Patterns

### Recommended Project Structure (after Phase 1)

```
/
├── tsconfig.base.json          # NEW — shared compilerOptions (strict, ES2020, etc.)
├── .prettierrc                 # EXISTING — no change needed
├── .git-blame-ignore-revs      # NEW — format commit hash registered here
├── eslint.config.mjs           # MODIFIED — two new rule blocks added
├── .gitignore                  # MODIFIED — .venv/ and __pycache__/ added
├── package.json                # MODIFIED — format script glob expanded
│
├── apps/
│   ├── mobile/
│   │   ├── tsconfig.json       # MODIFIED — extends ../../tsconfig.base.json
│   │   └── hooks/
│   │       ├── useAuth.ts      # RENAMED from use-auth.ts
│   │       ├── usePet.ts       # RENAMED from use-pet.ts
│   │       ├── useProgress.ts  # RENAMED from use-progress.ts
│   │       ├── useUser.ts      # RENAMED from use-user.ts
│   │       ├── useClass.ts     # RENAMED from use-class.ts
│   │       ├── useQuestionsFilters.ts  # RENAMED from use-questions-filters.ts
│   │       └── createCachedHook.ts     # RENAMED from create-cached-hook.ts
│   ├── web/
│   │   └── tsconfig.json       # MODIFIED — extends ../../tsconfig.base.json
│   └── admin/
│       └── tsconfig.json       # MODIFIED — extends ../../tsconfig.base.json
│
├── packages/
│   ├── shared/
│   │   └── tsconfig.json       # MODIFIED — extends ../../tsconfig.base.json
│   └── ui/                     # REMOVED (if no imports found) or package.json description added
│
└── supabase/
    └── functions/
        ├── _shared/
        │   └── cors.ts         # NEW — extracted CORS utility (Deno-compatible)
        ├── broto-chat/index.ts # MODIFIED — imports from ../_shared/cors.ts
        ├── user-me/index.ts    # MODIFIED — imports from ../_shared/cors.ts
        ├── pet-me/index.ts     # MODIFIED — imports from ../_shared/cors.ts
        ├── user-progress/index.ts  # MODIFIED
        ├── class-join/index.ts     # MODIFIED
        └── material-index/index.ts # MODIFIED
```

### Pattern 1: CORS Shared Utility (Deno)

**What:** Extract the duplicated `getCorsHeaders` + `json` helpers from all 6 edge functions into a single `_shared/cors.ts`.

**When to use:** Always — Deno edge functions use relative ESM imports within `supabase/functions/`.

**Current state (per-function, all 6 have this verbatim):**
```typescript
// In every supabase/functions/*/index.ts (CURRENT — to be replaced)
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean)

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || '*'           // BUG: defaults to '*' when env var is unset
      : ALLOWED_ORIGINS[0]
  return { ... }
}
```

**Target `supabase/functions/_shared/cors.ts` (SECR-01 + SECR-02):**
```typescript
// Source: Direct codebase inspection — extracted from all 6 functions
// Note: Deno-compatible — no Node.js imports

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean)

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''

  // SECR-01: fail closed — if no origins configured, reject all (return empty origin = blocked)
  if (ALLOWED_ORIGINS.length === 0) {
    return {
      'Access-Control-Allow-Origin': '',   // no origin = browser will block
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    // Return 403-ready headers — the caller checks this and returns 403
    return { __blocked: 'true' } as Record<string, string>
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}

export function isOriginBlocked(corsHeaders: Record<string, string>): boolean {
  return corsHeaders.__blocked === 'true'
}

export function json(status: number, body: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}
```

**Updated function handler entry pattern:**
```typescript
// In each supabase/functions/*/index.ts
import { getCorsHeaders, isOriginBlocked, json } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    if (isOriginBlocked(cors)) return new Response(null, { status: 403 })
    return new Response('ok', { headers: cors })
  }

  if (isOriginBlocked(cors)) return json(403, { error: 'Origin not allowed' }, {})

  // ... rest of handler unchanged
})
```

### Pattern 2: ESLint Flat Config — Two New Rule Blocks

**What:** Add two new config blocks to the existing `eslint.config.mjs` without touching existing rules.

**Example:**
```javascript
// Source: Direct codebase inspection of eslint.config.mjs — extend, don't replace
export default tseslint.config(
  // ... existing blocks unchanged ...

  // NEW BLOCK 1: packages/shared platform-agnostic boundary guard (TOOL-05, D-12)
  {
    files: ['packages/shared/src/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-native', 'expo*', '@react-native*'],
              message:
                'packages/shared must remain platform-agnostic — use adapter pattern for platform APIs',
            },
          ],
        },
      ],
    },
  },

  // NEW BLOCK 2: no-floating-promises across all app code (TOOL-06, D-13)
  {
    files: ['apps/*/src/**/*.{ts,tsx}', 'apps/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
)
```

**Critical note on `no-floating-promises`:** This rule requires type information (`project: true` in `parserOptions`). Adding it without `project: true` causes the rule to silently not fire. The `parserOptions.project: true` tells typescript-eslint to use the nearest `tsconfig.json` for each file. Since each app has its own `tsconfig.json`, `tsconfigRootDir: import.meta.dirname` (monorepo root) is correct.

### Pattern 3: `tsconfig.base.json` at Root

**What:** Extract common `compilerOptions` duplicated across `apps/web/tsconfig.json` and `apps/admin/tsconfig.json` (near-identical today).

**Target `tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "esModuleInterop": true
  }
}
```

**`apps/web/tsconfig.json` after:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "useDefineForClassFields": true,
    "allowImportingTsExtensions": true,
    "jsx": "react-jsx",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

**Mobile note:** `apps/mobile/tsconfig.json` already extends `expo/tsconfig.base`. For mobile, extend BOTH:
- Option A: mobile extends `../../tsconfig.base.json` directly and merges expo settings manually
- Option B: mobile keeps extending `expo/tsconfig.base` and separately adds a reference to the base

The cleanest approach for mobile: extend the root base, add `"overrides"` for expo-specific settings. The expo base is primarily for JSX/react-native transform settings — these can be retained in the mobile tsconfig as overrides.

**Simpler mobile approach (recommended):**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2020"],
    "jsx": "react-native",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts", "svg.d.ts"]
}
```

**packages/shared note:** Currently has `"outDir": "./dist"` and `"declaration": true` because it was set up for compilation. Decision D-11 says no project references, and the source-first pattern (`"main": "./src/index.ts"`) is already in use. The shared tsconfig can extend the base but keep its own `outDir`/`declaration` settings (they are used if someone runs `tsc` on shared directly but don't affect runtime imports).

### Pattern 4: Prettier Glob Fix

**What:** Expand the `format` and `format:check` scripts in root `package.json` to include mobile source paths.

**Current (misses mobile):**
```json
"format": "prettier --write \"apps/*/src/**/*.{ts,tsx}\" \"packages/*/src/**/*.{ts,tsx}\" \"supabase/functions/**/*.ts\""
```

**Fixed (D-07):**
```json
"format": "prettier --write \"apps/*/src/**/*.{ts,tsx}\" \"apps/mobile/{app,hooks,lib,components,contexts,theme}/**/*.{ts,tsx}\" \"packages/*/src/**/*.{ts,tsx}\" \"supabase/functions/**/*.ts\""
```

Apply the same fix to `format:check`.

### Pattern 5: `.git-blame-ignore-revs` File

**What:** Git supports a `.git-blame-ignore-revs` file that `git blame` uses to skip non-semantic commits (formatting changes).

**Create at repo root:**
```
# .git-blame-ignore-revs
# Formatting-only commits — skip these when running git blame
# See: https://git-scm.com/docs/git-blame#Documentation/git-blame.txt---ignore-revs-fileltfilegt
<COMMIT_HASH_OF_FORMAT_COMMIT>
```

**To activate for all developers automatically** (optional but recommended):
```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### Anti-Patterns to Avoid

- **Running format AND logic in the same commit:** The format commit must be isolated — zero logic changes — or git blame becomes unusable.
- **Renaming hooks before running format:** If hooks are renamed first, the format step will then touch the newly renamed files, making it harder to verify the rename was clean.
- **Adding CORS logic per-function after extracting to `_shared`:** Once `_shared/cors.ts` exists, all functions must import from it. No new inline CORS blocks.
- **Using `ALLOWED_ORIGINS[0]` as fallback for non-whitelisted origins:** Current code sends the first allowed origin instead of blocking — this silently allows the request from the wrong origin's perspective and breaks browser CORS preflight (the browser checks if the reflected origin matches its own).
- **Adding `project: true` to parserOptions globally:** Slows lint by requiring full TypeScript program build. Scope it only to the `no-floating-promises` rule block using a `files` filter.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG optimization | Custom minify script | `npx svgo --multipass` | SVGO handles all edge cases: paths, viewBoxes, transforms, embedded styles, SMIL |
| Prettier glob expansion | New format script per-app | Extend existing glob pattern in root `package.json` | Single script, single truth |
| CORS utility for Deno | Complex middleware | Simple exported function in `_shared/cors.ts` | Deno supports relative ESM imports natively |
| git-blame attribution fix | Nothing | `.git-blame-ignore-revs` file | Native git feature, zero maintenance |

**Key insight:** Every tool in this phase already exists in the repo or is one `npx` invocation away. The work is configuration and cleanup, not new tooling.

---

## Common Pitfalls

### Pitfall 1: Prettier Glob Misses Mobile (VERIFIED IN THIS REPO)

**What goes wrong:** `npm run format` reports zero violations on mobile files even though they have double quotes and semicolons. The format commit appears to succeed but mobile is not reformatted.

**Why it happens:** Root `package.json` `format` script targets `apps/*/src/**` — mobile uses `apps/mobile/app/` not `apps/mobile/src/`. This is the current state of the repo.

**How to avoid:** Fix the glob first (D-07), then verify with `npm run format:check` — it must show violations in mobile files before the format commit. If `format:check` exits 0 on mobile files, the glob is still wrong.

**Warning signs:** `format:check` exits 0 on `apps/mobile/hooks/use-auth.ts` (a file with double quotes).

### Pitfall 2: Hook Rename Before Format Creates Two-Step Diff

**What goes wrong:** If hook files are renamed (`use-auth.ts` → `useAuth.ts`) before the format commit, git sees a rename + content change in a single commit. The format commit is no longer purely formatting — it mixes rename history with style changes.

**Why it happens:** Natural tendency to "do both at once."

**How to avoid:** Locked by decision D-08/D-09 — format commit first, hook rename second. Never combine them.

**Warning signs:** A commit that contains both renamed files AND content changes (quotes/semicolons).

### Pitfall 3: `no-floating-promises` Without `parserOptions.project` Silently Does Nothing

**What goes wrong:** The rule is added to `eslint.config.mjs` but reports zero violations even on obviously unawaited promises.

**Why it happens:** `@typescript-eslint/no-floating-promises` requires type information to detect `Promise` return types. Without `parserOptions: { project: true }`, typescript-eslint runs in syntax-only mode and cannot evaluate types.

**How to avoid:** Always pair `no-floating-promises` with `parserOptions: { project: true, tsconfigRootDir: import.meta.dirname }` in the same config block.

**Warning signs:** After adding the rule, running `npm run lint` shows 0 errors on a file that contains `someAsyncFunction()` without `await`.

### Pitfall 4: CORS `__blocked` Marker Leaks Into Response Headers

**What goes wrong:** The `__blocked: 'true'` marker in the CORS headers object accidentally gets spread into the HTTP response headers.

**Why it happens:** The `json()` helper spreads `...cors` into response headers. If the cors object contains `__blocked`, it becomes a response header.

**How to avoid:** Use `isOriginBlocked()` before passing `cors` to `json()`. When origin is blocked, pass empty `{}` to `json()` — not the blocked headers object. Or strip `__blocked` from the spread in the `json()` helper.

**Better approach for SECR-01:** Return a 403 directly from the handler before calling `json()` at all:
```typescript
if (isOriginBlocked(cors)) {
  return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 })
}
```

### Pitfall 5: `packages/ui` Has Declared Dependency in `apps/web/package.json`

**What goes wrong:** Deleting `packages/ui/` directory causes `npm install` to fail because `apps/web/package.json` lists `"@broto/ui": "*"` as a dependency. Even if no source file imports it, npm workspace resolution will error on a missing package.

**Why it happens:** D-03 requires checking source imports FIRST, then removing the dependency entry from `package.json`, THEN removing the directory.

**How to avoid:** Confirmed via current investigation: `grep -r "@broto/ui" apps/web/src/` returns NO matches. The package is declared as a dep but never imported. Correct order: (1) remove `"@broto/ui": "*"` from `apps/web/package.json`, (2) run `npm install` to update lockfile, (3) remove `packages/ui/` directory.

### Pitfall 6: SVG Assets — Root Files vs App-Directory Files Are Different Variants

**What goes wrong:** Removing "root-level duplicates" without checking if the files are exactly the same causes loss of the correct variant.

**Why it happens:** `new_logo.svg` at root may differ from `apps/web/public/new_logo.svg` in size or format (different export settings from design tool).

**How to avoid:** Before removing root SVGs, diff them against their app counterparts. If they are identical (or the root file is the unoptimized original), remove root after optimizing the app copies. Mobile uses `apps/mobile/assets/new-logo-icon.svg` (note: hyphen, not underscore) — verify the filename matches before removing.

**Current asset inventory:**
- Root: `2.svg`, `new_logo.svg`, `new_logo_icon.svg`
- Mobile assets: `new-logo-icon.svg` (hyphen variant)
- Web public: `new_logo.svg` (verified in `apps/web/public/`)
- Root also has: `Edtech_Brand_Identity_*.png` (4.7MB) — NOT targeted by D-02 but noted as dead asset

### Pitfall 7: Mobile tsconfig Breaks Expo if Expo Base Is Dropped Entirely

**What goes wrong:** Mobile currently extends `expo/tsconfig.base`. If replaced entirely by `../../tsconfig.base.json`, Expo-specific settings like `resolveJsonModule`, `allowSyntheticDefaultImports`, and the NativeWind type setup may be lost.

**Why it happens:** `expo/tsconfig.base` sets several React Native-specific compiler options that are easy to miss when copying over.

**How to avoid:** When creating `apps/mobile/tsconfig.json`, preserve: `"allowSyntheticDefaultImports": true`, `"resolveJsonModule": true`, and the full `include` array including `nativewind-env.d.ts` and `svg.d.ts`. Run `npx tsc --noEmit` in `apps/mobile/` after the change to verify.

---

## Code Examples

### Verified Current State: Edge Function CORS (all 6 functions have this)

```typescript
// Source: Direct inspection of supabase/functions/broto-chat/index.ts and user-me/index.ts
// CURRENT BUG — defaults to '*' when ALLOWED_ORIGINS is empty
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean)

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || '*'       // <- when ALLOWED_ORIGINS is empty, this is '*'
      : ALLOWED_ORIGINS[0]  // <- wrong: sends first allowed origin to non-allowed caller
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // varies by function
  }
}
```

### Verified Current State: ESLint config (no floating-promises, no shared restriction)

```javascript
// Source: Direct inspection of /eslint.config.mjs
export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**', '**/build/**', 'supabase/services/**/.*/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
)
// MISSING: no-restricted-imports for packages/shared
// MISSING: no-floating-promises for all apps
```

### Verified: Mobile hooks to rename (D-09)

```
Current (kebab-case)       →  Target (camelCase)
use-auth.ts                →  useAuth.ts
use-class.ts               →  useClass.ts
use-pet.ts                 →  usePet.ts
use-progress.ts            →  useProgress.ts
use-questions-filters.ts   →  useQuestionsFilters.ts
use-user.ts                →  useUser.ts
create-cached-hook.ts      →  createCachedHook.ts  (lib infrastructure, same convention)
```

All 6 hook files confirmed in `/apps/mobile/hooks/`. Import update required in callers:
- `app/enem-questions.tsx` imports from `@/hooks/use-questions-filters` (confirmed)
- `hooks/use-questions-filters.ts` may import from sibling hooks
- Any file importing `@/hooks/use-auth`, `@/hooks/use-pet`, etc.

### Verified: Re-export files to remove (D-04)

```typescript
// apps/mobile/lib/types/questions.ts — CURRENT (remove this file)
export * from '@broto/shared'

// apps/web/src/lib/types/questions.ts — CURRENT (remove this file)
export * from '@broto/shared'
```

After removal, update all callers to import from `@broto/shared` directly:
- Mobile callers (3 files confirmed): `app/enem-questions.tsx`, `components/questions/QuestionPlayer.tsx`, `hooks/use-questions-filters.ts`
- Web callers (3 files confirmed): `components/questions/FilterPanel.tsx`, `components/questions/AreaSelector.tsx`, `components/questions/QuestionPlayer.tsx`, `hooks/useQuestionsFilters.ts`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint `.eslintrc.json` / `.eslintrc.js` | ESLint 9 flat config `eslint.config.mjs` | ESLint 9 (late 2023) | File-scoped rules via `files:` array — enables TOOL-05 approach |
| Per-app Prettier configs | Single root `.prettierrc` | Already correct in this repo | Root config applies to all workspaces |
| TypeScript project references for monorepos | Source-first packages + `tsconfig.base.json` extends | — | Simpler, no compilation step, correct for this monorepo |

**Deprecated/outdated:**
- Per-function CORS inline duplication: to be replaced by `_shared/cors.ts` import
- Mobile kebab-case hook filenames: being standardized to camelCase per D-09

---

## Open Questions

1. **CORS `_shared/` Deno import path format**
   - What we know: Deno edge functions use relative ESM imports. `supabase/functions/user-me/index.ts` imports from `https://deno.land/...` and `https://esm.sh/...`.
   - What's unclear: Whether the relative path `'../_shared/cors.ts'` works in the Supabase-hosted Deno environment or requires an explicit `file://` prefix.
   - Recommendation: Use `'../_shared/cors.ts'` (relative path without file prefix). This is the documented pattern for Supabase Edge Function shared utilities per Supabase's own docs. If this fails in deployment, fall back to absolute `https://` URL pattern — but local paths should work in the hosted Deno runtime.
   - Confidence: MEDIUM — verified as the recommended pattern in Supabase docs, but not tested against this specific repo's Deno version (`https://deno.land/std@0.168.0/` is pinned).

2. **`packages/ui` removal — does `npm install` need to run after dep removal?**
   - What we know: `apps/web/package.json` lists `"@broto/ui": "*"`. Workspace packages are resolved at install time.
   - What's unclear: Whether the package-lock.json needs to be regenerated after removing the dep + directory.
   - Recommendation: After removing `"@broto/ui": "*"` from `apps/web/package.json` and before deleting the directory, run `npm install` from the root to update the lockfile. Then delete the directory. Then run `npm install` once more to confirm clean state.

3. **Mobile tsconfig — `expo/tsconfig.base` vs root base compatibility**
   - What we know: Mobile currently `"extends": "expo/tsconfig.base"`. The expo base sets React Native-specific options.
   - Recommendation: Keep mobile extending `expo/tsconfig.base` AND add a second extend from the root. TypeScript supports chained extends (`"extends": ["expo/tsconfig.base", "../../tsconfig.base.json"]`) in TS 5.x. Since the project already uses TypeScript ^5.4.0, this is valid. Root base settings that conflict with expo base will be overridden by the last `extends` entry or by the file's own `compilerOptions`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm scripts, npx | YES | v24.10.0 | — |
| npm | package management | YES | 11.6.0 | — |
| git | HYGN-01 (`git rm --cached`) | YES (system) | — | — |
| svgo CLI | HYGN-02 | NO (not installed) | — | `npx svgo` (downloads on first run) |
| prettier | TOOL-02, TOOL-03 | YES (root devDep) | ^3.8.1 | — |
| eslint | TOOL-05, TOOL-06 | YES (root devDep) | ^9.28.0 | — |
| typescript-eslint | TOOL-05, TOOL-06 | YES (root devDep) | ^8.57.1 | — |

**Missing dependencies with no fallback:** None — all required tooling is present.

**Missing dependencies with fallback:** `svgo` is not globally installed; `npx svgo` downloads it on first use. No action required before execution.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `/eslint.config.mjs` — current rules, missing rules confirmed
- Direct inspection of `/.prettierrc` — settings confirmed correct, glob problem confirmed
- Direct inspection of `/package.json` — format script glob confirmed missing mobile paths
- Direct inspection of `supabase/functions/broto-chat/index.ts` and `user-me/index.ts` — CORS bug confirmed in both; `_shared/` directory confirmed non-existent
- Direct inspection of `apps/mobile/hooks/` directory listing — all 7 kebab-case filenames confirmed
- Direct inspection of `apps/mobile/lib/types/questions.ts` and `apps/web/src/lib/types/questions.ts` — both confirmed as `export * from '@broto/shared'`
- `git ls-files | grep .venv` — 3,306 tracked files confirmed
- Direct inspection of `apps/web/package.json` — `@broto/ui` dep confirmed
- `grep -r "@broto/ui" apps/web/src/` — zero matches confirmed (no source imports)
- Direct inspection of `apps/mobile/tsconfig.json`, `apps/web/tsconfig.json`, `apps/admin/tsconfig.json` — duplication confirmed, base extract viable
- `.planning/codebase/CRITICAL-ANALYSIS.md` — full health analysis
- `.planning/codebase/CONVENTIONS.md` — naming patterns and formatting inconsistencies
- `.planning/research/PITFALLS.md` — Pitfall #4 (git blame), #5 (dead code), #9 (Prettier glob)
- `.planning/research/STACK.md` — ESLint flat config pattern, source-first packages
- `1-CONTEXT.md` — all locked decisions D-01 through D-17

### Secondary (MEDIUM confidence)

- Supabase Edge Functions `_shared/` pattern: documented as recommended approach for shared utilities in Supabase Edge Functions (relative ESM import path)
- TypeScript 5.x multiple `extends` array: documented in TypeScript 5.0 release notes

---

## Metadata

**Confidence breakdown:**
- Repo hygiene tasks (HYGN-01 to HYGN-04): HIGH — all file states directly verified
- Tooling config (TOOL-01 to TOOL-07): HIGH — all current tsconfig/eslint/prettier states directly inspected
- CORS hardening (SECR-01, SECR-02): HIGH — all 6 edge functions inspected; bug confirmed; `_shared/` directory absence confirmed
- Deno relative import path format: MEDIUM — pattern is documented but not tested against this repo's exact Deno version

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable tooling; no fast-moving dependencies in scope)
