# BUSINESS_QUESTIONS.md

Broto EdTech — Business Logic, Domain & Behavior Audit
Date: 2026-04-23

> This document lists **every open question, undefined rule, inconsistency, edge case, and abuse vector** detected by inspecting the monorepo (`apps/mobile`, `apps/web`, `apps/admin`, `packages/shared`, `supabase/*`). **No solutions** — only precise, production-grade questions grouped by domain. Answers to these feed the product spec, contracts and test matrix.

---

## 1. Domain & Models

### 1.1 User / Identity
1. `users.cpf` is `UNIQUE` but optional and never validated. Is CPF **expected** to be collected at signup (PII)? If so — for what regulatory/commercial reason? If not, why keep a unique nullable column that will silently fail future inserts from the auth trigger (`NULLIF(meta->>'cpf','')`)?
2. Users collected at signup (`telefone`, `cpf`, `cidade`, `estado`) are written by the auth trigger, but never surfaced/editable in the user UI. Are these fields still required by the product? Who owns them?
3. `users.email` is `NOT NULL UNIQUE`. If a user changes their Supabase Auth email, is `public.users.email` supposed to stay in sync? There is no trigger to mirror updates — what is the contract?
4. `users.image` is a free-text URL with no upload flow. Is this field considered deprecated, unused, or will a profile-picture feature be added?
5. `users.data_enem` has no validation (can be in the past, far in the future, or unrelated to actual ENEM date). What is the business rule for "upcoming ENEM"? Is this user-owned data or a global constant?
6. `users.horas_disponiveis_por_dia` accepts values **1–12** in `user-onboarding`, but Settings (web) allows **1–12** and clamps server-side. Is 12h of study/day acceptable product reality? What is the pedagogical cap?
7. Student deletion: `ON DELETE CASCADE` reaches `pets`, `enrollments`, `user_question_answers`, `topic_performance`, `practice_sessions`, `organization_memberships`. **Is this the intended LGPD/GDPR policy** or do we want soft-delete / anonymization (e.g., retain answer logs for class analytics)?
8. Two different user schemas exist across migrations: the initial `create_users_pets` (2026-03-03) defines `nome NOT NULL`, `cpf UNIQUE`, `horas_disponiveis_por_dia DEFAULT 2`; the later foundation migration (2026-03-17) re-creates `users` with a looser shape and no CPF. Which is **the authoritative schema** for production?
9. `users.onboarding_profile` is a free-form JSONB with no DB constraint. What is the canonical shape? Who/what validates drift between edge function, UI and DB?
10. Is there any concept of "trial user" / "guest" / "anonymous onboarding"? Today every interaction requires an authenticated user — is this a product decision or a gap?

### 1.2 Pet / Broto (Gamification)
11. `pets.nome` was added in migration `20260222120000` and re-added in `20260422120000_pets_broto_nome_retry` because environments were out of sync. Is the production DB guaranteed to have this column? What is the authoritative recovery path when a user hits "pets.nome ausente"?
12. `pets.humor` and `pets.energia` exist as `INTEGER ... CHECK (0..100)` with default 100, but **no edge function ever writes them**. `pet-me` returns a *computed* humor (`45 + min(streak,10)*3`). Is the stored column deprecated? Who is the source of truth for humor?
13. `pets.moedas` exists on the schema, is never read or written. Is there a planned shop/economy, or should the column be removed? If shop planned: what items, prices, balance rules, anti-inflation guardrails?
14. `pets.fase` is stored with enum `semente|muda|planta|flor|especial`, but `pet-me` **re-derives** `fase` from `nivel`. Is the stored column authoritative or decorative? Can the two diverge?
15. `pets.nivel` is stored, but `answer-question` recomputes `nivel = floor(xp/100)+1` on every answer. Is "level" capped? `pet-me.faseFromNivel` maps `nivel ≥ 8 → especial`. What happens at nivel 100, 1 000? Is there a max level or prestige loop?
16. The mapping level→fase is hard-coded in both edge function and client constants. Should different organizations (`organizations.config.mascot_name`) override the phases? Today only the name is configurable — is that the product intent?
17. Where does the `'Broto'` default name live? `pet-me` falls back to it; `user-onboarding` writes `'Broto'` when the user skips; clients render `'Broto'` locally. Is this intentional white-label or a placeholder?
18. The 32-char limit on `pets.nome` is enforced in two places (PATCH `/api/pet/me` and onboarding) but not at the DB level. Is 32 correct? What about profanity, uniqueness or trademarked names (e.g., "Broto®")?

