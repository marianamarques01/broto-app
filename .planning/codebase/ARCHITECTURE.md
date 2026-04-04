# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Turborepo monorepo with three frontend apps (mobile, web, admin) sharing a common package layer, backed by Supabase (Auth, Database, Edge Functions) and an external Python microservice for AI-powered features.

**Key Characteristics:**
- Three independent frontend apps sharing types and utilities via `@broto/shared`
- Supabase Edge Functions serve as the API layer (Deno runtime)
- No REST API server -- clients invoke Edge Functions directly via Supabase SDK (mobile) or raw `fetch` (web/admin)
- Python FastAPI microservice wraps Google NotebookLM for AI chat and study routine generation
- Module-level cached data stores (React-free) with thin React hook wrappers per app to avoid dual-React issues

## Apps

**Mobile (`apps/mobile`):**
- Framework: React Native + Expo SDK 54 (expo-router for file-based routing)
- Purpose: Primary student-facing app for ENEM exam preparation
- Styling: NativeWind (TailwindCSS for RN) + React Native StyleSheet with design tokens
- Navigation: File-based via expo-router with tab layout and modal screens
- Entry: `apps/mobile/app/_layout.tsx`

**Web (`apps/web`):**
- Framework: React 18 + Vite + react-router-dom
- Purpose: Web version of the student app (same feature set as mobile)
- Styling: CSS with CSS custom properties (light/dark theme)
- Port: 5173
- Entry: `apps/web/src/main.tsx`

**Admin (`apps/admin`):**
- Framework: React 18 + Vite + react-router-dom
- Purpose: Teacher/admin dashboard for managing classes, students, materials
- Styling: CSS with CSS custom properties
- Port: 5174
- Entry: `apps/admin/src/main.tsx`

## Layers

**Shared Package (`packages/shared`):**
- Purpose: Cross-app types, utilities, and platform-agnostic business logic
- Location: `packages/shared/src/`
- Contains: TypeScript types (Organization, Class, Student, Question, Progress, Content), API client core (ApiError, pathToFunctionName, mergeParamsIntoBody), cached store factory (createCachedStore), class code utilities
- Depends on: Nothing (zero dependencies)
- Used by: All three apps import as `@broto/shared`

**UI Package (`packages/ui`):**
- Purpose: Shared React UI components for web apps
- Location: `packages/ui/src/`
- Contains: Button, Card, Badge, Spinner components
- Depends on: React (peer dependency)
- Used by: `apps/web` (imported as `@broto/ui`). Not used by mobile or admin currently.

**Supabase Edge Functions (`supabase/functions/`):**
- Purpose: Serverless API endpoints (Deno runtime)
- Location: `supabase/functions/`
- Contains: 6 functions, each in its own directory with `index.ts`
- Depends on: Deno standard library, Supabase JS client (ESM imports)
- Used by: All frontend apps via API client

**NotebookLM Service (`supabase/services/notebooklm/`):**
- Purpose: Python microservice wrapping Google NotebookLM for AI features
- Location: `supabase/services/notebooklm/main.py`
- Contains: FastAPI app with endpoints for notebook creation, source indexing, chat, routine generation
- Depends on: `notebooklm-py`, FastAPI, Pydantic
- Used by: Edge Functions `broto-chat` and `material-index` proxy to this service

## Data Flow

**Student Answering a Question (Mobile):**

1. User selects answer in `QuestionPlayer` component (`apps/mobile/components/questions/QuestionPlayer.tsx`)
2. `submitAnswer()` in `apps/mobile/lib/api/answer-question.ts` calls `api.post('/api/answer/question', payload)`
3. `api-client.ts` converts path `/api/answer/question` to Edge Function name `answer-question` via `pathToFunctionName()`
4. `supabase.functions.invoke('answer-question', ...)` sends request with auth token
5. Edge Function writes to `user_question_answers` and updates `topic_performance`
6. Client-side: `refreshPet()` and `refreshProgress()` invalidate cached stores, triggering re-fetch across all tabs
7. `incrementDailyAreaAnswer()` updates local AsyncStorage for mission tracking

