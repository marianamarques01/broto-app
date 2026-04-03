---
phase: 01-tooling-hygiene-security
verified: 2026-04-03T02:51:45Z
status: gaps_found
score: 5/6 must-haves verified
gaps:
  - truth: "SVG assets are optimized with substantial size reduction and root duplicates removed"
    status: partial
    reason: "Root duplicates were removed, but app SVGs remain very large (723KB and 1.1MB), not meeting HYGN-02 expectation (~30KB class)."
    artifacts:
      - path: "apps/mobile/assets/new-logo-icon.svg"
        issue: "File size is 723KB"
      - path: "apps/web/public/new-logo-icon.svg"
        issue: "File size is 723KB"
      - path: "apps/web/public/new-logo.svg"
        issue: "File size is 1.1MB"
    missing:
      - "Run effective SVG optimization (or export simplification) to bring assets near target budget"
      - "Re-verify post-optimization sizes and keep app copies as single sources"
---

# Phase 01: Tooling, Hygiene & Security Verification Report

**Phase Goal:** The repo is clean, consistent, and guarded against future violations before any logic moves.
**Verified:** 2026-04-03T02:51:45Z
**Status:** gaps_found
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Python env is fully untracked from git | ✓ VERIFIED | `git ls-files | rg "\\.venv|__pycache__"` returned empty |
| 2 | SVG assets are optimized with substantial reduction and root duplicates removed | ✗ FAILED | Root duplicates removed, but current sizes are `723KB`, `723KB`, `1.1MB` |
| 3 | `packages/ui` is removed or justified and `@broto/ui` not required by web app | ✓ VERIFIED | `packages/ui` absent; `apps/web/package.json` has no `@broto/ui` |
| 4 | Shared TypeScript baseline and direct shared imports are in place | ✓ VERIFIED | `tsconfig.base.json` exists; all target tsconfigs extend it; no `lib/types/questions` references |
| 5 | Tooling guardrails are active (Prettier coverage, no-restricted-imports, no-floating-promises, hook naming) | ✓ VERIFIED | `npm run format:check` exits 0; ESLint rules present and firing; hooks are camelCase |
| 6 | Edge functions use centralized fail-closed CORS and block non-whitelisted origins | ✓ VERIFIED | `_shared/cors.ts` exists; 6 functions import it; all check `isOriginBlocked(cors)` and return 403 |