### 1.3 Organization / Class / Membership
19. `organizations.is_public = true` exposes the **entire row** (including `config` JSONB) to any authenticated user (RLS `mt_org_select_public`). Is the `config` guaranteed to be free of secrets / feature flags / billing info indefinitely? Who enforces this?
20. `organizations.owner_id` is now nullable (system orgs). Who is responsible for a system org? How do downstream flows (teacher invite, billing, support) behave when `owner_id IS NULL`?
21. Two parallel sources of staff identity exist: `admin_profiles` (legacy) and `organization_memberships`. PR-10 syncs `admin_profiles → memberships`, but there is no reverse sync and nothing stops an admin from editing only one table in the Supabase UI. Which is canonical? When will `admin_profiles` be retired?
22. `admin_profiles.role` allows `'owner' | 'teacher'`; `organization_memberships.role` allows `'student' | 'teacher' | 'org_admin' | 'owner'`. The `org_admin` role is not present in `admin_profiles`. Can a teacher be promoted to `org_admin` only via SQL? Is there a self-service admin UI for this?
23. `classes.access_code` is `UNIQUE NOT NULL` globally. Two orgs cannot have the same code. Is that intentional (global vanity codes) or an oversight (should be scoped per-org)?
24. `classes.access_code` is normalized via `upper(trim(...))` in `rpc_class_join`, but `generateClassCode()` (called from admin) may produce any format — what are the **code generation rules** (length, character set, collision policy, case-sensitivity)?
25. `classes.is_active = false` — RLS then blocks students from reading the class, but `enrollments` and `organization_memberships` remain `'active'`. What is the intended UX when a teacher deactivates a class: do students lose history, do stats keep counting, is there a grace period?
26. Class deletion (`deleteClass` in `useClasses.ts`) is a **hard delete** with no explicit cascade rules on `classes → materials/enrollments/practice_sessions(user_question_answers)`. What happens to each dependent row on delete? Is there a "soft archive" option?
27. `enrollments.status ∈ {active, inactive}` but there is no RLS write path for `authenticated` users to go from `active → inactive` (only `mt_enrollment_update_staff`). Can a student **leave** a class, or only the teacher removes them? What is the UX?
28. `enrollments` has `UNIQUE (class_id, student_id)` — reactivation reuses the row. Should we keep an audit trail of enroll/leave cycles, or is overwriting `status = 'active'` (losing previous `enrolled_at`) acceptable?
29. `users.current_class_id` and `users.current_organization_id` hold a single current context per user. What happens when a user is in **multiple classes/orgs**? Can they switch in UI? The mobile `OrganizationSwitcher` component exists — what are the switch side-effects (chat context, dashboard, routine, missions)?
30. `signup_defaults.default_class_id` forces every new auth user into `ENEM 2026` via `rpc_onboard_new_user_default_org`. Is the public ENEM class **mandatory** forever, or should there be opt-out / white-label signup routes where users join only via code?
31. The trigger `handle_new_user` creates a public membership+enrollment for every new `auth.users` row — including admins / teachers created via Supabase Auth. Is a teacher supposed to have an **active student enrollment in ENEM26**?

### 1.4 Material / Content
32. `materials.type ∈ {pdf, url, youtube, text}` — is `text` an inline document (>2KB) or just a title? It is stored in `source_url` (column name implies URL) with type='text'. What is the UX / size limit?
33. `materials.source_url` for `pdf` points to Supabase Storage public URL. Are those PDFs public by design, or protected? Student RLS grants access — but the `publicUrl` is accessible to anyone with the link. Is PDF content considered non-sensitive?
34. Material deletion removes the DB row but not the underlying storage file. What is the **cleanup contract**? Should dangling PDFs be purged? Billing side-effect?
35. `materials.index_status` has states `pending | indexing | indexed | failed`. What triggers re-index on a `failed` material? Is there exponential back-off? Max retries?
36. `material-index` has a **55 s client-side timeout** that flips status back to `pending`, but the remote NotebookLM indexing may still be in progress. Duplicated index when the client retries? Idempotency guarantees from the Python service?
37. Is there a **max number of materials / max file size / max total indexed content per class**? Today there is no explicit cap.
38. `classes.notebook_status` (`not_configured|indexing|ready|error`) vs `materials.index_status` — are they always consistent? Who owns transitions when a class has 10 materials in mixed states?

### 1.5 Questions / Answers / Topics
39. The question bank itself lives in a **static JSON** (`/data/question-topic-mapping.json`, `/{year}/details.json`), not in the DB. Who versions this bank? How do we handle questions that need to be corrected after release (a wrong-key alternative, a typo)?
40. `user_question_answers.question_id` is free-text referencing static JSON IDs. There is no FK, no validation. What prevents clients sending a bogus `questionId` and boosting XP? (See §5.)
41. `question_topic_mapping` is a PK `(question_id, topico_value)` — a question can map to **multiple topics**, but `answer-question` only uses `LIMIT 1` for `topic_performance` update. Is this **intentional** (one topic counted) or a bug (two topics should update)?
42. Migration `20260303120000` backfills `question_id='__legacy__'` for pre-existing rows with `NULL`. Are these answers still in production? Should they be purged, or considered valid for streak/stats?
43. The TOPICO map in `user-progress/index.ts` lists 20 topic slugs (5 per area). The static data file may contain more topics. What happens to unmapped topics? They fall into `'outros'` — is that the product intent or a gap?
44. Areas are referenced by **different keys** in different places: the DB `topic_performance` uses `topico_value` → derived area; `studyTodayByArea` uses area keys (`linguagens|ciencias-humanas|...`); mobile onboarding uses `humanas|natureza|matematica|linguagens`. Which is canonical? Where is the conversion?
45. Languages: `question.language ∈ {ingles, espanhol}` for Linguagens questions. The mock-exam pool has an `expandLinguagensIdiomas` flag — what's the exact rule when the student only picks one language and there are no questions for it?
46. Corpus boundaries: `MOCK_EXAM_YEAR_MIN=2015`, `MOCK_EXAM_YEAR_MAX=2023`. Is this stale (today 2026)? Should new yearly ENEM editions be auto-included?
47. `user_question_answers.acertou` trusts the **client** (`isCorrect` in request body). Is that acceptable? See §5.

