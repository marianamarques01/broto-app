# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**Supabase (Primary Backend):**
- All three apps (web, admin, mobile) communicate with Supabase for auth, data, and edge functions
- SDK: `@supabase/supabase-js` (^2.45.0 on web/admin, ^2.90.1 on mobile)
- Web client: `apps/web/src/lib/supabase.ts`
- Admin client: `apps/admin/src/lib/supabase.ts`
- Mobile client: `apps/mobile/lib/supabase/client.ts`

**Google NotebookLM (AI Chat & Study Routine):**
- Accessed via a self-hosted Python FastAPI service at `supabase/services/notebooklm/main.py`
- SDK: `notebooklm-py` >=0.3.3 (Python package, wraps Google NotebookLM API)
- Requires browser-based authentication (`notebooklm login` via Playwright/Chromium)
- Used for: AI chat with study materials, study routine generation, notebook/source management
- Edge Functions proxy requests to this service (see `broto-chat` and `material-index`)

## Supabase Edge Functions

Six Deno-based edge functions deployed to Supabase, all at `supabase/functions/`:

| Function | HTTP Method | Purpose | Source |
|----------|-------------|---------|--------|
| `user-me` | GET | Return authenticated user profile | `supabase/functions/user-me/index.ts` |
| `pet-me` | GET | Return gamification pet status (XP, level, streak, daily stats) | `supabase/functions/pet-me/index.ts` |
| `user-progress` | GET | Return topic performance aggregated by ENEM area | `supabase/functions/user-progress/index.ts` |
| `class-join` | POST | Enroll student in class via access code | `supabase/functions/class-join/index.ts` |
| `broto-chat` | POST | Proxy chat messages to NotebookLM Python service | `supabase/functions/broto-chat/index.ts` |
| `material-index` | POST | Send material for indexing into NotebookLM notebook | `supabase/functions/material-index/index.ts` |

**Edge Function runtime:**
- Deno with `https://deno.land/std@0.168.0/http/server.ts`
- Supabase client imported from `https://esm.sh/@supabase/supabase-js@2`
- All functions use `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- CORS handled per-function using `ALLOWED_ORIGINS` env var

**API Client Pattern:**
- Apps call edge functions through a shared `api` abstraction (`api.get()`, `api.post()`)
- Web uses raw `fetch` to `{SUPABASE_URL}/functions/v1/{function-name}` - see `apps/web/src/lib/api-client.ts`
- Mobile uses `supabase.functions.invoke()` from the SDK - see `apps/mobile/lib/api-client.ts`
- Shared utilities (`pathToFunctionName`, `mergeParamsIntoBody`, `ApiError`) in `packages/shared/src/api/api-client.ts`
- Path convention: `/api/foo/bar` maps to edge function `foo-bar`

## NotebookLM Python Service

**Location:** `supabase/services/notebooklm/`
**Framework:** FastAPI 0.115.x on uvicorn 0.34.x
**Dockerfile:** `supabase/services/notebooklm/Dockerfile` (Python 3.12-slim + Playwright Chromium)

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notebook/create` | POST | Create a NotebookLM notebook for a class |
| `/notebook/add-source` | POST | Add URL, text, or file to a class notebook |
| `/notebook/chat` | POST | Student asks a question against class materials |
| `/routine/generate` | POST | Generate personalized weekly study routine via AI |
| `/health` | GET | Health check with auth status |

**Auth:** Bearer token via `SERVICE_SECRET` env var (skipped in dev when not set)
**State:** `notebook_map.json` persists `class_id` to `notebook_id` mapping on disk (`/app/data/`)

## Data Storage

**Database:**
- PostgreSQL via Supabase (hosted)
- Connection: Supabase manages connections; apps use the JS client
- No direct database connection strings in app code

**Database Tables (from migrations):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Student profiles | `id`, `nome`, `email`, `image`, `onboarding_done`, `data_enem`, `horas_disponiveis_por_dia`, `streak`, `current_class_id` |
| `pets` | Gamification virtual pet | `user_id`, `xp`, `nivel` |
| `organizations` | White-label organizations | `id`, `name`, `slug`, `is_public`, `owner_id`, `config` (JSONB with mascot, colors, features) |
| `admin_profiles` | Admin/teacher accounts | `id`, `full_name`, `email`, `organization_id`, `role` (owner/teacher) |
| `classes` | Study classes/groups | `id`, `organization_id`, `name`, `access_code`, `notebook_id`, `notebook_status` |
| `enrollments` | Student-class relationships | `class_id`, `student_id`, `status` (active/inactive) |
| `materials` | Study materials per class | `class_id`, `organization_id`, `title`, `type` (pdf/url/youtube/text), `source_url`, `index_status` |
| `user_question_answers` | Individual question responses | `user_id`, `is_correct`, `created_at` |
| `question_topic_mapping` | Maps questions to topics | `question_id`, `topico_value` |
| `topic_performance` | Aggregated topic performance | `user_id`, `topico_value`, `total_answered`, `total_correct`, `accuracy_pct` |
| `tenants` | Legacy tenant config | `slug`, `config` |