**Score:** 5/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `.gitignore` | Ignore `.venv/`, `__pycache__/` | ✓ VERIFIED | Entries present |
| `apps/mobile/assets/new-logo-icon.svg` | Optimized SVG in app dir | ⚠️ HOLLOW | Exists, but still 723KB |
| `apps/web/public/new-logo-icon.svg` | Optimized SVG in app dir | ⚠️ HOLLOW | Exists, but still 723KB |
| `apps/web/public/new-logo.svg` | Optimized SVG in app dir | ⚠️ HOLLOW | Exists, but still 1.1MB |
| `tsconfig.base.json` | Shared TS baseline | ✓ VERIFIED | Present with strict compiler options |
| `eslint.config.mjs` | `no-restricted-imports` + `no-floating-promises` | ✓ VERIFIED | Both rule blocks configured |
| `.git-blame-ignore-revs` | Format hash registered | ✓ VERIFIED | 40-char hash present |
| `apps/mobile/hooks/*` | CamelCase hook filenames | ✓ VERIFIED | `useAuth/usePet/useProgress/useUser/useClass/useQuestionsFilters/createCachedHook` |
| `supabase/functions/_shared/cors.ts` | Shared fail-closed CORS utility | ✓ VERIFIED | Exports `getCorsHeaders`, `isOriginBlocked`, `json` |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/web/package.json` | `packages/ui` | workspace dependency | ✓ WIRED | `@broto/ui` removed; `packages/ui` removed |
| App imports | `@broto/shared` | direct type imports | ✓ WIRED | No `lib/types/questions` references remain |
| `eslint.config.mjs` | `packages/shared/src/**` | `no-restricted-imports` scoped block | ✓ WIRED | Rule present; stdin lint test with `import React` fails as expected |
| `eslint.config.mjs` | app TS/TSX files | `no-floating-promises` + `parserOptions.project` | ✓ WIRED | `npm run lint` reports multiple `@typescript-eslint/no-floating-promises` errors |
| 6 edge functions | `_shared/cors.ts` | `from '../_shared/cors.ts'` | ✓ WIRED | Import present in all six function entry files |
| `getCorsHeaders()` | handler responses | `isOriginBlocked(cors)` checks | ✓ WIRED | OPTIONS path returns 403 when blocked; non-OPTIONS blocked returns `json(403, ...)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `supabase/functions/_shared/cors.ts` | `ALLOWED_ORIGINS` | `Deno.env.get('ALLOWED_ORIGINS')` | Yes (runtime env + request origin) | ✓ FLOWING |
| `supabase/functions/*/index.ts` | `cors` | `getCorsHeaders(req)` | Yes (passed to OPTIONS/JSON responses) | ✓ FLOWING |
| SVG assets in app dirs | file bytes | committed SVG files | No meaningful optimization delta | ⚠️ STATIC |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Python env untracked | `git ls-files | rg "\\.venv|__pycache__"` | Empty output | ✓ PASS |
| Formatting contract enforced | `npm run format:check` | `All matched files use Prettier code style!` | ✓ PASS |
| Shared boundary guard active | `printf "...import React..." \| npx eslint --stdin --stdin-filename packages/shared/src/__verify_no_restricted.ts` | `no-restricted-imports` error emitted | ✓ PASS |
| Floating promises guard active | `npm run lint \| rg "no-floating-promises|Parsing error"` | Multiple `no-floating-promises`; no parsing error shown | ✓ PASS |
| SVG optimization target | `ls -lh apps/web/public/new-logo.svg apps/web/public/new-logo-icon.svg apps/mobile/assets/new-logo-icon.svg` | `1.1M`, `723K`, `723K` | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| HYGN-01 | 01-01 | Untrack `.venv` and ignore Python cache | ✓ SATISFIED | `.gitignore` entries + empty `git ls-files` query |
| HYGN-02 | 01-01 | Optimize SVGs (~1MB -> ~30KB) + remove root duplicates | ✗ BLOCKED | Duplicates removed, but remaining app SVGs are still 723KB/1.1MB |
| HYGN-03 | 01-01 | Audit/remove `packages/ui` | ✓ SATISFIED | `packages/ui` absent and no `@broto/ui` in web package deps |
| HYGN-04 | 01-02 | Remove re-export `lib/types/questions.ts` files | ✓ SATISFIED | No `lib/types/questions` refs in `apps/` |
| TOOL-01 | 01-02 | Root `tsconfig.base.json` and extends | ✓ SATISFIED | Root file exists; web/admin/mobile/shared extend it |
| TOOL-02 | 01-03 | Shared Prettier config enforcement | ✓ SATISFIED | `format:check` script covers all scopes and passes |
| TOOL-03 | 01-03 | Prettier glob includes mobile dirs | ✓ SATISFIED | Script includes `apps/mobile/{app,hooks,lib,components,contexts,theme}` |
| TOOL-04 | 01-04 | Atomic format hash in blame ignore file | ✓ SATISFIED | `.git-blame-ignore-revs` contains 40-char hash |
| TOOL-05 | 01-03 | Block React imports in shared package | ✓ SATISFIED | ESLint scoped rule + runtime lint check fail for `import React` |
| TOOL-06 | 01-03 | Enable `no-floating-promises` | ✓ SATISFIED | Lint output shows active violations |
| TOOL-07 | 01-04 | CamelCase hook file naming | ✓ SATISFIED | Hook filenames and import references migrated |
| SECR-01 | 01-05 | Fail-closed CORS (no wildcard fallback) | ✓ SATISFIED | No `origin || '*'`; blocked-origin 403 branch in all functions |
| SECR-02 | 01-05 | Shared CORS utility across functions | ✓ SATISFIED | `_shared/cors.ts` imported by all 6 edge functions |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/mobile/hooks/useQuestionsFilters.ts` | 15 | Empty option value (`{ value: '', ... }`) | ℹ️ Info | Intentional UI filter default, not phase blocker |

### Human Verification Required

### 1. CORS runtime behavior in deployed environment

**Test:** Call one edge function from an allowed origin and from a non-whitelisted origin.
**Expected:** Allowed origin receives normal CORS headers; blocked origin receives 403 and no permissive fallback.
**Why human:** Static verification confirms wiring; end-to-end browser/CORS behavior depends on runtime env (`ALLOWED_ORIGINS`) and deployment context.

### Gaps Summary

A fase atingiu os guardrails centrais de tooling e segurança (lint/prettier/tsconfig/cors), mas não atingiu integralmente o objetivo de higiene de assets do requisito `HYGN-02`: os SVGs principais continuam com tamanho muito alto, sem evidência de redução significativa. Enquanto esse ponto não for corrigido, o objetivo da fase fica parcialmente atendido.

---

_Verified: 2026-04-03T02:51:45Z_  
_Verifier: Claude (gsd-verifier)_