### 1.6 Practice Sessions / Simulados
48. `practice_sessions.kind ∈ {student_mock, class_assignment}` — `class_assignment` has no write path yet. When will teachers be able to assign sessions? What is the contract (deadline? score weight? mandatory?)?
49. A session `practice_sessions` with no `completed_at` is "in progress". There is no TTL / auto-abandon. How long can a session stay open? What does "Continuar" mean after 3 months?
50. `practice_sessions.question_ids` is a JSONB array of question IDs. What if an ID is **removed from the static bank** between creation and play? The client silently loads `< N` questions.
51. `answer-question` verifies `questionId ∈ sess.question_ids` but does **not** prevent answering the **same question twice** within the same session. Multiple XP awards possible?
52. Outside a session (`sessionId=null`), the same user can answer the same `question_id` arbitrarily many times and accumulate XP. Is repeat-farming a concern? Should XP be awarded only once per question?
53. Practice session `summary` is written by the client on completion — also trusted. See §5.
54. The diagnostic mock (`ONBOARDING_DIAGNOSTIC_MOCK_CFG`: 20 questions, stratified by area) has no result-path back to `onboarding_profile.niveis`. What is the **business purpose** of the diagnostic if it doesn't update the skill-level estimates?
55. The mock-exam N range is **5–90**. ENEM has 180 questions (90 per day). Is 90 the cap because of one-day simulation? Should we support full 180?

### 1.7 Routine / Rotina
56. `gerarRotina` in `apps/web/src/lib/routine.ts` uses a hard-coded weekly `PATTERN = [0,1,2,3,0,1,-1]` (Monday–Sunday). Where do `horarios` (manha/tarde/noite) chosen in onboarding feed into the schedule? Today they seem unused.
57. The rotina is **purely client-derived** from `topic_performance`. Two users with the same data see the same rotina. Is there any personalization from `niveis` (self-assessment) or `metaNota`?
58. If the student adds a new area tomorrow, does the rotina automatically shift? Is there persistence of "completed days"? Today there is none — a student could "re-do Monday" every day.
59. Sunday is `-1` (rest day). Is that configurable per user/organization? Today it's hard-coded.
60. `duracaoMin = horasPorDia * 60` — if user chose 12h/day that's 720 min per day of a single subject. Is that a valid recommendation?

### 1.8 Daily Missions
61. Daily missions live in **client-local storage** (`broto:daily-missions:v1`), keyed by `todayLocalISO()` (device local TZ) while the server `pet-me.questoesHoje` uses **UTC**. Two counters, two timezones — which wins when they diverge (traveller at midnight, web vs mobile)?
62. Missions reset at midnight local time on the client. The server's `last_study_date` uses UTC. At what time does a "new day" start for streak/mission purposes? Define the canonical day-boundary.
63. Missions' XP (`30/20/50`) is rendered in the UI but **not awarded** anywhere. Does completing a mission give XP, or is the number cosmetic?
64. Missions are derived from "worst areas first" based on cumulative `progress.areas`. Are they supposed to reset daily, or roll over if unmet? Today they just disappear at 00:00 local.
65. Missions contain a "70% accuracy" goal on a third area. If the user has 4 answers and 4 correct (100%) but the goal expects `>=5 answers`, they stay at "locked". Is the 5-answer gate a product rule or arbitrary?
66. Clearing local storage ("limpar dados deste aparelho" in Settings) wipes mission progress. Is that intended? What about cross-device sync?

### 1.9 Chat (broto-chat / NotebookLM)
67. Chat requires the user to have `current_class_id` **and** an active enrollment. What does "talk to Broto" mean for the public ENEM26 class (every user)? Is there an org-agnostic fallback?
68. Max 50 messages, 4000 chars each, per request. Is there a per-user quota per day? A rate-limit? Today there's nothing.
69. `broto-chat` forwards `user_id` + `class_id` + the last user message to the Python NotebookLM service. Is there a logging/audit contract? Where are student questions stored? PII concerns?
70. `broto-chat` passes only the **last user message** (`lastUserMsg.content`) even though the client sends a full history. Is multi-turn context the server's responsibility (NotebookLM-side), or is that a bug?
71. `organizations.config.features.chat = true|false` exists but the edge function does not check it. Can an org **disable** chat today? What is the enforcement plane (UI-only vs server)?
72. Chat token cost: is the NotebookLM call paid per call? Where is cost attributed (per org, per student, per class)?

### 1.10 Onboarding
73. The "skip all" path calls `user-onboarding` with `metaNota: 0, niveis: {}, horarios: []`. Downstream (rotina, missions, diagnostic) treats absence identically. Is `metaNota: 0` semantically "no goal" or zero?
74. `onboarding_done: true` is set even for skip — can users re-enter onboarding later? No UI route exists. Is that the intended lifecycle?
75. The diagnostic mock is **optional**. If taken, does it weight `topic_performance`? Today it does: `answer-question` updates `topic_performance` during the diagnostic run. Is that correct (vs "dry-run for calibration only")?
76. `metaNota` clamp is `0..1000`. ENEM nota max ≈ 1000 (by CEP/INEP standards). Is `0` a valid goal? What's the **realistic minimum** to display / validate?
77. `niveis` keys on mobile use short names (`humanas`, `natureza`, `matematica`) but server / progress use `ciencias-humanas`, `ciencias-natureza`. Is there an integrity check? Today the server stores whatever the client sends.
78. `horarios` values are `{manha, tarde, noite}` — not tied to the `horasPorDia` (you can select 12h/day and no horario at all). Is that inconsistent state acceptable?

---

## 2. Business Rules

### 2.1 XP / Leveling
79. **XP formula**: every answer = `+10 XP`, correct = `+5 bonus` (total 15). There is no cap, no diminishing returns, no session bonus, no streak bonus. Is that the final formula? Are there balance constraints (answering 100 random questions/day = 1500 XP)?
80. **Level formula**: `nivel = floor(xp / 100) + 1`. Linear forever. Should leveling get harder? Is there an end-game?
81. Is there **retrograde XP**? E.g., deleting a bad answer or a teacher invalidating a question — do we rollback XP?
82. XP awarded on an **abandoned** session (user answers 5/20 and closes) is kept. Is that fair or should XP be session-gated?
83. Do diagnostic mock answers award XP? Today: yes. Intended?

