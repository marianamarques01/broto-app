# Phase 1: Tooling, Hygiene & Security - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-resolved (all gray areas resolved with recommended choices)

<domain>
## Phase Boundary

Establish guardrails, kill dead code, fix CORS, format everything. The repo must be clean, consistent, and guarded against future violations before any logic moves happen in Phase 3. No business logic changes — only tooling, formatting, cleanup, and security hardening.

Requirements: HYGN-01, HYGN-02, HYGN-03, HYGN-04, TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, SECR-01, SECR-02

</domain>

<decisions>
## Implementation Decisions

### Dead Code & Repo Hygiene

- **D-01:** Remove `.venv/` and `__pycache__/` from git with `git rm -r --cached`, add both to `.gitignore`. Do NOT use `git filter-branch` — the history rewrite is not worth the risk for this milestone.
- **D-02:** Optimize SVGs using SVGO CLI (`npx svgo`). Target files: `2.svg`, `new_logo.svg`, `new_logo_icon.svg` at root, plus duplicates in `apps/web/public/` and `apps/mobile/assets/`. Remove root-level duplicates that also exist in app directories.
- **D-03:** For `packages/ui` — first `grep -r "@broto/ui" apps/` to check if any app imports it. If `apps/web/package.json` declares it as dependency but no source files import from it, remove the dependency entry. If truly no imports anywhere, remove the entire package directory. If imports exist, add a `"description"` field to its `package.json` explaining purpose.
- **D-04:** Remove `apps/mobile/lib/types/questions.ts` and `apps/web/src/lib/types/questions.ts` — update imports to use `@broto/shared` directly.

### Formatting & Code Style

- **D-05:** Standardize on web/admin conventions: single quotes, no semicolons, trailing commas. Mobile is the outlier that gets reformatted.
- **D-06:** Create root `.prettierrc` with shared config. All apps extend it (no per-app overrides).
- **D-07:** Fix Prettier glob in root `package.json` to include mobile paths: `"apps/mobile/{app,hooks,lib,components,contexts,theme}/**/*.{ts,tsx}"` in addition to `"apps/*/src/**/*.{ts,tsx}"`.
- **D-08:** Format commit must be a single atomic commit. Immediately after, add the commit hash to `.git-blame-ignore-revs` in a separate commit.
- **D-09:** Hook file renaming: rename mobile hooks from kebab-case to camelCase (`use-pet.ts` -> `usePet.ts`, `use-auth.ts` -> `useAuth.ts`, etc.). Update all imports referencing old names.

### TypeScript Configuration

- **D-10:** Create root `tsconfig.base.json` with shared `compilerOptions` (strict, target, module, jsx settings). Each app's `tsconfig.json` extends it via `"extends": "../../tsconfig.base.json"`, adding only app-specific paths/includes.
- **D-11:** Do NOT add TypeScript project references — the codebase uses source-first packages (no compilation step), and project references would add unnecessary complexity.

### ESLint Guards

- **D-12:** Add `no-restricted-imports` rule scoped to `packages/shared/src/**` that blocks `react`, `react-native`, `expo-*`, and any platform-specific module. Error message: "packages/shared must remain platform-agnostic — use adapter pattern for platform APIs".
- **D-13:** Enable `@typescript-eslint/no-floating-promises` rule with `"error"` severity across all apps. This MUST be in place before Phase 3's async adapter migrations.
- **D-14:** Use ESLint 9 flat config with file-scoped rules — the `eslint.config.mjs` at root already exists. Add shared package restrictions as a new config block.

### CORS Hardening

- **D-15:** In all Supabase edge functions, change CORS default behavior: if `ALLOWED_ORIGINS` env var is empty or unset, reject with 403 instead of defaulting to `*`. Only allow origins explicitly listed.
- **D-16:** Extract CORS logic into `supabase/functions/_shared/cors.ts` utility. All edge functions import from there instead of duplicating the CORS block.
- **D-17:** Keep existing `ALLOWED_ORIGINS` env var pattern (comma-separated string) — no schema change needed.

### Claude's Discretion
- Exact SVGO configuration flags (default `--multipass` is fine)
- Order of operations within this phase (as long as formatting comes before hook renaming)
- Whether to create `.editorconfig` alongside `.prettierrc`
- Exact `tsconfig.base.json` settings beyond the ones listed

</decisions>

<specifics>
## Specific Ideas

- The formatting commit will touch many files — keep it completely isolated so git blame remains useful via `.git-blame-ignore-revs`
- Hook renaming (D-09) should happen AFTER formatting (D-08) to avoid merge conflicts between the two changes
- CORS shared utility (D-16) follows the same pattern as the existing `supabase/functions/_shared/` directory convention

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Codebase analysis (for understanding current state)
- `.planning/codebase/CRITICAL-ANALYSIS.md` — Full analysis of inconsistencies, duplication, fragility
- `.planning/codebase/CONVENTIONS.md` — Current code conventions across apps
- `.planning/codebase/CONCERNS.md` — Technical debt and concerns inventory
- `.planning/codebase/STACK.md` — Current technology stack details

### Research findings
- `.planning/research/PITFALLS.md` — Pitfall #5: Prettier glob misses mobile; Pitfall #8: packages/ui dependency
- `.planning/research/STACK.md` — Tooling recommendations for monorepo consolidation
- `.planning/research/ARCHITECTURE.md` — Build order and package structure guidance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eslint.config.mjs` at root — existing ESLint 9 flat config, extend with new rules
- `supabase/functions/_shared/` — existing shared directory convention for edge functions, add `cors.ts` here
- Root `package.json` has `format` script — needs glob fix but pattern is established

### Established Patterns
- Source-first packages (`"main": "./src/index.ts"` in `packages/shared`) — no build step, just import directly
- Turborepo `dependsOn: ["^build"]` handles build ordering — no changes needed
- Edge functions already have inline CORS blocks (5+ functions) — extract, don't reinvent

### Integration Points
- `.prettierrc` at root will be picked up by all apps automatically
- `tsconfig.base.json` extends must use relative paths (`../../tsconfig.base.json`)
- ESLint flat config scoping uses `files: ["packages/shared/src/**"]` pattern
- CORS utility in `_shared/cors.ts` must use Deno-compatible imports (no Node.js modules)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-tooling-hygiene-security*
*Context gathered: 2026-04-02*