**API Path Resolution Convention:**
- Frontend uses REST-like paths: `/api/user/me`, `/api/pet/me`, `/api/user/progress`
- `pathToFunctionName()` in `@broto/shared` strips `/api/` prefix and replaces `/` with `-`
- Result maps to Supabase Edge Function name: `user-me`, `pet-me`, `user-progress`
- Mobile uses `supabase.functions.invoke()` (SDK); Web uses raw `fetch` to `${SUPABASE_URL}/functions/v1/${fnName}`

**Broto Chat (AI):**

1. User sends message from chat UI
2. `api.post('/api/broto/chat', { messages })` invokes `broto-chat` Edge Function
3. Edge Function validates auth, verifies enrollment in class, then proxies to Python service
4. Python `main.py` calls `NotebookLMClient.chat.ask(notebook_id, question)` with class-scoped notebook
5. Response flows back: Python -> Edge Function -> Client

**Material Indexing (Admin):**

1. Admin uploads material via admin dashboard
2. `material-index` Edge Function receives `material_id` and `class_id`
3. Creates NotebookLM notebook if class doesn't have one yet (POST to Python `/notebook/create`)
4. Sends material source to Python `/notebook/add-source` for indexing
5. Updates `materials.index_status` and `classes.notebook_status` in database

**State Management:**
- **Mobile:** Module-level `CachedStore` instances (from `@broto/shared`) with React hook wrappers. Each domain entity (user, pet, progress) has its own store with 30-second staleness window, deduplication, and generation counters to prevent stale data races. Stores refresh on tab focus via `useFocusEffect`.
- **Web:** Same `CachedStore` pattern with `createCachedHook` wrapper using web React.
- **Admin:** Direct Supabase client queries (no shared cached store pattern). Uses React Context for auth.
- **Cross-tab cache invalidation:** After mutations (e.g., answering a question), explicit calls to `refreshPet()` / `refreshProgress()` trigger re-fetches across all consuming components.
- **Daily missions:** Local-only state persisted in AsyncStorage (mobile) or localStorage (web), keyed by date. Not server-synced.

## Navigation Structure

**Mobile (expo-router, file-based):**

```
app/
  _layout.tsx          # Root: Stack navigator, auth guard, splash screen, ClassProvider
  (auth)/
    _layout.tsx        # Stack for auth screens
    login.tsx          # Email/password login
    signup.tsx         # Registration
  (tabs)/
    _layout.tsx        # Bottom tab navigator (5 tabs)
    index.tsx          # Home: pet card, missions, stats
    study.tsx          # Study area: topic selector, flashcards, quiz, mind map
    questions.tsx      # ENEM question bank with filters
    progress.tsx       # Performance stats by area/topic
    routine.tsx        # Weekly study schedule
  onboarding.tsx       # Post-signup onboarding (modal)
  broto-chat.tsx       # AI chat (modal, slide from bottom)
  study-area.tsx       # Study area detail (modal, slide from bottom)
  enem-questions.tsx   # ENEM questions player
```

**Auth flow:** Root layout watches `useAuth().status`. Unauthenticated users are redirected to `/(auth)/login`. After login, tabs layout checks `user.onboardingDone` and redirects to `/onboarding` if needed.

**Web (react-router-dom):**

```
/login               # Login page
/signup              # Registration
/onboarding          # Post-signup flow
/                    # Home (protected, within AppShell)
/study               # Study area overview
/study/questions     # Question bank
/progress            # Performance dashboard
/routine             # Study schedule
/join-class          # Join class by code
/broto               # AI chat page
```

**Admin (react-router-dom):**

```
/login                           # Admin login
/                                # Dashboard (class list)
/classes/new                     # Create class
/classes/:classId                # Class detail (students, materials, indicators)
/classes/:classId/students/:studentId  # Student detail
```

## Key Abstractions

**CachedStore:**
- Purpose: Module-level singleton data cache with automatic deduplication, staleness detection, and race condition protection via generation counters
- Location: `packages/shared/src/hooks/create-cached-hook.ts` (store), `apps/mobile/hooks/create-cached-hook.ts` (React wrapper), `apps/web/src/hooks/createCachedHook.ts` (React wrapper)
- Pattern: Factory function `createCachedStore(fetcher)` returns store object. Each app wraps with its own React `useEffect`/`useState` to avoid dual-React issues in monorepo.
- Staleness window: 30 seconds (`STALE_MS`)