### 2.2 Streak
84. Streak is incremented when `last_study_date = yesterday (UTC)`. If the user is in São Paulo (UTC-3), answering at 22 h local (= 01:00 UTC next day) advances the streak twice in one "local day". Is the streak day the **UTC day** or the **user's local day**?
85. Streak trigger is **any** answer (correct or not). Is answering 1 wrong question enough to keep the streak alive? Is that the product intent?
86. Streak freeze / grace day ("streak saver") — planned or not?
87. Streak recovery: there is no mechanism to recover a lost streak (no "streak freeze coin"). Is that acceptable?
88. What happens if the server clock is wrong, or if a user changes device TZ? No mitigation present.

### 2.3 Class Access
89. `access_code` is case-insensitive at join (`upper(trim(...))`). Is the **display** case consistent (admin creates it uppercase via generator, but `updateClass` allows arbitrary rename)?
90. Is there a **rate limit** on `class-join` to prevent brute-force of short codes? Today only CORS + 20-char length.
91. Can a user be in **multiple classes of the same org**? `rpc_class_join` replaces `current_class_id` each time — so only one active at once. Is that the rule, or a limitation?
92. After joining, a student's previous class enrollment stays `active`. When does a student **leave** a class (status='inactive')? No UX path.
93. Teacher's own enrollment: if the org owner joins with ENEM26 at signup (before admin_profile creation), they have a `student` role. Staff promotion must happen via SQL. Is that the intended admin onboarding?

### 2.4 Rotina / Study Plan
94. Rotina uses **inverse accuracy ordering** (worst first). Does this match the pedagogical requirement? What about spaced repetition, interleaving, forgetting curve?
95. Is rotina supposed to be **adjusted by organization** (e.g., a teacher assigning study topics overrides the algorithm)? `class_assignment` sessions hint at this.
96. Rotina "daily focus" is a single area. Is a multi-area day planned? What about reviewing redação?
97. Completion tracking: what marks a "day done"? Today nothing — it's cosmetic.

### 2.5 Missions
98. Missions are **generated on the client** (mobile + web) based on in-memory progress. Could different clients show different missions for the same user simultaneously? Is that acceptable?
99. Mission XP is never persisted. Is the product intent: (a) award XP per mission completion, (b) cosmetic only, (c) something else?
100. Weekly missions? Monthly missions? Only daily exist.

### 2.6 Mock-Exam (Simulados)
101. Stratification per area: `allocateStrataCounts` spreads `n` across areas. If `n=20, areas=4`, 5 each. If `n=21, areas=4`, rem=1 goes to the first area (order-dependent). Is that ordering **stable** and specified?
102. When a stratum is too small (pool has 3 matemática, need 5), the whole call **fails with POOL_TOO_SMALL**. Is that intended (user cannot run the simulado) or do we silently underfill?
103. When should a session be **auto-completed**? E.g., user answers 20/20 but never presses "Finalizar" — `completed_at` stays null.
104. Mock summary is built client-side, then sent in `/api/practice-session/complete`. The server accepts arbitrary JSON for `summary`. What's the trust model?
105. Can a user re-answer in a session after completion? `completed_at` is set but there is **no enforcement** preventing post-completion writes via `answer-question`.

### 2.7 Pet / Humor / Economy
106. `humor` is derived from streak. What happens at `streak = 0`? `humor = 45`. Is that the "sad" baseline? What UX cues reflect it?
107. Is there an anti-"farming happy pet" rule? If streak caps humor effect at 10, a 365-day streak and a 10-day streak give identical humor.
108. `moedas`: intended economy? Currency source, sink, conversion, refund policy, purchase mechanics — none exist today.
109. Phase transitions: are they announced to the user (notification / celebration)? Today nothing in the server.

---

## 3. Flows & State

### 3.1 Signup → First Session
110. `auth-signup` calls `auth.admin.createUser({ email_confirm: true })` — emails are **auto-confirmed**. Is that the final policy? Today **anyone can sign up with someone else's email** (no possession check).
111. Signup creates `public.users + pets + active membership in ENEM org + active enrollment in ENEM26 class`, all in the same transaction. If any fails, the auth user also fails — is this the intended transactional guarantee? What happens when `signup_defaults` is empty or class is inactive (`rpc_onboard_new_user_default_org` raises)?
112. After signup, the client calls `supabase.auth.signInWithPassword` directly (no extra verification). Is "signup = login" the UX intent? What about MFA?
113. Onboarding is optional (skip all). What's shown on Home **before** onboarding is done? Today the onboarding is gated by `onboardingDone`; the Home appears only after. Is that right, or should Home be the default and onboarding a pop-over?
114. Signup rate-limit is an **in-memory sliding window** per edge isolate. A cold start resets it; Supabase scales across isolates. What's the real per-user / per-IP quota, globally?
115. Is there a verification / captcha / email ownership path? Signup today is open to bots.

### 3.2 Login → Access
116. Non-admin user opens the **admin** app: login succeeds (Supabase auth), but `fetchAdminProfile` returns null → auto-signout with error. Is this **silent gating** acceptable? Should we hide the admin app URL?
117. Student signs in on mobile and web concurrently. Are sessions pinned per device? What if a session is invalidated on one (e.g., password change)?
118. Auto-signout on 401: mobile uses a `handlingUnauthorized` debounce; web calls `signOut` immediately + redirects. Is the behaviour symmetrical? What if the 401 is a **transient** network error masked as 401?
119. `AuthContext` listens to `onAuthStateChange`. There's no handling of `PASSWORD_RECOVERY`, `USER_UPDATED`, `TOKEN_REFRESH_FAILED`. Is that an accepted gap?

