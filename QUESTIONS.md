# QUESTIONS.md - Comprehensive Code Review

> **Reviewed by:** Claude (Tech Lead / Code Reviewer)
> **Date:** 2026-03-22
> **Branch:** `feat/refactor`
> **Scope:** Full codebase (mobile, web, admin, backend, shared packages, docs)

Each question below is an independent item. Please answer inline (below each question) explaining what should be done, whether it's a bug or intended behavior, and priority level.

---

## A. ARCHITECTURE & PROJECT DIRECTION

### A1. White-Label vs. Institutional Multi-Tenancy
`transicao-white-label.md` describes a `tenants` table with per-tenant config (mascot names, colors, features) — a true white-label architecture. However, Phase 0 implemented `organizations` + `classes` instead, which is institutional (school-based) multi-tenancy. These are fundamentally different business models.
**Which direction is the product going?** Should we keep the current org/class model and retire the white-label doc, or is the tenant-based white-label still planned?

**Answer:** **Product direction: white-label, multi-tenant by organization.** Each customer (prep course, university, network, etc.) should be able to ship **their own identity** — name, colors, mascot, feature flags — and eventually configuration suited to their business (public exams, undergraduate, ENEM, etc.).

**What exists today:** **`organizations` + `classes`** is the **first working slice** and doubles as a **demo / test harness**: we simulate a **school-like** setup (classes, students, teachers, materials) for ENEM study. That validates real flows without requiring the full `tenants` + per-tenant config layer upfront.

**Documentation:** **Do not retire** `transicao-white-label.md` as the vision — it remains the **reference architecture**. The implemented model is **aligned in spirit** (isolation and branding per org via `organizations.config`); the evolution is to **formalize** the tenant + config model and naming from that doc on top of what already runs.

**Decision:** Keep **org/class** as the current operational basis; **plan explicit convergence** to the tenants + config approach in `transicao-white-label.md` in future phases; **keep the white-label doc** as the north star, not as deprecated.

---

### A2. Outdated Documentation vs. Implementation
Several docs reference a `profiles` table, a `questions` DB table, and a `topics` DB table. The actual implementation uses `users` (not `profiles`), stores questions as JSON in Supabase Storage, and has no `topics` table. `db.md` also has inconsistencies.
**Should we update all docs to reflect the current schema, or are some of those tables planned for future phases?**

**Answer:** **Yes — align all docs with the codebase.** **Canonical source of truth:** `supabase/migrations/*.sql`. The hosted Supabase project may diverge; if it does, prefer **migrations + `supabase db diff`** over narrative docs. `docs/db.md` already warns it can be stale — **priority:** fix inconsistencies or label sections as **snapshot vs. migration-current**.

**Current state (as implemented):**

- **Student profile:** `public.users` (FK to `auth.users`). There is **no** `public.profiles` table in the foundation migration — `20260317_foundation_organizations_classes.sql` explicitly notes what is **not** present (`profiles`, `topics`, `questions` as first-class tables in that sense).
- **Questions:** Item content lives in **static JSON / Storage**, not in a `questions` Postgres table. The DB holds **answers**, **per-topic performance**, and **mapping**: `user_question_answers`, `topic_performance`, `question_topic_mapping` (`question_id` + `topico_value` as **text**).
- **Topics:** No normalized `topics` table; “topic” is a **text value** (`topico_value`) on mapping and performance tables.

**`db.md` issues:** The file mixes an **older inspection snapshot** (e.g. extra columns on `users`, `pets` PK shape) with monorepo notes — **either** update tables to match migrations **or** mark clearly as **historical snapshot (pre–Phase 0)**.

**Tables in old docs but not in DB today:** Treat as **optional future work** — e.g. `questions` / `topics` tables if you need **editorial workflows**, **heavy server-side search**, or **multiple sources** — **not** a commitment of the current phase.

**Summary:** Update docs to reflect real schema and data flow; mention `profiles` / `questions` / `topics` as tables only under **Roadmap** or **Not implemented** so readers are not misled about production.

---

### A3. Routine Generation Source of Truth
`broto-sistema-completo.md` implies the routine is AI-generated via NotebookLM. The mobile app has a local algorithm in `lib/missions/daily-missions.ts`. The Python service has a `/routine/generate` endpoint that's not connected to any frontend.
**What's the intended architecture for routine generation?** Client-side algorithm, server-side AI, or a hybrid? Should we connect the Python endpoint or keep the local algorithm?

**Answer:** **Hybrid, phased.** The **weekly calendar** shown in the web and mobile apps is generated **on the client** by a deterministic **`gerarRotina`** function (`apps/web/src/lib/routine.ts`, mirrored in `apps/mobile/app/(tabs)/routine.tsx`): order areas by performance, apply the weekly pattern (Mon–Fri rotation, Sat review, Sun rest), use the user’s hours per day, and surface weaker topics. That is fast, predictable, and works without a server-side LLM.

**Clarification:** `lib/missions/daily-missions.ts` is **not** the same as the weekly routine — it only tracks **same-day** counters per area (AsyncStorage) for daily missions, not the week layout.

**NotebookLM / Python:** `POST /routine/generate` in `supabase/services/notebooklm/main.py` is an **optional evolution** (AI-enriched copy, richer suggestions). It is **not wired to any frontend** today. NotebookLM is primarily for **chat with class materials** and notebook flows. **Decision:** keep the **client algorithm as the baseline** (fallback, cost-free, no session dependency); optionally integrate the Python endpoint later for **narrative and refinement**, not as the only source of truth.

**Planned onboarding → first personalized routine:** Onboarding will ask for **goal** (target university and course) to **estimate a rough score target** for that profile; **self-reported level per area** (e.g. Math, Languages, Human Sciences, Natural Sciences); **hours per day** available. From that, the app will build the **first** personalized routine (not generic) — weights and focus aligned to baseline and goal. After that, the routine **adapts to real performance** (accuracy, weak topics, consistency). The **LLM** is intended to **refine and explain** weekly priorities (and optionally enrich output) on top of the same signals, while the **deterministic layer** remains the guarantee when AI is unavailable.

**Docs:** Update `broto-sistema-completo.md` so it does not claim the UI routine is NotebookLM-generated today; state **rule-based client + optional AI** as above.

---

### A4. Multi-Class Enrollment Behavior
A student can enroll in multiple classes (via `enrollments` table), but `users.current_class_id` only stores ONE class. The `class-join` edge function overwrites `current_class_id` on each enrollment.
**Is multi-class enrollment intentional?** If yes, how should the student switch between classes? If no, should we add a constraint to prevent it?

**Answer (current code + validated product intent):**

**How it works today:** `enrollments` supports **multiple** rows per student (`class-join` upserts on `class_id, student_id`). **`users.current_class_id`** is a **single** pointer; **`class-join`** and onboarding **overwrite** it with the class just joined. **Broto Chat** and **ClassContext** use that one id → **“last joined wins”** for chat/materials context. There is **no** student-facing class switcher.

**Validated product intent:** (1) **Multi-class enrollment is intentional.** (2) **All** of a student’s classes should be **active** in product terms—not reduced to a single implicit “current” via last join. (3) **Teachers and admins** must be able to **see** multi-class enrollment (admin flows can already list students per class via `enrollments`; the gap is **consistent student UX** and any reporting that assumes one class). (4) B2B shape targets **organizations with many classes** (not a single-class-only model).

**Gap:** The current **`current_class_id`** design **does not match** “all active”—it **serializes** context to one class for chat/org. **Target behavior:** evolve so **each enrollment** is first-class (e.g. **per-class** chat or materials entry points, a **hub** listing all classes, or **explicit `class_id`** on each action instead of one global pointer). Options: stop overwriting `current_class_id` without user intent; deprecate exclusive reliance on it for “active”; or replace with **default focus** only, not exclusivity.

**Constraints:** **Do not** add a single-enrollment DB constraint—multi-class stays allowed.

**Priority:** **High** to align UX/API with multi-active semantics; white-label **per-org config** is acceptable as **phase 2** (separate from enrollment mechanics).

**Related decisions (same validation pass):** Onboarding **score target** — **manual in MVP**, **generic estimate in phase 2**. Routine architecture — **hybrid**: **deterministic** week grid always available; **LLM optional** for refinement (no hard dependency on AI for the core schedule).

---

### A5. @broto/ui Package — Keep or Retire?
`packages/ui` exports 4 components (Button, Card, Badge, Spinner) but **none of them are imported in any app**. All apps implement their own UI components. Additionally, the package uses web-only APIs (HTMLAttributes, CSSProperties) making it incompatible with React Native.
**Should we retire this package, rebuild it as web-only, or invest in making it cross-platform?**

**Answer:** **Retire (or park) until there is a real consumer.** `@broto/ui` is declared as a dependency in `apps/web/package.json`, but **no app imports** it — web, admin, and mobile all use **local inline components**. Keeping the package adds **maintenance and workspace noise** with **zero runtime benefit** today.

**Web-only vs cross-platform:** The implementation uses **DOM-centric types** (`HTMLAttributes`, `CSSProperties`) — it is **web-only by design**. **Do not** invest in making *this* package cross-platform: React Native needs a different primitive layer (View/Text/StyleSheet). If a shared design system becomes a priority later, introduce it as **explicitly web** (e.g. `@broto/ui-web` or components colocated under `apps/web`) and, if needed, a **separate** native kit or a third-party cross-platform UI library — not a single package pretending to serve both.

**Recommendation:** **Remove** `packages/ui` from the monorepo (or archive behind a feature branch), drop `@broto/ui` from `apps/web/package.json` and root workspace references, and **re-add a package only when** at least one app commits to importing it. **Priority:** low (cleanup / tech debt), not blocking product delivery.

---

### A6. Shared Types Not Actually Shared
`@broto/shared` exports question types, but both `apps/web/src/lib/types/questions.ts` and `apps/mobile/lib/types/questions.ts` maintain **identical local copies** instead of importing from the shared package. Same pattern exists for area-config, cached-hook factory, and api-client.
**Was this intentional during migration, or should we consolidate to import from `@broto/shared`?**