**Migration files:**
- `supabase/migrations/20260317_foundation_organizations_classes.sql` - Core schema with RLS policies
- `supabase/migrations/20260323_indexes_rls_fixes.sql` - Performance indexes, FK fixes, triggers

**Seed data:**
- `supabase/seed-enem.sql` - Seeds ENEM as a public organization with a default class (code: `ENEM26`)

**Row Level Security (RLS):**
- Enabled on all tables
- Students see only their own data and their enrolled class data
- Admins see data scoped to their organization
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS when needed

**File Storage:**
- No Supabase Storage buckets detected in migrations
- Materials reference external URLs (`source_url` field) rather than uploaded files
- NotebookLM service handles file uploads via base64-encoded payloads

**Caching:**
- No Redis or external cache service
- Client-side caching via custom `createCachedHook` pattern in `packages/shared/src/hooks/create-cached-hook.ts`
- Web uses `localStorage` with `broto:` prefix for user-scoped data (cleared on sign-out)
- Mobile uses `@react-native-async-storage/async-storage` for Supabase session persistence

## Authentication & Identity

**Auth Provider:** Supabase Auth (email + password)
- No OAuth/social login configured
- No magic link or phone auth detected

**Web/Admin Implementation:**
- Auth state managed via React Context
- Web: `apps/web/src/contexts/AuthContext.tsx` - `AuthProvider` with `signIn`, `signUp`, `signOut`
- Admin: `apps/admin/src/contexts/AdminAuthContext.tsx` - `AdminAuthProvider` with admin profile verification
- Admin login rejects users without an `admin_profiles` row
- Protected routes redirect to `/login` when unauthenticated

**Mobile Implementation:**
- Auth state via `useAuth` hook at `apps/mobile/hooks/use-auth.ts`
- Listens to `onAuthStateChange` for session changes
- Session persisted via AsyncStorage (survives app restarts)
- Unauthorized API responses trigger `signOut` + redirect to `/(auth)/login`

**Session Handling:**
- Supabase manages JWT tokens with auto-refresh
- API client attaches `Authorization: Bearer {access_token}` to all edge function calls
- 401 responses trigger automatic sign-out across all platforms

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, or similar SDK detected)

**Logs:**
- Edge functions: `console.error()` for server-side logging
- Web API client: `console.error('[api-client]', fnName, status, msg)` at `apps/web/src/lib/api-client.ts`
- NotebookLM service: Python `logging` module with logger named `broto-notebooklm`

**Analytics:**
- None detected (no Google Analytics, Mixpanel, PostHog, or similar)

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in the repo (no `vercel.json`, `netlify.toml`, `fly.toml`, or similar)
- Web/Admin: Vite builds output to `dist/` (deployable to any static host)
- Mobile: Expo managed workflow, bundle ID `com.broto.app`
- Edge Functions: Deployed to Supabase via Supabase CLI
- NotebookLM service: Docker container (see `supabase/services/notebooklm/Dockerfile`)

**CI Pipeline:**
- None detected (no `.github/workflows/`, `Jenkinsfile`, or CI config files)

## Environment Configuration

**Web app (`apps/web/`) - required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Admin app (`apps/admin/`) - required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Mobile app (`apps/mobile/`) - required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Supabase Edge Functions - env vars (auto-injected by Supabase):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `ALLOWED_ORIGINS` - Comma-separated allowed CORS origins
- `NOTEBOOKLM_SERVICE_URL` - URL of the NotebookLM Python service (used by `broto-chat` and `material-index`)
- `SERVICE_SECRET` / `NOTEBOOKLM_INTERNAL_SECRET` - Shared secret for authenticating to NotebookLM service

**NotebookLM Python service - env vars:**
- `SERVICE_SECRET` - Bearer token for incoming request auth
- `NOTEBOOK_MAP_PATH` - Path to notebook mapping JSON (default: `./data/notebook_map.json`)
- `PORT` - Server port (default: 8000)

**Env file locations:**
- `apps/web/.env` and `apps/web/.env.example` (present)
- `apps/admin/.env` and `apps/admin/.env.example` (present)
- `apps/mobile/.env` and `apps/mobile/.env.example` (present)
- `supabase/functions/.env` (present)
- Root `.env` (present, gitignored)

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints in edge functions or apps)

**Outgoing:**
- Edge Functions `broto-chat` and `material-index` make outgoing HTTP calls to the NotebookLM Python service at `NOTEBOOKLM_SERVICE_URL`
- 55-second timeout on outgoing requests to NotebookLM service (both functions)

## Third-Party SDK Summary

| Service | SDK/Package | Used In | Purpose |
|---------|-------------|---------|---------|
| Supabase | `@supabase/supabase-js` | All apps + edge functions | Auth, DB, Edge Functions |
| Google NotebookLM | `notebooklm-py` | Python service | AI chat, material indexing, routine generation |
| Playwright | `playwright` | docs + NotebookLM Docker | NotebookLM browser auth + docs |

---

*Integration audit: 2026-04-02*