### 3.3 Class Join
120. What's the UX when a user joins a class in **another** org than the current one? `rpc_class_join` replaces `current_*`. Previous class stays active but disappears from Home — intended? Confusing?
121. The client cannot **leave** a class. What's the way out — call support?
122. If a class becomes `is_active = false` after a student joined, their enrollment stays active, Home chat breaks. What's the UX?
123. Can a teacher **re-issue** an access_code (rotate it to prevent further signups)? Today `updateClass` does not touch access_code — is there an API for rotation?

### 3.4 Onboarding → Diagnostic
124. After `onboarding POST`, the client calls `refreshUser + refreshPet` and then navigates. What if the diagnostic is started mid-flight (double POST)? Today the client calls `/api/user/onboarding` **again** before the mock — is idempotency guaranteed?
125. `handleSimulado` posts the onboarding **before** creating the session. If session creation fails, `onboarding_done` is already `true`. Is that a recoverable state?
126. Mobile and web have **parallel onboarding implementations** (see `apps/mobile/app/onboarding.tsx` and `apps/web/src/pages/Onboarding.tsx`). Are business rules guaranteed identical, or is drift expected?

### 3.5 Answering a Question
127. `answer-question` does these in order: insert answer → update topic_performance → update pet XP → update streak. Failures in topic_performance are logged and silenced (answer remains, XP not awarded only if `pet select` fails). Is this the right atomicity? Should XP + answer + streak be transactional?
128. No idempotency key on `/api/answer-question`. Network retries will award XP twice. Is that acceptable?
129. What is the contract when the **same question** is answered twice (in or out of a session)? Both rows are inserted; both award XP; topic_performance keeps incrementing (accuracy trending down/up). Is that intentional?
130. `streak` update is outside the core transaction: if the `users` UPDATE fails, XP + answer go through but streak stalls. Is that acceptable?

### 3.6 Mock-Exam Lifecycle
131. Create → answer N → complete. What if the user refreshes mid-exam? Client re-fetches by `sessionId`, but there is no persisted "currentIndex" or "timer". Define the **resumable contract**.
132. Are already-answered questions shown again if the user reopens the session?
133. `practice-session-complete` updates `completed_at` unconditionally (even if only 3/20 answered). Is that intended? Is a partially-completed session still valid for summary display?
134. Can a user re-run the **same session** after completion? `practice-session-get` still returns it; `answer-question` would still accept answers. Is the UX supposed to prevent this?
135. Can a user create **many sessions** back-to-back (abuse to farm XP)? Today yes.

### 3.7 Material Upload → Index → Ready
136. PDF upload: writes to Storage → inserts row with `index_status=pending` → fires `material-index` async. If the trigger call fails on the client, the row stays `pending` forever. Is there a backoff / scheduled retry job?
137. If the NotebookLM service returns success but class-`notebook_status` update fails, the class stays `indexing` while material shows `indexed`. What reconciles them?
138. When a teacher deletes a material mid-indexing, the async `material-index` call may still finish and mutate `classes.notebook_status=ready`. What's the contract? Should we cancel?
139. How many materials can coexist per class? What's the NotebookLM source limit per notebook?

### 3.8 Chat Lifecycle
140. Does the user's chat history persist across devices? Today messages live in whatever the client sends — there is **no server-side history** stored by our app. Is that the intent (NotebookLM holds it)?
141. If `organization.config.features.chat = false`, what is the expected UX? Hide the FAB? Show "disabled by your org"?

### 3.9 Organization Switch (Multi-Tenant)
142. Mobile has `OrganizationSwitcher.tsx`. Is multi-org student UX **supported** or preview? What happens to rotina, missions, progress stats when switching? Are they per-org or global?
143. `topic_performance` and `user_question_answers` have **no `organization_id`** column. Switching organizations does not scope the history. Is progress supposed to be global across orgs? Business confirmation needed.

### 3.10 Logout / Account Deletion
144. Signout clears `broto:*` localStorage on web. Mobile does not. Is cross-device cleanup symmetrical?
145. Is there a self-service **delete my account** flow? Nothing found. Regulatory requirement?

---

## 4. Edge Cases

### 4.1 Timezones & Dates
146. `streak` computation uses UTC-day. `daily-missions` uses local-day. `pet-me.questoesHoje` uses UTC-day. The Home "hoje" sections mix these. How do we **define** "today" for product purposes?
147. A user crosses a timezone boundary (travel). Does streak skip? Missions reset twice? Specify.
148. A user answers at 23:59 local; `created_at` lands in day `D+1` UTC. Streak increments for UTC day. UX shows "you studied yesterday" vs server logs "today". Reconcile.
149. Daylight Saving Time transitions — does the rotina `PATTERN` shift? Does the schedule fail on fall-back 02:00 duplicate hour?

### 4.2 Pet Edge Cases
150. `pet-me.xpToNextLevel` uses `nivel * 100` as cap, but actual level-up threshold is `floor(xp/100)+1`. At level 3, cap=300 yet user is at `xp=200`. `xpToNextLevel = 100`. Consistent or off-by-one?
151. A user with `xp=99999999` and `nivel=1000000`: does any UI break? Are numbers formatted?
152. If a user deletes all answers via admin, XP remains. Is that intentional?
153. Pet's `humor` computed from streak — what if streak is `NULL` (new user)? Today becomes `0` → humor `45`. Is that the "starter" state?