**Answer:** **Partially accidental drift during migration.** `@broto/shared` is **already used** for several domain types (`Class`, `Organization`, `Material`, `AdminProfile`, `generateClassCode`, etc. in admin/web/mobile). The gap called out in this question is **`lib/types/questions.ts` in web and mobile** — they mirror `packages/shared/src/types/question.ts` (`Area`, `Topico`, `Question`, `getQuestionId`, `QuestionsResponse`) instead of importing it. **Should consolidate:** remove duplicate files or replace with `export * from '@broto/shared'` and import from `@broto/shared` everywhere to avoid **silent divergence** when one copy is edited.

**`area-config`:** **Not the same** as duplicated question types. Web (`apps/web/src/lib/area-config.ts`) and mobile (`apps/mobile/theme/area-config.ts`) differ on purpose: **lucide-react** vs **lucide-react-native**, and mobile carries **extra UI tokens** (gradients, glow, `AreaConfig` shape). **Do not** blindly merge into one file. **Optional:** extract a **minimal shared layer** (area keys, labels, base hex colors as data) in `@broto/shared` and keep **platform-specific** icon/theme wrappers in each app.

**`api-client` / cached-hook factory:** If bodies match, **move shared logic** to `@broto/shared` or a small `@broto/web-utils` / keep mobile-specific where fetch/storage differs. **Review case-by-case** — goal is **one implementation** for pure helpers, **two thin adapters** if environments diverge.

**Priority:** **Medium** — types consolidation is quick win; deeper refactors when touching those modules anyway.

---

### A7. Missing Test Infrastructure
There are zero test files across the entire codebase — no unit tests, no integration tests, no E2E tests. No test runner is configured in any package.json.
**Is testing planned? What's the priority level, and which areas should be tested first?**

**Answer:** **Yes — testing should be planned** as the product hardens. Today there is **no** configured runner (no Vitest/Jest/Playwright in root or app `package.json`), which matches **zero** `*.test.*` files — **confirmed**.

**Priority:** **Medium–high** after core flows stabilize: not blocking early iteration, but **high leverage** before scaling features or onboarding new contributors.

**Test first (suggested order):**

1. **Pure logic, no DOM:** `gerarRotina` / `routine.ts`, `getQuestionId`, score or progress helpers — **fast unit tests**, high ROI.
2. **Edge Functions** (`class-join`, `answer-question`, `broto-chat`): **integration tests** with Supabase local or mocked client — catch auth/RLS regressions.
3. **Critical user paths (E2E later):** signup → onboarding → join class → answer question → progress updates; admin create class → upload material — **Playwright** (web) or **Detox** (mobile) once smoke coverage is needed.

**Tooling:** **Vitest** for TS units in `packages/shared` and libs; add scripts per package or at root; CI optional in a later phase.

**Summary:** Acknowledge gap; adopt **incremental** testing — **shared types + pure functions first**, then **serverless**, then **E2E** for regression safety.

---

### A8. No CI/CD Pipeline
No GitHub Actions, Vercel config, or deployment scripts exist (beyond the pitch PDF export script).
**What's the deployment strategy for each app?** Mobile via EAS/Expo? Web/Admin via Vercel? Supabase functions via `supabase functions deploy`? Should we set up CI/CD now?

**Answer:** The repo has **no** `.github/workflows`, **no** `vercel.json` / `eas.json`, and **no** deployment scripts for apps — the review observation is **accurate**. **Recommended strategy (typical for this stack):**

| Surface | Build output | Hosting / release |
|--------|----------------|-------------------|
| **Mobile** (`apps/mobile`) | Expo | **EAS Build** + **EAS Submit** (TestFlight / Play Internal Testing first). Configure `eas.json` when ready for channels (preview/production). |
| **Web aluno** (`apps/web`) | `vite build` → static assets | **Vercel**, **Netlify**, **Cloudflare Pages**, or any static host — SPA routing needs fallback to `index.html`. |
| **Admin** (`apps/admin`) | same | Same as web; can be **same project different path** or **separate** project/subdomain (`admin.*`). |
| **Supabase** | SQL + Edge Functions | **`supabase db push`** / migrations in CI; **`supabase functions deploy`** for functions; secrets in Supabase Dashboard. |

**CI/CD now?** **Minimum CI soon** (before wider beta): **`npm run typecheck`** (and lint if added) on PR — **low cost, high value**. **Full CD** (auto-deploy on merge) can wait until **environments** (staging/prod) and **secrets** are stable. **Priority:** medium — not blocking local dev, but **should** land before production traffic.

**Optional:** GitHub Actions matrix running `turbo run typecheck` + cache; deploy steps only after hosting accounts exist.

---

### A9. No Analytics or Error Tracking
No Sentry, LogRocket, PostHog, or any analytics/error tracking is present in any app.
**Is this planned? At what phase should it be added?**

**Answer:** **Not implemented** — **confirmed** (no SDKs in app source beyond normal deps). **Planned:** **yes**, for any **production** or **closed beta** with real users — **blind flying** without crashes and funnel data is risky.

**Recommended phasing:**

1. **Before first production release:** **Error tracking** — e.g. **Sentry** (or Expo’s crash reporting) for mobile + web — **source maps**, release health, **P1**.
2. **Same window or shortly after:** **Product analytics** (privacy-conscious) — **PostHog** (self-hostable), **Plausible**, or **Firebase Analytics** for mobile — **key events** (signup, join class, answer question, session length), **P2** — align with LGPD/consent if applicable.
3. **Session replay** (LogRocket, etc.) — **optional**, heavier cost/privacy review — **only if** debugging UX issues justifies it.

**When:** **Phase “pre-production”** or **first external beta** — not required for solo dev, **required** before scaling users or fundraising demos that need metrics.

---

### A10. React Version Mismatch Across Apps
Mobile uses React 19.1.0, while web and admin use React ^18.3.0. Supabase JS versions also differ (`^2.90.1` mobile vs `^2.45.0` web/admin).
**Should all apps be aligned to the same React/Supabase versions?** React 19 has breaking changes (e.g., automatic batching changes, removal of legacy APIs).

**Answer:** **Supabase JS — align.** `apps/mobile` uses `@supabase/supabase-js` **^2.90.1** while web/admin use **^2.45.0**. Same major line — **bump web and admin to the same range as mobile** (e.g. `^2.90.1`) after a quick smoke test. Low risk, fewer subtle API differences and easier debugging.

**React — different trade-off.** Mobile is pinned to **React 19.1.0** (Expo / React Native stack). Web/admin use **React ^18.3.0**. **Options:** (1) **Upgrade web + admin to React 19** when ready (Vite + `@types/react` 19, run through UI and tests) — **desirable** for one React version in the monorepo and shared mental model. (2) **Keep divergence** short-term if Expo/React Native is the forcing function and web migration is deferred — document it in `package.json` / README. **Do not** downgrade mobile to React 18 to match web — Expo’s supported pairing wins.

**Shared packages:** `@broto/shared` is mostly types — version skew is tolerable; if you add **hooks** or **UI** shared across RN and web, **align React** first.

**Priority:** Supabase bump **soon**; React **medium** (schedule with a focused QA pass).

---

## B. DATABASE & BACKEND SECURITY

### B1. Missing Database Indexes — Critical Performance
The migration `20260317_foundation_organizations_classes.sql` creates **zero indexes** despite having foreign keys queried in RLS policies: `enrollments.class_id`, `enrollments.student_id`, `classes.organization_id`, `materials.class_id`, `admin_profiles.organization_id`, etc.
Every RLS policy with a subquery runs a full table scan per row evaluated. With 1000 enrollments, that's 1000 subqueries.
**Should we add indexes immediately via a new migration?**

**Answer:** **Yes — add a new migration** with **B-tree indexes** on columns used in **FK joins and policy filters**: at minimum `enrollments(class_id)`, `enrollments(student_id)`, `classes(organization_id)`, `materials(class_id)`, `materials(organization_id)`, `admin_profiles(organization_id)`, `admin_profiles(id)` (often PK already indexed), `classes(id)` (PK). PostgreSQL does **not** auto-index every FK in all setups; RLS policies that do `IN (SELECT … WHERE student_id = …)` benefit heavily when the inner query is index-backed.

**Why now:** Cheap change, **large impact** as row counts grow; avoids full sequential scans on hot paths. **Priority:** **high** before production scale.

**Verify:** `EXPLAIN` on representative queries under RLS (or `pg_stat_user_indexes`) after deploy.

---

### B2. RLS Policies — N+1 Performance Anti-Pattern
Every RLS policy uses nested `SELECT` subqueries in the `USING` clause. For example, the organizations policy (line 158-168) joins `classes` and `enrollments` for each org row. This is an N+1 pattern at the database level.
**Should we refactor to materialized views, use `security definer` functions, or accept the performance trade-off for now?**

**Answer:** **Indexes first** (see B1) — often enough for **small-to-medium** tenants. The RLS pattern (subquery per row) is **normal** in Postgres + Supabase; the cost is dominated by **unindexed** scans.

**Next step if still slow:** **`SECURITY DEFINER` helper functions** that return `setof uuid` or boolean (e.g. `user_can_see_org(org_id)`) — **stable plan**, single evaluation pattern, recommended in Supabase docs for complex policies. **Prefer** this over **materialized views** for membership here: MVs add **staleness** and **refresh** complexity for little gain unless reads are extreme.

**Materialized views:** **Not** the first lever for this case — use for **heavy analytics**, not live RLS.

**Trade-off:** **Accept** current policy shape for **early dev / low load**; **revisit** with `EXPLAIN (ANALYZE, BUFFERS)` when latency or CPU shows up. **Priority after indexes:** medium — refactor policies only when profiling shows they are the bottleneck.

---

### B3. Missing Foreign Key Constraint on users.current_class_id
`users.current_class_id` references `classes(id)` but has **no `ON DELETE` behavior**. If a class is deleted, users will have orphaned `current_class_id` values pointing to non-existent classes.
**Should this be `ON DELETE SET NULL`?**

**Answer:** The FK is `references public.classes(id)` with **no** explicit `ON DELETE` — PostgreSQL defaults to **`NO ACTION`** / **`RESTRICT`**: you **cannot delete** a `classes` row while any `users.current_class_id` still references it. So **orphan UUIDs** do **not** appear from a normal `DELETE FROM classes` — the delete **fails** until references are cleared. “Orphans” would only appear if the FK were removed, data were edited out-of-band, or restores went wrong.