**API Client:**
- Purpose: Unified API layer that maps REST-like paths to Supabase Edge Function invocations
- Location: `packages/shared/src/api/api-client.ts` (shared core), `apps/mobile/lib/api-client.ts` (mobile impl), `apps/web/src/lib/api-client.ts` (web impl)
- Pattern: Platform-specific `invoke()` implementations wrap the shared `pathToFunctionName()` and `mergeParamsIntoBody()`. Mobile uses `supabase.functions.invoke()`, web uses raw `fetch`. Both export identical `api.get()`, `api.post()`, `api.patch()`, `api.getWithParams()` interface.

**ClassContext/ClassProvider:**
- Purpose: Provides current class and organization context throughout the app
- Location: `apps/mobile/contexts/ClassContext.tsx`, `apps/web/src/contexts/ClassContext.tsx`
- Pattern: React Context that loads user's `current_class_id`, fetches class with joined organization, and provides both to child components

**Area Config:**
- Purpose: Single source of truth for ENEM study area metadata (icons, colors, labels)
- Location: `apps/mobile/theme/area-config.ts`, `apps/web/src/lib/area-config.ts`
- Pattern: Static `Record<string, AreaConfig>` mapping area slugs to display configuration

## Entry Points

**Mobile Root Layout (`apps/mobile/app/_layout.tsx`):**
- Triggers: App startup
- Responsibilities: Font loading, animated splash screen, auth state monitoring, navigation routing, wraps app in ClassProvider

**Edge Functions (each `supabase/functions/*/index.ts`):**
- Triggers: HTTP requests from frontend clients
- Responsibilities: Auth verification, CORS handling, database operations, proxying to Python service
- Functions: `user-me`, `pet-me`, `user-progress`, `broto-chat`, `class-join`, `material-index`

**NotebookLM Service (`supabase/services/notebooklm/main.py`):**
- Triggers: HTTP requests from Edge Functions
- Responsibilities: Google NotebookLM integration -- notebook lifecycle, source indexing, AI chat, study routine generation

## Error Handling

**Strategy:** Layered error handling with shared `ApiError` class across all apps

**Patterns:**
- Edge Functions return structured JSON errors `{ error: string }` with appropriate HTTP status codes
- `ApiError` class in `@broto/shared` wraps HTTP errors with `status`, `message`, and `body` fields
- Mobile API client: 401 errors trigger automatic sign-out and redirect to login (debounced via `handlingUnauthorized` flag)
- Web API client: 401 errors trigger `supabase.auth.signOut()` and `window.location.href = '/login'`
- Edge Functions use two Supabase clients: one authed (validates JWT) and one admin (service role key for actual DB operations)
- Network errors on mobile get user-friendly messages (detects localhost vs IP issues for development)

## Cross-Cutting Concerns

**Logging:** `console.error` in Edge Functions. Python service uses `logging` module with INFO level.

**Validation:** Edge Functions validate input inline (check required fields, UUID format, string length). No shared validation library. Python service uses Pydantic models.

**Authentication:** Supabase Auth (email/password). Every Edge Function manually validates the JWT via `supabase.auth.getUser()`. Two-client pattern: authed client for JWT validation, admin client (service role key) for data operations that bypass RLS.

**Authorization (RLS):** PostgreSQL Row Level Security policies enforce data access. Students see only their own data and enrolled class data. Admins see only their organization's data.

**CORS:** Each Edge Function handles CORS manually with configurable `ALLOWED_ORIGINS` env var.

## Database Schema

**Core Tables (PostgreSQL via Supabase):**

| Table | Purpose |
|---|---|
| `users` | Student profiles (nome, email, streak, onboarding status, current_class_id) |
| `pets` | Virtual pet state per user (xp, nivel) |
| `organizations` | White-label organizations (schools/institutions) with config |
| `admin_profiles` | Teacher/admin accounts linked to organizations |
| `classes` | Classes within organizations (access code, notebook state) |
| `enrollments` | Student-class membership |
| `materials` | Study materials uploaded by admins (PDF, URL, YouTube, text) |
| `user_question_answers` | Answer history per student |
| `topic_performance` | Aggregated per-topic accuracy stats per student |
| `question_topic_mapping` | Maps question IDs to topic slugs |
| `tenants` | Legacy multi-tenant config (being superseded by organizations) |

**Migrations:** `supabase/migrations/` contains SQL migration files with schema + RLS policies.

---

*Architecture analysis: 2026-04-02*