### 4.3 Class / Enrollment
154. A user's `current_class_id` points to a **soft-deactivated** class: RLS denies SELECT → chat fails with "Usuário não matriculado". UI doesn't know why. Specify the error copy.
155. `current_class_id` points to a class whose `organization_id` was changed (via SQL): `resolveActiveContext.isValid = false`. What should the app do? Today: silently shows "null" org.
156. Admin deletes a class: `enrollments.status` stays active (CASCADE not defined on `classes → enrollments` — needs verification). If not CASCADE, FK violation blocks deletion.
157. Two teachers in the same org both deactivate a class concurrently → no conflict, idempotent. Two teachers deleting concurrently → one wins, other gets NotFound. UX?
158. A student is deleted: `organization_memberships`, `enrollments`, `practice_sessions`, `user_question_answers`, `pets` CASCADE. Class indicators (`useClassIndicators`) still count the student until next fetch. Any eventual-consistency issue?

### 4.4 Mock-Exam
159. Pool too small when user filters by topic + year + language strictly: POOL_TOO_SMALL error. Do we degrade (loosen language/year) or hard-fail?
160. `shuffleInPlace` uses Math.random() — not cryptographically strong; is that acceptable?
161. `question_ids` duplicates are possible if caller sends duplicates (dedupe happens via `dedupePool` on pool entries, not on final `questionIds`). Define expected behavior.
162. A user answers a question, the question is later replaced (static JSON edit): `practice_sessions.question_ids` still references the old ID. Result summary breaks (`qById.get` misses).

### 4.5 Material / NotebookLM
163. Material of type `text` stores the body in `source_url` (column name misleading). If the body contains characters like `'https://...'` the UI might treat it as a URL. Define the rendering contract.
164. `material.source_url` for `youtube` type — what counts as a valid YouTube URL? No validation today.
165. Uploaded PDF with same `safeName` within the same ms has `Date.now()` prefix; can two rapid uploads collide? The path includes `${classId}/${Date.now()}_${safeName}` — date resolution is ms but we have no lock.
166. PDF storage public URL — anyone with the link reads the file. Is content considered public?
167. If `NOTEBOOKLM_SERVICE_URL` is unreachable, `material-index` fails → material stuck `pending`. Is there a recovery runbook?

### 4.6 Concurrency
168. Two `answer-question` requests racing for the same `question_id`: both insert answer rows; both compute topic_performance based on stale reads. Final accuracy may be wrong. Is optimistic locking planned?
169. Two `class-join` calls for the same user: `rpc_class_join` locks the user row. Two different access codes ping-pong `current_class_id`. Is last-write-wins the rule?
170. Two `user-onboarding` calls: onboarding is **not idempotent** on pet name ("Broto" → custom → skipped-resets to "Broto"). Define the rule.

### 4.7 Offline / Network
171. Mobile answer with no connection: client waits, user moves on. Server eventually receives stale answer. Any sequencing guarantee?
172. Mobile mock-exam offline: questions are loaded from static JSON over the network. No offline bundle — is that acceptable?

### 4.8 Data Drift Between Web/Mobile
173. Mobile uses 4-space + semicolons, web uses 2-space + no semicolons (per CLAUDE.md). Code duplication (onboarding, Home, rotina) — how are business-rule changes synced? Is there a review contract?
174. `daily-missions` has two implementations (mobile via AsyncStorage, web via localStorage), reading from `@broto/shared` core. Is the shared behaviour the contract, or is drift accepted?

---

## 5. Security & Abuse (Business-Level)

### 5.1 Trust Boundary
175. `answer-question` **trusts** the client-sent `isCorrect`. A malicious script can send `{questionId: 'X', isCorrect: true}` for every question and farm XP infinitely. Is server-side answer validation planned? (The correct answer is in the static JSON the client also reads — we have no truth source server-side.)
176. `answer-question` **trusts** client `timeSpentSec`. Aggregated time (e.g., dashboard "tempoEstudoSegHoje") can be inflated. Intended?
177. `practice-session-create` **trusts** client `questionIds`. A user can submit IDs of questions they won't actually answer, then `practice-session-complete` with a faked `summary` claiming `100%`. Trust model?
178. Client writes `practice_sessions.summary` to any JSON (only shallow object-check). It appears on `MockExamHistory`. Can a user inject large/abusive content?

### 5.2 Enumeration
179. `/api/class-join` with random codes: returns 404 for invalid, 200 for valid. No backoff, no captcha. Brute-forcing short codes possible. Is that acceptable?
180. `/api/auth/signup` returns `409 Este e-mail já está cadastrado` → email enumeration. Is that a compliance concern?

### 5.3 RLS Bypasses
181. `broto-chat` uses service_role and skips RLS. It validates `enrollment.status='active'` and `class_id` manually but does not validate `class.is_active`. Can a student chat after class deactivation?
182. `createServiceRoleClientUnsafe()` is widely used in edge functions. Every function's caller must validate authorization first. Is there a test matrix guaranteeing **no function** leaks data cross-tenant?
183. `rpc_class_join` is `SECURITY DEFINER` and takes `p_user_id` as parameter. Only `service_role` can execute it, but the edge function **trusts** `user.id` from JWT → passes that to RPC. If JWT validation were bypassed, arbitrary impersonation is possible. Is there a second check?
184. `app_rls_class_org_id(p_class_id, p_require_active)` — is used by multiple RLS policies. Verified that it fails closed on null. Is it audited for regressions?