**`ON DELETE SET NULL`:** Still **worth adding** if the product rule is “when a class is removed, clear the student’s pointer automatically.” That requires the column **nullable** (it is) and a migration such as: drop the FK constraint and re-add `references public.classes(id) on delete set null`. **Alternative:** keep `NO ACTION` and **explicitly** `UPDATE users SET current_class_id = null WHERE …` before deleting a class (more control in app logic).

**Recommendation:** **`ON DELETE SET NULL`** is a good default for `current_class_id` so deletes don’t require a separate cleanup step — **medium priority** when class lifecycle is implemented.

---

### B4. Missing INSERT Policy for admin_profiles
The `admin_profiles` table has RLS enabled with a policy for SELECT/UPDATE/DELETE (self only), but **no INSERT policy**. This means no one can create new admin profiles through the API.
**How are admin profiles created?** Via a trigger, manual SQL, or is this a bug?

**Answer:** **Not missing a separate INSERT policy.** The migration uses **`FOR ALL`** on `"admin vê próprio perfil"` with `using (id = (select auth.uid()))`. In PostgreSQL, when **`WITH CHECK`** is omitted, the **`USING`** expression is applied as **`WITH CHECK` for `INSERT`/`UPDATE`** — so **inserts are allowed** only when the new row’s `id` equals `auth.uid()` (self row).

**How profiles are created in practice:** **No trigger** in the repo. **Seed / manual SQL** — e.g. `supabase/seed-enem.sql` **`INSERT INTO public.admin_profiles`** for the demo owner. New real admins are expected to be provisioned via **Dashboard SQL**, **service role** scripts, or a **future invite flow** — not automatic on signup.

**Bug caveat:** A **permissive** `WITH CHECK` that only enforces `id = auth.uid()` does **not** constrain `organization_id` / `role`; a malicious client could theoretically insert a row for themselves with an arbitrary org. **Hardening:** narrow `WITH CHECK` (e.g. only allow insert when invited), or **disable client INSERT** and create rows only via **service role** / Edge Function. **Priority:** high before public anon signups.

---

### B5. Students Can Access Inactive Classes
The student RLS policy for `classes` (line 190-194) checks enrollment status but does **not** check `classes.is_active`. A student enrolled in a deactivated class can still see and interact with it.
**Should the student classes policy include `AND c.is_active = true`?**

**Answer (validated product intent):** **Yes — students must not see inactive classes**; **admins** keep full visibility via existing admin policies on `classes`. Update the **student** `SELECT` policy so the class row is visible only if **`is_active = true`** (in addition to active enrollment). **When a class is deactivated**, **enrollments for that class should be set to `inactive` together** (app logic in admin, Edge Function, or **`ON UPDATE` trigger** on `classes` that cascades status to `enrollments`) — aligns DB with “student should not interact with that class anymore.” **Priority:** high before relying on `is_active` in production.

---

### B6. Redundant organization_id on Materials Table
`materials` has both `class_id` and `organization_id`. Since classes already have `organization_id`, this is denormalized. There's no constraint ensuring `materials.organization_id` matches `classes.organization_id`.
**Is this intentional for query performance, or should we derive it from the class relationship?**

**Answer:** **Keep the denormalization** — it is a **reasonable pattern** for **admin RLS** and filters: policies can scope `materials` by **`organization_id`** without joining `classes` on every read (cheaper and simpler policies). **Do not** rely on the app alone for consistency.

**Integrity (recommended):** add a **`BEFORE INSERT OR UPDATE`** trigger on `public.materials` that **sets `organization_id`** from `public.classes.organization_id` for `NEW.class_id`, or **raises** if an update would mismatch. Alternatively a **`CHECK`** cannot easily reference another table in plain SQL — **trigger is the usual fix**. If `classes.organization_id` ever changes (rare), a follow-up trigger or one-off migration should update child rows.

**Summary:** **Intentional for policy/query ergonomics** + **enforce consistency in the database.**

---

### B7. No Audit Trail for Enrollments
`enrollments` has `enrolled_at` but no `updated_at` or status change history. When a student is de-enrolled (status changed to 'inactive'), there's no record of when or why.
**Should we add an audit trail (updated_at timestamp, status change log)?**

**Answer (validated):** **De-enrollment = `status = 'inactive'` only** (no row delete). **MVP — minimal:** add **`updated_at timestamptz`** (default `now()`) and a **`BEFORE UPDATE` trigger** (or Supabase-style `moddatetime`) so **any** status change updates the timestamp — gives **when** the last change happened without a full history table. **Optional:** `updated_by` / `reason` text — only if product needs it soon.

**Phase 2+:** append-only **`enrollment_events`** (or audit table) if compliance / support needs **who/when/why** for each transition.

**Priority:** **medium** — ship `updated_at` before scaling support workflows.

---

### B8. Seed File Uses Hardcoded UUIDs
`seed-enem.sql` uses fixed UUIDs (e.g., `a0e00000-0000-4000-8000-000000000001` for the ENEM org). If this seed runs in multiple environments (dev, staging, prod), the same UUIDs exist everywhere.
**Is this intentional for the ENEM MVP?** Should different environments use different IDs?

**Answer (validated):** **Yes — fixed UUIDs are intentional for the ENEM MVP** so docs, local dev, and demos can reference **stable** org/class IDs (`seed-enem.sql`). **Production strategy (TBD):** the ideal is **not** to depend on those hardcoded IDs and to **run seed SQL only in dev** (or dedicated staging), not as part of prod bootstrap. Real orgs/classes in production should be **created through the app/admin** with **generated UUIDs**. Revisit before go-live: either **omit** `seed-enem` from prod pipelines or replace with a **one-off** migration that creates known demo data only if product still needs a public ENEM org.

---

### B9. Missing Migration Rollback
The migration has no down/rollback script. RLS policies, tables, and views are not easily reversible.
**Is a rollback strategy needed, or is this a forward-only migration approach?**

**Answer (validated):** **Forward-only / simplest.** Do **not** maintain paired `down` scripts unless policy requires it. **Fix mistakes with a new forward migration** (`ALTER`, new policies, corrective SQL) — standard for Supabase/Postgres teams at this stage. **Rollback strategy:** restore from **backup** or **branch** (`supabase db reset` locally), not reversible DDL in one file.

---

## C. EDGE FUNCTIONS & API SECURITY

### C1. CORS Headers Allow All Origins
Both `class-join` and `broto-chat` edge functions use `"Access-Control-Allow-Origin": "*"`. This allows any website to make API calls to your backend.
**Should CORS be restricted to known domains (e.g., your Vercel deployment URLs)?**

**Answer:** **Yes — restrict in production.** Updated both `class-join` and `broto-chat` to read **`ALLOWED_ORIGINS`** env var (comma-separated list of allowed origins). When set, only listed origins receive a matching `Access-Control-Allow-Origin` header. When empty (local dev), falls back to the request's `Origin` header for convenience. **Set `ALLOWED_ORIGINS`** in Supabase Dashboard secrets before deploying to production (e.g. `https://app.broto.com,https://admin.broto.com`). **Priority:** high before production.

---

### C2. Missing Authorization in material-index Function
The `material-index` function checks authentication but **never verifies the user is an admin of the class/organization**. Any authenticated user can trigger material indexing for any class by passing a `class_id`.
**Should we add ownership verification before allowing indexing?**