### 5.4 PII / Data Protection
185. Do we retain `cpf`, `telefone`, `cidade`, `estado`, `data_nascimento` under LGPD? Who has access? How long? Can the user export / delete them?
186. Student answer history, topic performance, mock-exam summaries — who can see them? Teachers see aggregate; staff see individual via `mt_practice_sessions_select_staff`. Is consent required?
187. Chat questions are sent to NotebookLM (third party, Google). Do we disclose this in the TOS? Is there opt-out?
188. Materials (PDFs) stored in **public** Supabase Storage bucket `materials` — is the bucket really public? The code uses `getPublicUrl`. Intentional?

### 5.5 Abuse Vectors
189. Unlimited accounts: signup is open, email auto-confirmed. Burner farms of student accounts to join teachers' classes and skew stats.
190. Unlimited mock sessions: no per-user/day limit on `/api/practice-session/create`. Storage growth?
191. Unlimited material uploads per class: no cap; storage/processing cost.
192. Broto chat cost per org: no cap; teacher could be billed for infinite questions from students (or the platform absorbs).
193. `class_assignment` kind exists but is not implemented; a motivated client can create sessions with `kind='class_assignment'` — any filtering done? Today `practice-session-list` filters by `'student_mock'`, so it's hidden; is there any business logic that reacts to `class_assignment` now?

### 5.6 Admin & Teacher Abuse
194. A teacher can create an unlimited number of classes. Business rule?
195. A teacher can deactivate **any** class in their org. Can they deactivate another teacher's class? Today RLS says yes (org-wide). Intended?
196. A teacher can delete materials uploaded by another teacher. Intended?
197. `admin_profiles` can exist without a corresponding `organization_memberships` row (before PR-10 sync). Today an admin can be locked out between sync runs.
198. `org_admin` vs `owner` — what exclusive powers does `owner` have? Role hierarchy is declared in `authz.ts` but no function currently requires `owner`. Is that deliberate?

---

## 6. Data Integrity

### 6.1 Schema Contradictions
199. Two "initial" `users` schemas: `20260303000000_create_users_pets.sql` (strict NOT NULL `nome`) vs `20260317_foundation_organizations_classes.sql` (nullable `nome`, adds `streak INTEGER DEFAULT 0`). Which runs in production? Is the bridge migration idempotent against both starting states?
200. Two "initial" `pets` schemas: one with `humor/energia/moedas/fase/nome`, another with only `xp/nivel/created_at`. If a clean DB runs the foundation migration first, the richer columns are missing until the second migration runs. Is there a guaranteed migration order?
201. `user_question_answers`: the foundation migration creates it with just `(id, user_id, created_at)`. The backfill migration adds `question_id` and backfills `'__legacy__'`. Why keep legacy rows at all? Do they count for stats/streak today? (Yes — they feed `pet-me`).
202. Two migrations to add `pets.nome` (original + retry). If one environment ran only the first, does the second re-run safely? (It's `IF NOT EXISTS` so yes — but indicates migration drift.)
203. `pets.id` is `TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT` in one migration, but another initial migration has only `user_id` as PK. What is the effective PK in production?

### 6.2 Referential Integrity
204. `users.current_class_id` references `classes(id)` — no `ON DELETE` clause shown. If a class is deleted, does the FK block the delete, or cascade? What's the intended behaviour?
205. `classes.created_by` references `auth.users(id)` — nullable now. If the creator auth user is deleted, is `created_by` set null, the class deleted, or is the FK violated?
206. `organization_memberships.invited_by` ON DELETE SET NULL — is that the right behaviour?
207. `practice_sessions.user_id` CASCADE — OK. What about `user_question_answers.session_id` → `practice_sessions.id`? It's `SET NULL` on delete — answer history preserved sans session. Intended?
208. Cascade: deleting a user purges their answers. This wipes the historical record a teacher might be analysing. Is this the intended LGPD treatment?

### 6.3 Enum & Constraint Coverage
209. `practice_sessions.kind` check `{student_mock, class_assignment}` — if we add a new kind (`review_session`), do we need a migration? Is this extension path documented?
210. `organization_memberships.role` check `{student, teacher, org_admin, owner}` — mirrors `admin_profiles.role CHECK (role in ('owner', 'teacher'))`. Out of sync. Which wins if they diverge?
211. `organizations.config` is an arbitrary JSONB. There is no schema validation. A typo in `features.chat` silently disables the feature forever. Validation strategy?
212. `materials.type ∈ {pdf, url, youtube, text}` — hard-coded. What about images, audio, docx?

### 6.4 Orphan / Dangling Data
213. `topic_performance` can reference a `topico_value` not present in `question_topic_mapping` (static JSON reseeds, topic renames). Handling: `humanizeTopico` slug. Is that acceptable?
214. `user_question_answers.question_id = '__legacy__'` — still served by `pet-me` as "1 questão". Should it be filtered out?
215. `practice_sessions.question_ids` referencing a question ID that no longer exists. How do we detect & handle?
216. Storage `materials/*` files orphaned after row delete. Cleanup job?

### 6.5 Consistency Between Tables
217. `users.current_organization_id` must equal `class.organization_id` where `class.id = users.current_class_id`. Enforced in `rpc_class_join` and validated in `resolveActiveContext`, but **not** enforced by a DB constraint. Can drift happen via direct SQL in Supabase Studio?
218. `organization_memberships.status='active'` is unique per `(user_id, organization_id)` via partial index. `enrollments` also has `(class_id, student_id)` unique. But the combination "active enrollment in class X and no active membership in class X's org" is not enforced. Can RLS tolerate this? Today `mt_enrollment_select_student` requires both.
219. `admin_profiles.organization_id` may point to an org where the same user has no `organization_memberships` row (pre-PR-10 state). Is the admin app reliable between sync runs?

### 6.6 Backfills & Migrations
220. `PR-03` backfill contains diagnostic SELECTs (SECTION A) but no explicit "COMMIT after B and verify C". Is the backfill idempotent end-to-end? Has it been run in production?
221. `signup_defaults.default_class_id` is seeded to the ENEM26 class UUID. If an operator changes this in production, the next signup wave lands in a different class. What's the change-management process?
222. How is prod migrated from the initial broken `users_question_answers (id, user_id, created_at)` to the production `(id, user_id, question_id, acertou, tempo_resposta, ...)` schema without losing answer data?

---

## 7. Product Gaps

### 7.1 Monetization
223. There is **no entity** for subscription, plan, product, payment, invoice, coupon, discount, trial — yet `pets.moedas` exists as if a currency is coming. Is there a monetization plan and what's the timeline?
224. Multi-tenant: organizations are "public" or "private" but no billing attached. How does Broto charge teachers / schools / students? B2B (per-org seat), B2C (student subscription), hybrid?
225. White-label: `organization.config.primary_color` and `mascot_name` hint at white-labeling. Is pricing per-tenant-brand supported? Domain isolation?
226. Feature gates: `organization.config.features.*` are declared but not enforced. Are features meant to be toggled by plan tier?

### 7.2 Teacher / School Workflows
227. **Teacher invitation**: no flow. How does an org owner add a teacher today? (SQL only.) Is there a plan?
228. **Student invitation**: only via access_code. Is email invitation planned?
229. **Class assignments**: `practice_sessions.kind='class_assignment'` exists but there is no create/view flow. What's the MVP for teachers to assign content? Due dates? Auto-grading?
230. **Teacher content authoring**: teachers can only add pre-existing ENEM questions via mock? Or can they author custom questions? Today: no authoring path.
231. **Bulk operations**: teachers cannot bulk import students, materials, classes. Is that required for scale?
232. **Reports / export**: class indicators are read via the UI. No CSV/PDF export. Required?

### 7.3 Student Workflows
233. **Redação (essay)**: the ENEM has a redação — there is **no essay flow**. Intended or gap?
234. **Resumos / flashcards / mind maps**: `organization.config.features` mentions `flashcards`, `mind_map`, `audio_overview` — zero implementation found. Intended?
235. **Spaced repetition**: no review queue. Only "weak areas first" pattern in rotina.
236. **Progress share / social**: no sharing, no friends, no leaderboard. Intended?
237. **Notifications**: no push, no email, no in-app notification center. Streak reminders? Daily missions reminders?

### 7.4 Observability / Ops
238. There is **no structured logging** (only `console.error` with prefixes). Is that sufficient for production debugging of business flows?
239. No analytics events (product usage). How is "funnel drop in onboarding" measured?
240. No alerting: 500 spikes, NotebookLM failures, material-index timeouts — who gets paged?
241. No feature flags: a new XP formula rollout requires a migration + redeploy. Is LaunchDarkly/GrowthBook/Supabase-row-flag planned?

### 7.5 Accessibility / i18n
242. All copy is **Portuguese only**. Is i18n planned (e.g., for the ENEM diaspora)?
243. Accessibility: no ARIA audits found in `apps/admin`. Is WCAG AA a goal?

### 7.6 Support / Customer Care
244. No in-app support, no "report a question bug" path, no "something went wrong with my streak". How does a student reach us today?
245. Admin "as user" impersonation for debugging — available? Today nothing.

### 7.7 Legal / Compliance
246. Terms of Service / Privacy Policy acceptance: not enforced at signup. Required?
247. Minor consent: if a student < 18, LGPD requires guardian consent. The product collects `data_nascimento` but doesn't gate on age.
248. Data portability export (LGPD Article 18): not implemented.

### 7.8 Scaling / Performance
249. Static question JSON bank is fetched from the CDN per mock-exam build. No CDN cache version, no content hash — how do we invalidate when a question is edited?
250. `pet-me` does 3–4 queries per request and is called aggressively (focus, refresh, mutations). Is there a caching layer?
251. `useClassIndicators` runs 5 sequential queries per class. For large classes (1000 students), performance cliff?

---

## 8. Open Questions — Unclassified / Cross-Cutting

252. What is the **primary business metric** (DAU, answered questions per week, streak retention, mock-exam completion rate, teacher NPS)? None instrumented today.
253. What is the **definition of an active user** (for reporting, pricing, retention)?
254. What is the **definition of onboarding complete** — `onboarding_done=true` in DB includes the "skipped" path, which has no personalization. Should "complete" mean "filled all 7 steps"?
255. Does the product have an **end state** (user is ready for ENEM) and what signals that?
256. Which organization is the default public one? Today hard-coded `a0e00000-0000-4000-8000-000000000001`. Is there a fallback if that org becomes inactive?
257. Which rules are **organization-overridable** vs **platform-global**? XP per answer, streak definition, rotina algorithm — all are global today.
258. Is `@broto/ui` meant to be adopted by mobile and admin, or stays web-only? Today only `apps/web` imports it.
259. What is the **contract** between `@broto/shared` daily-missions/mock-exam logic and server state? Any test guaranteeing parity?
260. Who approves migrations? The series 20260303 → 20260422 shows frequent schema churn; is there a migration review board?

---

End of document. Each numbered item should receive a **product owner decision** before being closed. Items marked as conflicts between migrations (§6.1) and as security-trust questions (§5.1) are **blockers for production** until resolved.