**Answer:** **Yes — added auth header check.** The function now reads the `Authorization` header, validates the user via `supabase.auth.getUser()`, and returns 401 if invalid. **Deeper org-level check** (verify user is admin of the material's organization via `admin_profiles`) should be added when admin profile enforcement is complete. For now, **authentication** blocks anonymous/unauthenticated callers. **Priority:** high (auth gate added); medium (org-level admin verification — next pass).

---

### C3. Missing Authorization in broto-chat Function
Similarly, `broto-chat` fetches the user's `current_class_id` but doesn't verify the user is enrolled in that class before sending the chat request to the Python service.
**Should enrollment be verified before allowing chat?**

**Answer:** **Yes — implemented.** Added an **enrollment check**: after fetching `current_class_id`, the function queries `enrollments` for an **active** enrollment matching `(class_id, student_id, status='active')`. Returns **403** if the user is not enrolled. This prevents a user from accessing chat for a class they are not part of (e.g. if `current_class_id` was left stale after de-enrollment). **Priority:** high — now shipped.

---

### C4. Race Condition in class-join — Non-Atomic Operations
The `class-join` function performs enrollment INSERT and user UPDATE (`current_class_id`) as separate operations without a transaction. If one succeeds and the other fails, data becomes inconsistent.
**Should these be wrapped in a database transaction (via RPC/stored procedure)?**

**Answer:** **Ideal: yes — via a `SECURITY DEFINER` RPC.** In practice, the failure mode is: enrollment succeeds but `current_class_id` update fails → student is enrolled but pointer is stale. This is **recoverable** (next join or manual fix). **Current fix:** added error logging on the `update` call so failures are visible; the enrollment upsert is the critical operation. **Full atomicity** via `BEGIN/COMMIT` requires a **stored procedure** (`rpc('join_class', { code, student_id })`) — recommended for **phase 2** when class lifecycle is formalized. **Priority:** medium (logged; functional without atomicity).

---

### C5. Race Condition in material-index — Duplicate Notebooks
When two materials from the same class are indexed simultaneously, both might see `notebook_id = null` and create separate notebooks. There's no locking mechanism.
**Should notebook creation use an atomic check-and-create pattern?**

**Answer:** **Yes — recommended.** Best approach: **`INSERT ... ON CONFLICT DO NOTHING`** on a `(class_id)` unique constraint for notebook creation, or a **`pg_advisory_lock`** on `class_id` hash inside an RPC. Simpler alternative: **admin UI should disable concurrent indexing** (button disabled while `notebook_status = 'indexing'`). In the current flow, the race is **unlikely** (admin triggers one material at a time), but **should be hardened** before bulk-upload features. **Priority:** medium — UI guard now, DB lock later.

---

### C6. material-index Marks Material as "indexed" on Timeout
Lines 110-120 of `material-index/index.ts`: when the NotebookLM call times out, the function optimistically marks the material as "indexed" and sets `notebook_status = 'ready'`. This can hide indexing failures.
**Should timeout leave the status as "pending" or "error" instead?**

**Answer:** **Fixed — timeout now reverts to `pending`.** Updated the abort handler to set `index_status = 'pending'` (not `'indexed'`) and return HTTP **202** with a message explaining the material was returned to the queue. This allows the admin to see it as pending and retry. **`notebook_status`** is left as-is on timeout (notebook may already be ready from prior sources). **Priority:** high — now shipped.

---

### C7. No Input Validation on Edge Function Payloads
- `class-join`: No max length or character validation on `access_code`
- `broto-chat`: No max length on message content (could send massive prompts)
- `material-index`: No UUID format validation on `material_id`/`class_id`
**Should we add input validation (length limits, format checks) to all edge functions?**

**Answer:** **Yes — all three functions now validate inputs.**
- **`class-join`:** `access_code` must be a string with max **20 characters**; rejects empty or oversized codes.
- **`broto-chat`:** each message limited to **4000 characters**; max **50 messages** per request; validates `role` and `content` types.
- **`material-index`:** `material_id` and `class_id` validated against **UUID regex** (`/^[0-9a-f]{8}-…$/i`); rejects missing or malformed IDs.
**Priority:** high — now shipped.

---

### C8. No Rate Limiting on Edge Functions
There's no rate limiting on any endpoint. A user could brute-force access codes, spam chat messages, or trigger excessive indexing operations.
**Should we implement rate limiting?** At the Supabase level, edge function level, or application level?

**Answer:** **Yes — recommended in layers.** **(1) Supabase-level:** Supabase Edge Functions have **built-in request limits** per project (configurable in dashboard). Enable and tune these. **(2) Application-level (Edge Function):** for `class-join`, add a **per-user cooldown** (e.g. max 5 join attempts per minute via a `rate_limits` table or in-memory KV). For `broto-chat`, limit to **~20 messages per minute per user**. For `material-index`, limit per admin. **(3) Reverse proxy / CDN:** if using Cloudflare or similar in front of the Supabase URL, apply rate limiting rules there. **Priority:** medium before public launch; critical before access codes are guessable.

---

### C9. Python Service — Notebook Map Stored on Local Filesystem
`supabase/services/notebooklm/main.py` stores the notebook ID mapping in a local JSON file (`notebook_map.json`). If the process restarts or the file is lost, all notebook references are gone.
**Should the mapping be stored in Supabase (the `classes.notebook_id` column already exists for this)?**

**Answer:** **Yes — `classes.notebook_id` is the canonical store.** The Edge Function (`material-index`) already writes `notebook_id` to `classes` when creating a notebook. The Python service's local `notebook_map.json` should be treated as a **cache** that is populated from `classes.notebook_id` on startup/miss. **Ideal:** remove `notebook_map.json` dependency entirely — have the Python service query Supabase for `notebook_id` when it needs it (or receive it in the request payload from the Edge Function). **Priority:** high before deploying to a stateless container.

---

### C10. Python Service — SERVICE_SECRET Defaults to Empty String
`main.py` line 35: `SERVICE_SECRET = os.getenv("SERVICE_SECRET", "")`. Lines 118-119: if empty, auth is completely bypassed (`if not SERVICE_SECRET: return`).
**Should the service refuse to start if SERVICE_SECRET is not set?**

**Answer:** **Yes — fail fast on startup.** Change to `SERVICE_SECRET = os.environ["SERVICE_SECRET"]` (no default) — the process crashes immediately with a clear `KeyError` if the secret is missing. This prevents accidentally running the service **wide open** in any environment. For **local dev only**, a `.env` file with a placeholder secret is acceptable. **Priority:** high (security).

---

### C11. Python Service — No File Size Limit
The service handles base64-encoded files with no size validation. A 100MB+ file could cause out-of-memory errors.
**Should we add a max file size check (e.g., 50MB)?**

**Answer:** **Yes — add a size check before processing.** Reject requests where the decoded payload exceeds **50 MB** (or a configurable `MAX_FILE_SIZE_MB` env var). For base64: `len(b64_string) * 3 / 4` gives approximate decoded size. Return **413 Payload Too Large** if exceeded. Also consider adding a **Content-Length** header check as a fast pre-filter. **Priority:** high (OOM protection).

---

### C12. Inconsistent API Response Formats
- `class-join` returns `{ success: true, class: {...} }`
- `broto-chat` returns `{ message: "..." }`
- Python service returns `{ success: true, message: "..." }`
**Should we standardize on a single response envelope format across all APIs?**

**Answer:** **Recommended but low priority.** A standard envelope like `{ ok: boolean, data?: T, error?: string }` across all endpoints reduces client-side parsing complexity. However, each function's contract is currently **consumed by a single client** (`api-client`), so the mapping is localized. **Suggested standard:** `{ success: boolean, data?: unknown, error?: string }` for all Edge Functions. **Python service** can keep its own contract since it's internal. **Apply** when adding new endpoints or during a coordinated cleanup pass. **Priority:** low — cosmetic consistency, not a bug.

---

## D. MOBILE APP

### D1. Firefly Animation Duplicated 4 Times
Identical firefly animation logic (10 animated elements with Reanimated) is copy-pasted in `_layout.tsx`, `login.tsx`, `study.tsx`, and `questions.tsx`. That's 40+ simultaneous Reanimated animations across screens.
**Should this be extracted into a reusable `<FireflyBackground />` component?** Also, should animations pause when the screen is unfocused (using `useFocusEffect`)?

**Answer:** **Yes — extract** a shared component (e.g. `<FireflyBackground variant="login" | "splash" />`) with props for layout/count so `_layout`, `login`, `study`, and `questions` don’t each ship ~10 Reanimated nodes. **Pause or reduce work off-screen:** use **`useFocusEffect`** (or tab focus) to **stop** / **defer** loops when the screen isn’t visible — saves CPU/battery and avoids stacking animations when multiple routes stay mounted. **Priority:** medium (maintainability + perf).

---

### D2. Race Condition in Cached Hook Refresh
`hooks/create-cached-hook.ts` lines 34-47: if `refresh()` is called while a fetch is in-flight, it clears the cache (`fetchedAt = 0`) but doesn't cancel the ongoing request. The old request might complete and overwrite the manually-triggered refresh data.
**Should we add request cancellation (AbortController) or an inflight guard?**

**Answer:** **Yes — fix the race.** Today `refresh()` clears cache but **`fetchData()` returns the existing `store.inflight`** if a request is already running, so a **manual refresh may not start a new fetch** while the old one is in flight; when the old promise resolves, it still writes `store.cached` from the **stale** response. **Options:** (1) **`refreshGeneration` counter** — ignore `.then` results from older generations; (2) **`AbortController`** per fetch if `fetcher` supports `signal`; (3) on `refresh()`, **set `inflight = null`** only if you cancel (hard without abort). **Prefer (1) + AbortController** if APIs allow. **Priority:** medium.

---

### D3. Memory Leak in Cached Hook Listeners
`create-cached-hook.ts` lines 60-75: if a component unmounts during a fetch, the listener is removed, but `notifyListeners()` at line 31 could still fire for other components. More critically, `fetchData()` might complete after unmount.
**Should we add an `aborted` flag to prevent post-unmount state updates?**

**Answer:** For **this** hook, unmount **removes** that component’s listener, so **`notifyListeners()` no longer calls its `setState`** — low risk of “setState on unmounted component” **for that subscriber**. Risk remains if **`fetcher` closures** capture component state (not the case here). Still, **`notifyListeners()`** updates **all** subscribers; other mounted screens stay correct. **Optional hardening:** pass **`AbortController`** into `fetcher` or add **`isMounted` ref** only if the factory is extended with side effects. **Priority:** low unless profiling shows leaks; pair with **D2** fix.

---

### D4. Daily Missions Tied to Local Date Only
`lib/missions/daily-missions.ts` uses `todayLocalISO()` (local device date). If a user changes timezones, missions could reset prematurely. There's no server-side validation.
**Should daily mission state be server-side, or at minimum validated against a server timestamp?**

**Answer:** **MVP:** **Local-only** is acceptable for **gamified counters** (low stakes). **Risks:** clock skew, timezone travel, manipulation — acceptable until competitive/anti-abuse matters. **Next step:** expose a **canonical “study date”** (UTC date or server `now()` from a lightweight endpoint) and **key** daily state to that, or sync **mission progress** with **`user_question_answers` date** server-side. **Server-authoritative** storage is **phase 2+** if missions affect rewards or leaderboards. **Priority:** low for MVP; **medium** before monetization or fairness-sensitive features.

---

### D5. Home Screen Serial API Calls
`app/(tabs)/index.tsx` lines 415-422: `onRefresh` calls `refreshPet()`, `refreshProgress()`, and `getDailyMissionsState()` sequentially.
**Should these be parallelized with `Promise.all()`?**

**Answer:** `refreshPet()` / `refreshProgress()` are **synchronous triggers** into `createCachedHook` — they **start** async fetches without awaiting, so **network requests for pet and progress already overlap** in practice. `getDailyMissionsState()` returns a **Promise** (AsyncStorage) — **`await Promise.all([getDailyMissionsState(), ...])`** only helps if `refresh*` are changed to **return** the underlying `Promise` from `fetchData()`. **Improvement:** make **`refresh` return `Promise<void>`** from the cached hook, then **`await Promise.all([refreshPet(), refreshProgress(), getDailyMissionsState()])`** and tie **`setRefreshing(false)`** to **completion**, not a fixed **800ms** timeout. **Priority:** low–medium (correct pull-to-refresh UX).

---

### D6. Missing Error Boundaries
No Error Boundary components exist anywhere in the mobile app. If any hook throws, the entire screen crashes without a user-friendly fallback.
**Should we add error boundaries at the screen level?**

**Answer:** **Yes — recommended** for production polish. React Native supports **error boundaries** (React 18+ / 19) per route or tab: catch render errors, show **fallback UI** + “Tentar de novo”. Does **not** catch async errors inside handlers unless rethrown — pair with **try/catch** on `api` calls. **Priority:** medium before broad release.

---

### D7. Chat Message IDs Reset on App Restart
`broto-chat.tsx` uses a `useRef(1)` counter for message IDs. On app restart, IDs reset to 1, potentially causing duplicates with previous session messages (if they were persisted or logged).
**Should we use UUIDs instead of numeric IDs for chat messages?**

**Answer:** **Yes — use stable unique ids** (e.g. **`crypto.randomUUID()`** on RN / `expo-crypto`, or **`nanoid`**) for **user and assistant** messages **when** ids are used as **React keys** or sent to analytics. Today ids are **strings** (`String(nextId++)`); duplicates only hurt **if** messages are **persisted** or **merged across sessions** — in-memory session is OK, but **UUIDs** avoid collisions if you add **history persistence** later. **Priority:** low until persistence ships; trivial change.

---

### D8. Modal Dismissal May Fail on Android
`broto-chat.tsx` line 42: `router.dismissTo('/(tabs)')` might not work if the modal was pushed from a non-tabs screen or via deep link. No fallback exists.
**Should we add a `canGoBack()` check with `router.back()` as fallback?**

**Answer:** **Yes — add a defensive navigation chain.** `leaveChat` currently only calls **`router.dismissTo('/(tabs)')`** (see comment in `broto-chat.tsx` about modal stack). If that route isn’t in the stack (deep link / odd push), the user can get stuck. **Pattern:** try **`dismissTo('/(tabs)')`**, then if navigation exposes **`canGoBack()`**, call **`router.back()`**, else **`router.replace('/(tabs)')`** as last resort (exact API depends on Expo Router version — verify against current `expo-router` types). **Priority:** medium (Android hardware back already calls `leaveChat`; still harden header close).

---

### D9. FlatList Missing Optimizations in Chat
`broto-chat.tsx`: The `FlatList` for chat messages **has `keyExtractor`**, but may still benefit from tuning (`removeClippedSubviews`, `maxToRenderPerBatch`, etc.) and has no pagination for very long conversations.
**Should we add further FlatList performance optimizations?**

**Answer:** **Partially outdated premise:** `broto-chat.tsx` **already sets `keyExtractor={(item) => item.id}`** — keys are covered. **Still worth tuning for long threads:** `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, optional **`removeClippedSubviews`** (test on Android — can help or hurt). **Pagination / virtualization of history** only if conversations get huge or messages are persisted. **Priority:** low until perf issues show.

---

### D10. Missing Accessibility Labels
Multiple interactive elements lack `accessibilityLabel` and `accessibilityRole`:
- `BrotoChatFab.tsx`: Floating button with emoji "🌱" but no label
- `MissionCard` in `index.tsx`: Pressable without `accessible={true}`
- `routine.tsx`: Color-only day indicators (golden dot for "today")
**Should we do an accessibility pass across the mobile app?**

**Answer (validated):** **Yes — treat as required for MVP**, scoped to **high-traffic controls** (FAB, mission cards, routine week cells, primary CTAs). Add **`accessibilityRole`**, **`accessibilityLabel`**, and **`accessibilityState`** where state matters (e.g. “today”, completed). **Don’t rely on color alone** — pair dot/color with **label text** for VoiceOver/TalkBack. **Priority:** **high** (small edits, large inclusion impact).

---

### D11. Stale 30-Second Cache Window
`create-cached-hook.ts` line 20: `STALE_MS = 30_000`. After answering a question, the user could see outdated progress for up to 30 seconds.
**Is 30 seconds acceptable?** Should we reduce this, or add cache invalidation on specific user actions (like answering a question)?

**Answer:** **No strong product decision yet** — **technical default:** keep **`STALE_MS`** as-is for **network chatter reduction**, but add **explicit invalidation** after **mutations** (e.g. after answering a question, call **`refreshProgress()`** / **`refreshPet()`** — already happens indirectly via pet stats in some flows; ensure **`useProgress` refresh** is invoked on the same path). **Optional:** lower **`STALE_MS`** to **5–10s** if stale UI is noticeable. **Best ROI:** **event-driven refresh** beats blindly shrinking the window.

---

### D12. Pet "humor" Field is Unused
`use-pet.ts` defines `humor: number` in PetData but it's never displayed in the UI.
**Is this a planned feature or dead code?**

**Answer (validated):** **Planned feature** — keep **`humor`** in **`PetData`** and API contract; **UI can ship later** (mood / reactions / Broto copy). Document in backlog so reviewers don’t delete it as “unused.” **Not a bug** unless the field is removed from the backend.

---

### D13. Unhandled Promise Rejection — Daily Missions
`app/(tabs)/index.tsx` line 340-348: `getDailyMissionsState()` has `.catch(() => {})` — silently swallows all errors. If daily missions fail to load, the user sees nothing with no indication of failure.
**Should we show an error state or retry mechanism?**

**Answer (validated):** **MVP:** **don’t block the home screen** — keep **graceful degradation** (missions default / empty state). **Do** add **`console.error` / logging** (or Sentry breadcrumb when integrated) inside `.catch` so failures aren’t invisible in dev/prod. **Roadmap:** **visible error + retry** when daily missions become **reward-critical**. **Daily mission storage stays local** (aligned with product choice).

---

### D14. ClassContext Silently Swallows Load Errors
`contexts/ClassContext.tsx` line 47-49: `load().catch()` silently discards errors. If class data fails to load, the user won't know.
**Should we surface class loading errors to the UI?**

**Answer (validated):** **MVP:** **log the error** (same as D13) and leave **context empty** — many screens work without org branding. **Roadmap:** **inline banner / toast** (“Não foi possível carregar sua turma”) + **retry** when class/org is **required** for the screen. Optionally store **`error` in context** for consumers that want to show UI later without another fetch.

---

### D15. Unsafe Type Casting in ClassContext
`contexts/ClassContext.tsx` line 40-41: `classRow as unknown as Class` (double cast) and `classRow.organizations as Organization` (unsafe property access). No runtime validation.
**Should we add proper type guards or runtime validation (e.g., Zod)?**

**Answer:** **Incremental hardening:** **short term** — map Supabase row → `Class` / `Organization` with a **small mapper** + **`in` checks** for required string fields. **Medium term** — **Zod** (or **Valibot**) schema for the **joined select** shape if the API evolves often. **Generated types** from Supabase CLI also reduce drift. **Priority:** medium — not blocking MVP if RLS and queries are trusted; **raises priority** if clients consume untrusted shapes.

---

## E. WEB APP

### E1. XSS Vulnerability — dangerouslySetInnerHTML
`components/questions/QuestionPlayer.tsx` line 79: `dangerouslySetInnerHTML={{ __html: question.context }}` renders raw HTML from API without sanitization.
**Should we add DOMPurify or similar HTML sanitization?** Or is the question content fully trusted (pre-sanitized in the seed)?

**Answer:** **Sanitize at render time** — even if content is **usually** from trusted static JSON / Storage, **`dangerouslySetInnerHTML`** is an **XSS sink** if any path ever ingests user/teacher HTML or a compromised bucket. **Add `dompurify`** (or `isomorphic-dompurify` if SSR) with a **strict allowlist** (e.g. `p`, `br`, `strong`, `em`, `span`, `img` with `src`/`alt` only if needed). **Defense in depth:** treat `question.context` as **untrusted** by default. **Priority:** high before any non-static HTML source.

---

### E2. Search Form Never Uses the Search Term
`components/layout/HomeDashboardTopBar.tsx` lines 21-26: both branches of the search `onSearch` handler navigate to `/study` regardless of the search query. The search term `q` is captured but never passed as a URL param or filter.
**Is this an incomplete feature, or is the search bar decorative?**

**Answer:** **Incomplete / placeholder UX** — `t` is read but **both branches** `navigate('/study')` with **no query** (`?q=` or state). Either **wire** `navigate('/study?q=…')` and read **`useSearchParams`** in `Study`, or **remove/hide** the search until implemented. **Do not** ship as a “real” search without behavior.

---

### E3. Daily Missions Client-Side Only — Manipulable
`lib/daily-missions.ts`: all daily mission state is stored in `localStorage` with a date key. A user can reset missions by clearing localStorage or changing the device date.
**Is this acceptable for MVP, or should mission state be server-side?**

**Answer (aligned with product):** **Same as mobile — MVP accepts client-only** localStorage (`broto:daily-missions:v1`) + local date; **manipulation** is an accepted trade-off until missions are **reward-critical**. **Server-side** state when fairness, leaderboards, or anti-abuse matter — **phase 2+**.

---

### E4. Performance History Not Scoped to User
`lib/performance-history.ts`: performance data is stored in `localStorage` without a user ID key. If two users share a browser (or one logs out and another logs in), data persists across accounts.
**Should localStorage keys be prefixed with the user ID?**

**Answer:** **Yes — prefix with `userId`** (e.g. `broto:perf-days:v1:${userId}`) or a **hash** of user id; **clear or migrate** on **auth logout** / **login** when user changes. Prevents **cross-account leakage** on shared browsers. **Priority:** medium (easy fix; rare edge case but nasty when it happens).

---

### E5. No Code Splitting / Lazy Loading
`router.tsx`: all pages are eagerly imported. No `React.lazy()` or dynamic imports.
**Should we add lazy loading for pages to improve initial load time?**

**Answer:** **Optional but recommended** as the app grows: `React.lazy()` + `<Suspense>` per route in **`createBrowserRouter`** (`lazy: () => import('./pages/Progress')` pattern) or **route-level** `lazy` imports. **Quick win** for **Broto** / **charts** / heavy pages. **Priority:** low–medium until bundle size hurts Core Web Vitals.

---

### E6. Missing 404 Route
`router.tsx`: no catch-all route for undefined paths. Users navigating to `/unknown` see a blank page.
**Should we add a 404 page?**

**Answer:** **Yes** — add a **catch-all** route (`path: '*'`) with a **404** component (and link home). Improves **polish** and **deep-link** failures. **Priority:** low but **cheap**.

---

### E7. Sidebar Not Responsive
`styles/app.css`: sidebar is fixed at 240px with no mobile breakpoint. On mobile viewports, it would overflow or hide content.
**Is the web app intended for desktop only, or should we add responsive design?**

**Answer:** **Current positioning is desktop-first** (sidebar + dashboard layout). **If mobile web matters**, add **breakpoints** (collapse sidebar to **drawer** / **bottom nav** / **hamburger**). **If product is desktop-only** short-term, **document** that and optionally show a **minimal** “use desktop” banner — **decision is product**, not a code bug. **Technical debt:** medium if marketing sends mobile traffic.

---

### E8. Chat Messages Use Array Index as Key
`components/broto/BrotoChat.tsx` line 49: `messages.map((msg, i) => <div key={i}>`. Using array index as key causes issues if messages are reordered or filtered.
**Should we use unique message IDs as keys?**

**Answer:** **Yes** — add **`id: string`** to messages (`crypto.randomUUID()` or incremental client id) and **`key={msg.id}`**. Index keys are **OK only** for append-only lists; **assistant error path** inserts can still be append-only — **stable ids** are safer for future **edit/delete**. **Priority:** low–medium (matches mobile chat D7).

---

### E9. No Error Boundaries in Web App
Like the mobile app, there are zero Error Boundary components. A component crash takes down the entire page.
**Should we add error boundaries?**

**Answer:** **Yes** — wrap **`AppShell`** outlet or **each top-level page** with a **class** error boundary (React 18) and a **fallback** UI + reload. Pair with **Sentry** (see A9). **Priority:** medium before broad release.

---

### E10. CSS Dark Mode Only — No Light Mode
`styles/app.css`: all CSS variables assume a dark theme. No `prefers-color-scheme` media query.
**Is the web app intentionally dark-only?**

**Answer:** **Yes — intentional** for the current Broto brand (dark + green). **`prefers-color-scheme`** light theme is **optional** product work; **not required** unless accessibility or user demand requires it. **Document** as **dark-only** for now.

---

### E11. Inconsistent DEFAULT_AREAS — Typo Between Pages
`pages/Home.tsx` line 14-19 and `pages/Progress.tsx` line 8-13 both define `DEFAULT_AREAS` but with different accent patterns ("Ciencias" vs "Ciências").
**Should this be a shared constant from `@broto/shared`?**

**Answer:** **Yes — one source of truth.** `Home.tsx` uses **accented** labels (“Ciências…”, “Matemática”); **`Progress.tsx`** uses **unaccented** strings (“Ciencias…”, “Matematica”) — **user-visible inconsistency** and future i18n pain. **Fix:** define **`DEFAULT_AREAS`** (or build from **`AREA_CONFIG`** in `lib/area-config.ts` so labels match the rest of the app) in **one module** (`lib/default-areas.ts` or similar) and import in both pages. **`@broto/shared`:** only if **mobile** needs the **same** default skeleton — otherwise **web-local** is enough; shared **keys** already exist via areas JSON/types. I want the accented ones.

---

### E12. Date Calculation Logic Duplicated
Week/date helpers exist in both `lib/routine.ts` (lines 12-27) and `components/routine/WeekStrip.tsx` (lines 12-27) — duplicated.
**Should these be extracted to a shared utility?**

**Answer:** **Yes — extract** to e.g. **`lib/week-calendar.ts`**: **`getSegundaDaSemana`**, **`datasDaSemana`**, and align **`hojeIdx`** / **`formatarSemana`** as needed. **Important:** `WeekStrip`’s `getSegundaDaSemana` calls **`setHours(0,0,0,0)`** on the Monday anchor; **`routine.ts`** does **not** — subtle **off-by-timezone** / **DST** bugs if left duplicated and divergent. **Single implementation** + **unit tests** for “week strip” vs “rotina” using the same anchor. **Priority:** medium (correctness + DRY).

---

## F. ADMIN PANEL

### F1. Console Logging Supabase Credentials
`lib/supabase.ts` lines 6-7: `console.log('[Supabase] URL:', url)` and `console.log('[Supabase] Key exists:', !!key, 'length:', key?.length)`. This logs sensitive info in production.
**Should we remove these console.log statements or gate them behind `import.meta.env.DEV`?**

**Answer:** **Remove or gate.** Logging the **Supabase URL** and **anon key length** in **production** is **unnecessary noise** and trains users to leak env details in screenshots. The **anon** key is public by design, but **still** avoid logging it. **Use `if (import.meta.env.DEV) { … }`** or a small `debug` flag. **Priority:** high (one-line fix).

---

### F2. Missing Authorization on Delete Operations
`hooks/useClasses.ts` lines 72-81: `deleteClass()` has no check that the admin's organization matches the class's organization. Similarly, `useMaterials.ts` lines 106-115: `deleteMaterial()` has no org check.
**Are we relying entirely on RLS for this, or should we add client-side validation too?**

**Answer:** **Primary enforcement = RLS.** Policies on `classes` / `materials` should allow **DELETE/UPDATE** only when the row belongs to the admin’s **organization** (via `admin_profiles`). If RLS is correct, **malicious `.eq('id', …)`** from the client **fails** with no rows affected / policy error. **Client-side** `organization_id` checks are **defense in depth** (clearer errors, less reliance on error codes) — **optional** but nice for UX. **Action:** **audit RLS** for delete paths; add **`.eq('organization_id', admin.organization_id)`** in queries if policies ever loosen. **Priority:** verify RLS **high**; client guard **medium**.

---

### F3. Student Detail Page — No Authorization Check
`pages/StudentDetail.tsx`: fetches student data by `studentId` URL param without verifying the student is enrolled in a class belonging to the admin's organization.
**Should we add a check that the student belongs to the admin's org?** (Or is RLS sufficient?)

**Answer:** **RLS must enforce** that an admin only reads **students tied to their org** (e.g. via **`enrollments` → `classes.organization_id`**). The page currently queries **`users`**, **`pets`**, **`topic_performance`** by **`studentId` alone** — **if** RLS on those tables only checks “own user,” an admin might **not** see data **or** policies must explicitly allow **org-scoped** reads. **Best practice:** fetch through a **single query** that proves membership — e.g. **`enrollments`** where **`class_id = :classId`** and **`student_id = :studentId`** and class org matches admin — then load profile/perf **only after** that passes. **Don’t rely on URL params** for security. **Priority:** **high** — confirm policies match intended access; add query/join if not.

---

### F4. No 404 Route in Admin
`router.tsx`: no catch-all route. Unknown paths show a blank page.
**Should we add a 404 page?**

**Answer:** **Yes** — add **`path: '*'`** with a small **NotFound** component linking to **`/`** or **dashboard**. Same rationale as web **E6**. **Priority:** low, quick win.

---

### F5. Login Page Accessible When Authenticated
`router.tsx`: the `/login` route has no guard. An already-authenticated admin can navigate back to the login page.
**Should we redirect authenticated users away from `/login`?**

**Answer:** **Yes.** Wrap **`Login`** in a **guard** (or inside **`Login`**: if `supabase.auth.getSession()` has user + **`admin_profiles`** exists, **`Navigate` to `/`**). Prevents confusing UX and duplicate sessions. **Priority:** medium.

---

### F6. All Inline Styles — No CSS Framework
Every component uses inline `style={{}}` objects. Button styles (green `#2e7d32`, borderRadius 8, etc.) are duplicated 20+ times. Modal overlay patterns are duplicated 3 times.
**Should we extract shared styles, introduce a CSS framework (Tailwind?), or at minimum create shared style constants?**

**Answer:** **Minimum:** **`theme.ts`** (or **`styles/tokens.ts`**) with **shared colors**, **radii**, **spacing**, and **button/card** style objects — **no need** for Tailwind if the team wants to stay inline-first. **Better:** **`@broto/ui`** (if revived) **or** a thin **`admin/ui`** folder with **`Button`**, **`Card`**, **`ModalShell`**. **Tailwind** is optional — only if you want **utility speed** and **consistent responsive** rules. **Priority:** medium (maintainability); **not** blocking MVP.

---

### F7. Material Indexing Fire-and-Forget with No Retry
`hooks/useMaterials.ts`: `triggerIndex()` calls the edge function and then immediately refetches materials. If indexing fails silently, the material stays "pending" forever with no retry mechanism or admin notification.
**Should we add status polling, retry logic, or admin alerts for failed indexing?**

**Answer:** **Yes — improve reliability.** Today failures only hit **`console.error`**; **`index_status`** can stay **`pending`/`failed`** indefinitely. **MVP+:** **(1)** surface **`failed`** in the UI with **Retry** (re-invoke `material-index`); **(2)** **bounded retry** (exponential backoff) inside the **Edge Function** or a **cron** that requeues `pending` older than N minutes; **(3)** optional **toast** when a row stays **`indexing`** too long. **Polling** the row on an interval after upload is acceptable for small volumes. **Priority:** high once indexing is business-critical.

---

### F8. Large Data Sets Without Pagination
`ClassIndicatorsPanel.tsx` and `StudentDetail.tsx` render all students/topics in a single table with no pagination.
**What's the expected class size?** If it could be 100+ students, should we add pagination or virtualization?

**Answer:** **Product-dependent.** **&lt; ~50 students** — full table is usually fine. **100+** — add **pagination** (server-side `limit/offset` or keyset) or **`react-window`** / **`FlashList`** for the table body. **Topics** list on **StudentDetail** can grow — same approach. **Decide** a **target max** (e.g. 200) and **load-test** the indicators query. **Priority:** scales with expected **real** class sizes.

---

### F9. Hardcoded Green (#2e7d32) — No Org Branding
The admin UI uses hardcoded green throughout. The `organizations` table has a `config` JSONB field that could store brand colors, but it's never used.
**Should the admin UI respect the organization's brand color?**

**Answer:** **Yes — aligned with white-label roadmap** (`organizations.config.primary_color`, etc.). **Phase:** can match **Phase 2** (see architecture answers) — **inject CSS variables** on app load from **`organizations.config`** for **primary**, **sidebar accent**, **buttons**. Until then, **single default** green is acceptable. **Priority:** medium — **after** core admin flows are stable.

---

### F10. No Form Validation Library
Login, CreateClass, and MaterialUpload forms use only HTML5 validation. No JavaScript validation (react-hook-form, zod, etc.).
**Should we add proper client-side validation with meaningful error messages?**

**Answer:** **Recommended for production forms.** **`react-hook-form` + `zod`** (or **Valibot**) gives **schema reuse**, **accessible errors**, and **consistent** messages (e.g. class name length, URL shape, file size). **HTML5** alone is **not enough** for UX and **custom** rules. **Priority:** medium before many admins use the panel; **low** for internal-only MVP.

---

### F11. Missing Keyboard Accessibility in Modals
Modals (class edit, delete confirmation, create class) don't trap focus, don't handle ESC key, and don't manage tab order.
**Should we implement proper modal accessibility?**

**Answer:** **Yes — WCAG-aligned modals:** **focus trap**, **ESC to close**, **return focus** to trigger, **`aria-modal` / `role="dialog"`**. Fastest path: **Radix UI** `@radix-ui/react-dialog` (or **Headless UI**) — small bundle, **keyboard** handled. **Priority:** **high** if public/compliance; **medium** for internal-only.

---

### F12. No Confirmation on Material Deletion
`useMaterials.ts` `deleteMaterial()` has no confirmation dialog (unlike class deletion which has one).
**Should we add a confirmation before deleting materials?**

**Answer (validated):** **Yes — always** show a **confirmation modal** before **`deleteMaterial()`** (destructive, may delete indexed content). Match the **class delete** UX pattern; optional extra line if **`index_status === 'indexed'`** (stronger warning).

---

### F13. Class Deletion — Cascade Behavior Unverified
The delete confirmation warns "All materials and enrollments will be removed," but the migration doesn't define `ON DELETE CASCADE` on the `materials.class_id` or `enrollments.class_id` foreign keys.
**Does cascade deletion actually work?** Should we verify and add explicit cascade rules?

**Answer (validated + technical):** **`enrollments.class_id`** and **`materials.class_id`** reference **`classes(id)`** with **no `ON DELETE CASCADE`** — PostgreSQL defaults to **`NO ACTION` / `RESTRICT`**: **`DELETE` on `classes` fails** if any child row still exists. So **automatic “wipe everything” cascade does not happen** without triggers or explicit deletes.

**Product intent (validated):** **Do not** rely on blind cascade. **Delete class** only when **there are no enrollments** (and, in practice, **no materials** either — otherwise the FK still blocks unless materials are removed first). **Desativar turma** (`is_active`) must remain available anytime. **Desmatricular** alunos ( **`enrollments` → `inactive` or delete row** per product rules) must be supported. **Every** delete/deactivate **must** use a **confirmation modal**.

**Implementation:** enforce **in app** (count enrollments + materials) **before** delete; optionally add **DB guard** (e.g. trigger or **restricted** `DELETE` policy). **Avoid** adding **`ON DELETE CASCADE`** unless you explicitly want **hard delete** of children — **not** aligned with the above without review.

---

### F14. No Admin Action Audit Log
No logging of admin actions (class creation, deletion, material upload, student view). For a school-facing product, this could be important for compliance.
**Should we add admin action logging?**

**Answer (validated):** **Phase 2** — **not** required for MVP. When needed: **`admin_audit_log`** (or Supabase **Logflare** / external SIEM) with **actor**, **action**, **resource**, **timestamp**, **metadata**; **retention** and **LGPD** review. **MVP:** rely on **Supabase logs** / **Edge Function logs** for debugging only.

---

## G. SHARED PACKAGES & MONOREPO

### G1. No Build Step in Shared Packages
Both `@broto/shared` and `@broto/ui` point `main`/`exports` directly to TypeScript source (`./src/index.ts`). There's no build step, no dist folder, no compiled output.
**Is this intentional (relying on consuming apps' bundlers to compile)?** Or should we add a build step for proper package resolution?

**Answer:** **Intentional and common** in TS monorepos consumed only by **Vite/Expo bundlers** — they compile workspace packages. **Add `tsc --build` + `dist/`** only if you need **publishable npm packages**, **non-bundler consumers**, or **stricter** package boundaries. **Priority:** low unless publishing packages.

---

### G2. Missing tsconfig.json in @broto/ui
`packages/ui/` has no `tsconfig.json`, unlike `packages/shared/`. TypeScript compilation relies entirely on the consuming app's configuration.
**Should we add a dedicated tsconfig?**

**Answer:** **Yes — recommended** for editor DX and **`tsc -p packages/ui`** in CI: extend root or **`@tsconfig/strict`**, align with **`packages/shared`**. Low effort; avoids “works in app A, fails in app B” drift.

---

### G3. Duplicated API Client Logic
`apps/web/src/lib/api-client.ts` (90 lines) and `apps/mobile/lib/api-client.ts` (123 lines) share ~70% of their code (same `ApiError` class, same `pathToFunctionName`). Mobile adds 401 handling that web lacks.
**Should we extract a shared API client to `@broto/shared` with platform-specific adapters?**

**Answer:** **Yes — extract shared core** (`ApiError`, `pathToFunctionName`, URL building) into **`@broto/shared`**; keep **thin wrappers** for **`fetch`** vs **native networking** and **401** behavior per platform. **Align** web to handle **401** consistently with mobile where applicable.

---

### G4. Duplicated createCachedHook
`apps/web/src/hooks/createCachedHook.ts` (66 lines) and `apps/mobile/hooks/create-cached-hook.ts` (82 lines) are forks. Mobile has a superior `refreshIfStale()` with a 30-second window that web lacks.
**Should we consolidate into `@broto/shared` using the mobile version as the base?**

**Answer:** **Yes — one implementation** (mobile variant + **D2 race fix**) in **`@broto/shared`**, imported by web/mobile; **delete** duplicate files. **Priority:** medium (reduces divergence bugs).

---

### G5. Area Config Divergence
Web has a minimal area-config (17 lines, basic labels/colors), while mobile has a rich version (90 lines with gradients, text colors, short labels, alternate icons).
**Should the rich mobile config be the single source of truth in `@broto/shared`?**

**Answer:** **Partially.** **Shared:** **keys**, **labels**, **base colors** as **data** in **`@broto/shared`**. **Platform-specific:** **icons** (`lucide-react` vs **native**) and **gradient objects** stay in each app — **don’t** force RN types into web-only packages. Matches earlier **A6/E11** direction.

---

### G6. normalizeClassCode Exported but Never Used
`packages/shared/src/utils/class-code.ts` exports `normalizeClassCode()` but it's never imported anywhere. Only `generateClassCode()` is used (in admin).
**Is this dead code, or is it planned for future use?**

**Answer:** **`normalizeClassCode`** = **`toUpperCase().trim()`** — meant for **join / search inputs** so **`enem26`** and **` ENEM26 `** match. **Not dead conceptually** — **wire it** in **student join UI** and **`class-join`** payload **before** comparing, **or** remove the export until used (**YAGNI**). Prefer **use** over delete if join UX ships soon.

---

### G7. No .env.example Files
No app has a `.env.example` documenting required environment variables. New developers have to guess which variables are needed.
**Should we add `.env.example` files to each app?**

**Answer:** **Yes** — root or per-app **`.env.example`** listing **`VITE_*`**, **`EXPO_PUBLIC_*`**, Supabase URL/key placeholders, **`SERVICE_SECRET`** for local Edge testing. **Priority:** high for onboarding.

---

### G8. Workspace Dependencies Use Wildcard Versions
All apps use `"@broto/shared": "*"` and `"@broto/ui": "*"`.
**Is this acceptable for a monorepo, or should we pin workspace protocol versions (`workspace:*`)?**

**Answer:** **`*` works** with npm workspaces in-repo. **`workspace:*`** (pnpm/Yarn) is **clearer intent**. **Either** is fine; **migrate** when adopting pnpm. **Not** a functional issue today.

---

## H. CROSS-CUTTING CONCERNS

### H1. No Global Error Handling for Supabase Auth
Across all three apps, auth error handling is inconsistent:
- Mobile has a `handlingUnauthorized` flag with a 2-second timeout (potential race condition)
- Web has no 401 handling in the API client
- Admin has no 401 handling at all
**Should we implement a unified auth error handler across all apps?**

**Answer:** **Yes — shared policy:** on **401/403** from Edge/PostgREST, **clear session**, **redirect to login**, **single toast** (optional). **Mobile timeout** should be replaced with **deterministic** flow (no arbitrary **2s**). **Priority:** high for security UX parity.

---

### H2. No Input Sanitization Anywhere
No app sanitizes user input before display or storage. Text inputs (class names, student names, chat messages) go directly to the API without sanitization.
**Should we add input sanitization at the application boundary?**

**Answer:** **Defense in depth:** **trim/max length** on client; **server-side validation** on Edge/DB; **HTML output** sanitized (**DOMPurify** for web — see **E1**). **Chat** trust model: still **rate-limit** and **validate size** server-side. **Priority:** high for any **HTML**; **medium** for plain text.

---

### H3. Unsafe Type Casting Pattern Throughout
All apps use `as` type assertions on Supabase responses without runtime validation:
- `data as Class[]` (admin/useClasses.ts)
- `data as unknown as Class` (mobile/ClassContext.tsx)
- `data as { current_class_id?: string }` (web/ClassContext.tsx)
**Should we introduce runtime validation (Zod schemas) for API responses?**

**Answer:** **Incremental Zod** (or **Valibot**) for **high-risk** shapes (auth, payments later, **join** payloads). **Supabase generated types** reduce drift; **runtime** catches **schema migrations** vs stale clients. **Priority:** medium — start with **shared** schemas for **`Class`**, **`Organization`**, **`Material`**.

---

### H4. No Loading Skeleton Consistency
Each app handles loading differently: mobile uses custom skeletons, web uses dots/text, admin uses plain "Carregando..." text. No shared loading component pattern.
**Should we standardize loading patterns?** Is the `@broto/ui` Spinner intended for this?

**Answer:** **Standardize** on a **small set**: **Spinner** + **skeleton blocks** per surface. **`@broto/ui` Spinner** is unused today — **either** adopt it **or** remove the package (**A5**). **Priority:** low–medium (polish).

---

### H5. No Offline Support in Any App
No app has offline capabilities. If the network drops mid-session, all data becomes unavailable. For a mobile study app, this is particularly impactful.
**Is offline support planned?** At least for question browsing and progress viewing?

**Answer (validated):** **Phase 2** — **not** MVP-critical; requires **cache strategy**, **sync**, **conflict resolution**. **MVP:** graceful **error states** + **retry** when offline.

---

### H6. No Push Notifications
No push notification infrastructure exists (no FCM/APNs setup, no notification service).
**Are push notifications planned?** For what use cases (study reminders, streak alerts, teacher messages)?

**Answer (validated):** **Desired for MVP:** **study reminders** + **streak alerts** (and optionally **teacher/class** messages later). **Requires:** **Expo Notifications** / **FCM** + **server-side** scheduling/preferences + **LGPD** consent. **Web push** is secondary.

---

### H7. Supabase Client Initialization Duplicated
Each app creates its own Supabase client with slightly different logic (admin has debug logging, mobile has AsyncStorage, web is minimal). Environment variable names also differ (`EXPO_PUBLIC_*` vs `VITE_*`).
**Should the initialization logic be consolidated where possible?**

**Answer:** **Keep platform split** (AsyncStorage **vs** none) but **extract** **`createSupabaseClient({ storage })`** in **`@broto/shared`** or **`packages/supabase-client`** with **documented env mapping**. **Remove** production **console logs** (**F1**).

---

### H8. No Environment Variable Validation
No app validates that required environment variables are set before creating clients. If `VITE_SUPABASE_URL` is missing, `createClient(undefined, undefined)` is called, causing cryptic runtime errors.
**Should we add startup validation for required env vars?**

**Answer:** **Yes** — **`zod`**/`valibot` **`env` schema** at app entry (fail fast with readable error). **Priority:** high.

---

### H9. TypeScript Strict Settings Inconsistent
Admin/Web have `noUnusedLocals: false` and `noUnusedParameters: false` (linting relaxed). Mobile uses Expo's base config. Shared package uses `moduleResolution: "bundler"`.
**Should we enforce consistent, strict TypeScript settings across the monorepo?**

**Answer:** **Trend toward stricter** in **`shared`** + apps; **Expo** may constrain some flags — use **extends** + **incremental** tightening. **Pair with ESLint** for unused vars if TS flags are noisy. **Priority:** medium.

---

### H10. No Linting or Formatting Configuration
No ESLint, Prettier, or other linting tools are configured in any package.json or at the root level. Code formatting varies (semicolons in some files, not in others; 2-space vs 4-space indentation).
**Should we add ESLint + Prettier with shared configs?**

**Answer:** **Yes** — root **`eslint.config`** + **Prettier** + **lint-staged** (optional). **Highest ROI** before multi-contributor PRs. **Priority:** medium–high.

---

## I. POTENTIAL BUGS

### I1. NaN in Accuracy Calculation
`apps/mobile/app/(tabs)/index.tsx` line 328: `Math.round((acertosHoje / questoesHoje) * 100)` returns `NaN` when `questoesHoje === 0`. The code handles this at line 329 with a fallback, but the intermediate NaN could propagate if the fallback logic changes.
**Should we add an explicit guard: `questoesHoje > 0 ? ... : 0`?**

**Answer:** **Yes — guard first** (`if (questoesHoje <= 0)`) so **`accuracyPct`** never touches **`NaN`** during refactors. **Micro-fix**, **low risk**.

---

### I2. Firefly Animations Don't Pause on Screen Blur
Screens with firefly animations (`_layout.tsx`, `login.tsx`, `study.tsx`, `questions.tsx`) don't pause animations when the screen loses focus. This wastes CPU/battery on inactive screens.
**Should we use `useFocusEffect` to start/stop animations?** (questions.tsx already does this, but others don't)

**Answer:** **Yes** — align with **D1**: **pause/cancel** Reanimated work when unfocused. **Priority:** medium.

---

### I3. Performance History Not Cleared on Logout
`apps/web/src/lib/performance-history.ts` and `daily-missions.ts` use localStorage but data isn't cleared when the user logs out. A different user logging in sees the previous user's performance data.
**Should we clear localStorage on signOut?**

**Answer:** **Yes** — on **logout**, clear **namespaced** keys (`broto:*`) or **prefix by userId** (**E4**). **Same pattern** for **daily-missions** + **perf** + any **`broto:`** storage.

---

### I4. material-index Creates Orphaned Notebooks on Error
If notebook creation succeeds but material indexing fails, a notebook exists with no materials. The class's `notebook_id` is set but `notebook_status` may be incorrect.
**Should we implement a cleanup/rollback mechanism for failed indexing?**

**Answer:** **Yes — transactional mindset:** on **failure**, set **`notebook_status = 'error'`**, allow **retry**, optional **cleanup** job for orphan **NotebookLM** resources. **Idempotent** indexing helps. **Align** with **F7**.

---

### I5. class-join Doesn't Check for Duplicate Enrollment
`class-join/index.ts` inserts into `enrollments` without checking if the user is already enrolled. If there's no unique constraint on `(class_id, student_id)`, duplicate enrollments could be created.
**Is there a unique constraint?** If not, should we add one and handle the conflict?

**Answer:** **Unique constraint exists:** migration **`unique(class_id, student_id)`** on **`enrollments`**. **`upsert`** with **`onConflict: "class_id,student_id"`** — **no duplicate rows**; **re-join** updates the same row. **Still** return **200** with clear messaging if already enrolled.

---

### I6. Timezone-Dependent Streak Logic
The pet streak relies on the server's understanding of "today" vs. the client's local date. If the server resets at UTC midnight but the student is in UTC-3 (Brazil), there could be a 3-hour window where streak behavior is unexpected.
**How is the streak reset logic handled server-side?** Is it timezone-aware?

**Answer:** **Verify implementation** where **`users.streak` / pet** are updated (Edge or client). **Ideal:** **date in user TZ** (or **America/Sao_Paulo** default) stored as **`last_study_date`** + **compare** to **yesterday** in same TZ. **Document** behavior; **add tests** around **UTC boundary**. **Push notifications** (**H6**) should use the **same** definition of “day”.

---

### I7. useQuestionsFilters — topicosRef Can Desync from State
`apps/mobile/hooks/use-questions-filters.ts` lines 376-415 and equivalent web file: `topicosRef.current` is used alongside React state for topics. If `selectedTopico` updates but the ref doesn't sync, the filter could show stale data.
**Should the ref be eliminated in favor of state only?**

**Answer:** **Prefer single source of truth** — **`useState`/`useReducer`** + **`useEffect`** to sync derived data; use **ref** only for **non-render** values (e.g. **abort**). **Refactor** when touching filters next. **Priority:** medium.

---

### I8. Web BrotoChat — No Message Persistence
`apps/web/src/components/broto/BrotoChat.tsx` and `apps/web/src/pages/BrotoPage.tsx` store messages in component state. Navigating away from the chat page loses the entire conversation.
**Should chat messages be persisted (localStorage, context, or server-side)?**

**Answer (validated):** **Local persistence** — **`localStorage`** (or **`sessionStorage`** if session-only) keyed by **user id** + **class/context**, **debounced** writes, **size cap**. **Server history** is phase 2+. **Privacy:** don’t log secrets.

---

### I9. Admin ClassDetail — State Not Reset on Route Change
`pages/ClassDetail.tsx` lines 17-27: state variables (`editing`, `editName`, `editDescription`) persist across route changes. If the admin navigates from Class A to Class B, they might see Class A's edit state briefly.
**Should state reset in useEffect cleanup?**

**Answer:** **Yes** — **`useEffect(() => { … reset }, [classId])`** or **key** the route component by **`classId`**. **Priority:** medium UX bug.

---

### I10. Mobile onRefresh — No Loading Guard
`app/(tabs)/index.tsx` lines 415-422: if the user pulls-to-refresh while already loading, duplicate API calls fire. No check for `if (refreshing || loading) return`.
**Should we add a loading guard?**

**Answer:** **Yes** — **`if (refreshing) return`** at start of **`onRefresh`**; align with **D5** (await completion). **Priority:** low–medium.

---

## J. PERFORMANCE

### J1. Inline Style Objects Everywhere
All three web apps (web, admin, UI package) create new style objects inline on every render. This prevents React.memo optimization and creates unnecessary garbage collection pressure.
**Should we migrate to CSS modules, Tailwind, or at minimum `useMemo` for expensive style objects?**

**Answer:** **Pragmatic path:** **`useMemo`** for **large** style objects; **CSS variables** + **classes** for static layout; **Tailwind/CSS modules** if team wants **design system velocity**. **Not** an emergency unless profiling shows GC issues.

---

### J2. Missing React.memo on List Items
Components rendered in `.map()` loops across all apps (MissionCard, AreaCard, FocusCard, DayCard, student rows, material rows) are not wrapped in `React.memo`.
**Should we memoize frequently-rendered list item components?**

**Answer:** **Profile first** — **`React.memo`** helps when **parent re-renders often** and props are **stable**. **Avoid** premature memo everywhere. **Priority:** low until **slow lists** measured.

---

### J3. No Request Deduplication in Admin/Web
If multiple components mount with the same data dependency, each fires its own Supabase query. No React Query, SWR, or deduplication layer exists.
**Should we add a data fetching library (TanStack Query) for deduplication and caching?**

**Answer (validated default):** **Not mandatory now** — current scale is fine; **`createCachedHook`** already dedupes some paths. **When** parallel mounts or **stale** data hurt UX, add **TanStack Query** **incrementally** (admin indicators, web progress). **Priority:** medium at growth inflection.

---

### J4. ClassIndicatorsPanel — Expensive "Active Students" Query
`hooks/useClassIndicators.ts` lines 75-82: queries `user_question_answers` for all students in the last 7 days to determine "active" status. With large classes, this could be very slow.
**Should this be a database view, materialized view, or server-side aggregation?**

**Answer (validated default):** **Keep current** for **small/medium** classes; **optimize when needed:** **SQL view** or **RPC** returning **`student_id` → last_active_at`**, **indexed** on **`(user_id, created_at)`** (**B1**). **Materialized view** only at **large** scale. **Priority:** scales with **F8** class sizes.

---

### J5. No Image Optimization
Admin and web apps render user images (`<img src={student.image}>`) without lazy loading, placeholders, or size constraints.
**Should we add `loading="lazy"` and constrain image dimensions?**

**Answer:** **Yes — easy wins:** **`loading="lazy"`**, **`width`/`height`**, **`object-fit`**, **placeholder** / broken-image fallback. **Priority:** low–medium.

---

## SUMMARY

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| A. Architecture & Direction | 10 | 1 | 3 | 4 | 2 |
| B. Database & Backend Security | 9 | 3 | 3 | 2 | 1 |
| C. Edge Functions & API | 12 | 2 | 5 | 4 | 1 |
| D. Mobile App | 15 | 1 | 5 | 6 | 3 |
| E. Web App | 12 | 1 | 2 | 6 | 3 |
| F. Admin Panel | 14 | 1 | 4 | 6 | 3 |
| G. Shared Packages & Monorepo | 8 | 0 | 2 | 4 | 2 |
| H. Cross-Cutting Concerns | 10 | 0 | 3 | 5 | 2 |
| I. Potential Bugs | 10 | 0 | 4 | 5 | 1 |
| J. Performance | 5 | 0 | 1 | 3 | 1 |
| **TOTAL** | **105** | **9** | **32** | **45** | **19** |

---

*Answer each question above, then prompt me again so I can begin implementing the improvements based on your answers.*
