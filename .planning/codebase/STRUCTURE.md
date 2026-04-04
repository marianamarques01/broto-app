# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
enem-mobile/                          # Monorepo root (npm workspaces + Turborepo)
├── apps/
│   ├── mobile/                       # React Native / Expo student app
│   ├── web/                          # Vite + React web student app
│   └── admin/                        # Vite + React admin/teacher dashboard
├── packages/
│   ├── shared/                       # Shared types, utilities, stores (@broto/shared)
│   └── ui/                           # Shared React UI components (@broto/ui)
├── supabase/
│   ├── functions/                    # Supabase Edge Functions (Deno)
│   ├── migrations/                   # SQL migration files
│   ├── services/                     # External microservices
│   └── seed-enem.sql                 # Seed data for ENEM questions
├── docs/                             # Project documentation, specs, pitch deck
├── turbo.json                        # Turborepo pipeline config
├── package.json                      # Root workspace config
├── eslint.config.mjs                 # Shared ESLint config
├── .prettierrc                       # Shared Prettier config
└── .env                              # Root environment variables (existence noted only)
```

## Directory Purposes

**`apps/mobile/`:**
- Purpose: Expo SDK 54 React Native app for students
- Contains: Screens (file-based routing), components, hooks, theme, lib utilities
- Key files:
  - `app/_layout.tsx`: Root layout with auth guard, splash, navigation
  - `app/(tabs)/_layout.tsx`: Bottom tab navigator config
  - `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`: Auth screens
  - `app/onboarding.tsx`: Post-signup onboarding
  - `app/broto-chat.tsx`: AI chat modal screen
  - `app/enem-questions.tsx`: ENEM questions player screen
  - `app.json`: Expo config (bundle ID: com.broto.app)
  - `tailwind.config.ts`: NativeWind/Tailwind config
  - `tsconfig.json`: TypeScript config with `@/*` path alias

**`apps/mobile/components/`:**
- Purpose: Reusable React Native components
- Contains: UI components, design system pieces, feature-specific components
- Key files:
  - `components/ds/`: Design system components (ListCard, SectionHeader)
  - `components/auth/AuthShared.tsx`: Shared auth UI elements
  - `components/questions/QuestionPlayer.tsx`: ENEM question display and answer flow
  - `components/questions/OptionButton.tsx`: Answer option button
  - `components/BrotoChatFab.tsx`: Floating action button for AI chat
  - `components/BrotoLogo.tsx`: Logo component
  - `components/AnimatedEntry.tsx`: Shared animation components (FadeInSection, AnimatedBar, StaggerItem)
  - `components/FireflyBackground.tsx`: Animated background particles
  - `components/TabIcon.tsx`, `TabIcon.native.tsx`, `TabIcon.web.tsx`: Platform-specific tab icons

**`apps/mobile/hooks/`:**
- Purpose: Custom React hooks for data fetching and state
- Contains: Domain-specific hooks wrapping CachedStore
- Key files:
  - `use-auth.ts`: Supabase auth state listener (loading/authenticated/unauthenticated)
  - `use-user.ts`: Current user profile (`/api/user/me`)
  - `use-pet.ts`: Virtual pet data (`/api/pet/me`)
  - `use-progress.ts`: Study progress by area/topic (`/api/user/progress`)
  - `use-class.ts`: Class context consumer
  - `use-questions-filters.ts`: Complex hook for question bank filtering (areas, topics, years, languages)
  - `create-cached-hook.ts`: React wrapper factory for `@broto/shared` CachedStore

**`apps/mobile/lib/`:**
- Purpose: Non-React utilities and API functions
- Contains: API client, Supabase client, type definitions, business logic
- Key files:
  - `api-client.ts`: API layer wrapping `supabase.functions.invoke()`
  - `supabase/client.ts`: Singleton Supabase client (AsyncStorage auth persistence)
  - `api/answer-question.ts`: Submit answer mutation and cache invalidation
  - `missions/daily-missions.ts`: AsyncStorage-based daily mission progress tracking
  - `study-area-mock.ts`: Mock data for study area feature
  - `types/questions.ts`: Re-exports question types from `@broto/shared`

**`apps/mobile/theme/`:**
- Purpose: Design tokens and visual configuration
- Contains: Colors, fonts, spacing, area-specific styling
- Key files:
  - `tokens.ts`: Full design system with colors (dark green palette), fonts (DM Sans, Fraunces, Outfit), font sizes, spacing, radii
  - `area-config.ts`: ENEM area metadata (icons, colors, labels for linguagens, ciencias-humanas, ciencias-natureza, matematica)
  - `ds.ts`: Additional design system helpers

**`apps/web/src/`:**
- Purpose: Web student app source code
- Contains: Pages, components, hooks, contexts, lib
- Key files:
  - `main.tsx`: App entry, wraps with AuthProvider + ClassProvider + RouterProvider
  - `router.tsx`: Route definitions (login, signup, onboarding, home, study, progress, routine, broto chat)
  - `contexts/AuthContext.tsx`: Auth provider with signIn/signUp/signOut + profile fetch
  - `contexts/ClassContext.tsx`: Class/organization context
  - `hooks/createCachedHook.ts`: Web-specific CachedStore React wrapper
  - `hooks/useUser.ts`, `hooks/usePet.ts`, `hooks/useProgress.ts`: Data hooks (same pattern as mobile)
  - `lib/api-client.ts`: Web API client using raw `fetch` to Supabase Functions URL
  - `lib/supabase.ts`: Supabase client singleton
  - `components/layout/AppShell.tsx`: Main layout with sidebar
  - `components/layout/ProtectedRoute.tsx`: Auth guard wrapper
  - `components/questions/QuestionPlayer.tsx`: Web question player
  - `components/broto/BrotoChat.tsx`: AI chat component
  - `components/progress/`: Performance charts and insights
  - `components/routine/`: Study schedule components

**`apps/admin/src/`:**
- Purpose: Admin/teacher dashboard source code
- Contains: Pages, components, hooks, contexts
- Key files:
  - `main.tsx`: App entry with AdminAuthProvider
  - `router.tsx`: Admin routes (login, dashboard, class detail, student detail, create class)
  - `contexts/AdminAuthContext.tsx`: Admin auth with admin_profiles verification
  - `hooks/useClasses.ts`: Fetch classes for admin's organization
  - `hooks/useClassIndicators.ts`: Class performance indicators
  - `hooks/useMaterials.ts`: Materials management
  - `pages/Dashboard.tsx`: Class list overview
  - `pages/ClassDetail.tsx`: Class management (students, materials, indicators)
  - `pages/StudentDetail.tsx`: Individual student performance view
  - `components/materials/MaterialUpload.tsx`: File/URL upload for class materials
  - `components/materials/MaterialsList.tsx`: Materials list with index status
  - `components/indicators/ClassIndicatorsPanel.tsx`: Class analytics
  - `lib/supabase.ts`: Supabase client for admin

**`packages/shared/src/`:**
- Purpose: Zero-dependency shared library consumed by all apps
- Contains: TypeScript types, platform-agnostic utilities, cached store factory
- Key files:
  - `index.ts`: Barrel export (all types, utils, hooks, api)
  - `types/organization.ts`: `Organization`, `OrganizationConfig` types
  - `types/class.ts`: `Class`, `Enrollment`, `Material` types
  - `types/student.ts`: `Student`, `AdminProfile`, `UserRole` types
  - `types/question.ts`: `Question`, `Area`, `Topico`, `Exam`, `QuestionsResponse`, `getQuestionId()`
  - `types/progress.ts`: `TopicPerformance`, `StudentProgress`, `ClassIndicators` types
  - `types/content.ts`: `GeneratedContent`, `Flashcard`, `FlashcardsData`, `MindMapData` types
  - `api/api-client.ts`: `ApiError` class, `pathToFunctionName()`, `mergeParamsIntoBody()`, `extractErrorMessage()`
  - `hooks/create-cached-hook.ts`: `createCachedStore()` factory (React-free, generation-counted, staleness-aware)
  - `utils/class-code.ts`: `generateClassCode()`, `normalizeClassCode()`

**`packages/ui/src/`:**
- Purpose: Shared React UI primitives for web apps
- Contains: 4 basic components
- Key files:
  - `index.ts`: Barrel export
  - `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Spinner.tsx`
- Note: Only consumed by `apps/web`. `apps/admin` does not use this package.

**`supabase/functions/`:**
- Purpose: Serverless API endpoints (Deno runtime)
- Contains: One directory per function, each with `index.ts`
- Key files:
  - `user-me/index.ts`: GET returns user profile
  - `pet-me/index.ts`: GET returns virtual pet state (xp, nivel, fase, streak, today's stats)
  - `user-progress/index.ts`: GET returns aggregated performance by area and topic
  - `broto-chat/index.ts`: POST proxies AI chat to NotebookLM Python service
  - `class-join/index.ts`: POST enrolls student in class by access code
  - `material-index/index.ts`: POST triggers material indexing via NotebookLM service
  - `.env`: Edge Function environment variables (existence noted only)

**`supabase/migrations/`:**
- Purpose: PostgreSQL schema migrations
- Contains: SQL files with CREATE TABLE, RLS policies
- Key files:
  - `20260317_foundation_organizations_classes.sql`: Full schema (users, pets, organizations, admin_profiles, classes, enrollments, materials, RLS policies)
  - `20260323_indexes_rls_fixes.sql`: Index and RLS refinements

**`supabase/services/notebooklm/`:**
- Purpose: Python FastAPI microservice for Google NotebookLM integration
- Contains: FastAPI app, Dockerfile, data files
- Key files:
  - `main.py`: 4 endpoints (`/notebook/create`, `/notebook/add-source`, `/notebook/chat`, `/routine/generate`) plus `/health`
  - `Dockerfile`: Container build config
  - `requirements.txt`: Python dependencies
  - `data/notebook_map.json`: Persisted class_id to notebook_id mapping

**`docs/`:**
- Purpose: Project documentation and design specs
- Contains: Markdown design docs, HTML pitch deck, PDF
- Key files:
  - `broto-sistema-completo.md`: Full system design doc
  - `broto-f1-fundacao.md` through `broto-f4-area-de-estudo.md`: Phased feature specs
  - `integracao-notebooklm.md`: NotebookLM integration design
  - `db.md`: Database schema documentation
  - `onboarding-flow.md`: Onboarding UX spec
  - `pitch-tcc-broto-dark.pdf`: TCC pitch presentation

## Key File Locations

**Entry Points:**
- `apps/mobile/app/_layout.tsx`: Mobile app root (auth, navigation, providers)
- `apps/web/src/main.tsx`: Web app root
- `apps/admin/src/main.tsx`: Admin app root
- `supabase/functions/*/index.ts`: Each Edge Function entry

**Configuration:**
- `package.json`: Root workspaces and scripts
- `turbo.json`: Turborepo pipeline (build, dev, lint, typecheck)
- `eslint.config.mjs`: Shared ESLint rules
- `.prettierrc`: Prettier formatting rules
- `apps/mobile/app.json`: Expo configuration
- `apps/mobile/tsconfig.json`: Mobile TypeScript config (`@/*` alias)
- `apps/web/tsconfig.json`: Web TypeScript config
- `apps/admin/tsconfig.json`: Admin TypeScript config

**Core Logic:**
- `packages/shared/src/api/api-client.ts`: API error handling and path resolution
- `packages/shared/src/hooks/create-cached-hook.ts`: Data caching engine
- `apps/mobile/lib/api-client.ts`: Mobile API transport (Supabase SDK)
- `apps/web/src/lib/api-client.ts`: Web API transport (fetch)
- `apps/mobile/hooks/use-questions-filters.ts`: Question filtering logic (largest mobile hook)
- `apps/mobile/lib/missions/daily-missions.ts`: Daily mission state machine

**Testing:**
- No test files detected in the codebase

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `QuestionPlayer.tsx`, `BrotoChatFab.tsx`, `AnimatedEntry.tsx`)
- Hooks: kebab-case with `use-` prefix (mobile: `use-auth.ts`, `use-pet.ts`) or camelCase with `use` prefix (web: `useUser.ts`, `usePet.ts`)
- Utilities/lib: kebab-case (e.g., `api-client.ts`, `daily-missions.ts`, `area-config.ts`)
- Types: kebab-case (e.g., `organization.ts`, `class.ts`, `question.ts`)
- Design system components: PascalCase in `components/ds/` (e.g., `ListCard.tsx`, `SectionHeader.tsx`)

**Directories:**
- Feature groups: lowercase kebab-case (e.g., `components/questions/`, `components/auth/`, `lib/missions/`)
- Route groups: parenthesized for expo-router (e.g., `app/(tabs)/`, `app/(auth)/`)
- Standard directories: lowercase (e.g., `hooks/`, `lib/`, `contexts/`, `theme/`, `components/`)

**Note on inconsistency:** Mobile hooks use kebab-case (`use-auth.ts`) while web hooks use camelCase (`useUser.ts`). Both patterns coexist.

## Where to Add New Code

**New Mobile Screen:**
- Tab screen: `apps/mobile/app/(tabs)/your-screen.tsx` + add tab in `apps/mobile/app/(tabs)/_layout.tsx`
- Modal screen: `apps/mobile/app/your-modal.tsx` + add Stack.Screen in `apps/mobile/app/_layout.tsx`
- Auth screen: `apps/mobile/app/(auth)/your-screen.tsx`

**New Web Page:**
- Page component: `apps/web/src/pages/YourPage.tsx`
- Add route in: `apps/web/src/router.tsx`
- Protected pages go inside the `ProtectedRoute > AppShell` children array

**New Admin Page:**
- Page component: `apps/admin/src/pages/YourPage.tsx`
- Add route in: `apps/admin/src/router.tsx`
- Wrap with `ProtectedRoute`

**New Shared Type:**
- Type file: `packages/shared/src/types/your-type.ts`
- Export from: `packages/shared/src/types/index.ts`
- Re-export from: `packages/shared/src/index.ts`

**New Supabase Edge Function:**
- Create directory: `supabase/functions/your-function/`
- Create file: `supabase/functions/your-function/index.ts`
- Follow the established pattern: `serve()` handler, CORS headers, auth validation, admin client for DB

**New Mobile Component:**
- Generic: `apps/mobile/components/YourComponent.tsx`
- Feature-specific: `apps/mobile/components/your-feature/YourComponent.tsx`
- Design system: `apps/mobile/components/ds/YourComponent.tsx` + export from `apps/mobile/components/ds/index.ts`

**New Data Hook (Mobile):**
- Hook file: `apps/mobile/hooks/use-your-data.ts`
- Use `createCachedHook<YourType>(() => api.get<YourType>('/api/your/endpoint'))` pattern
- Include `useFocusEffect` + `refreshIfStale()` for automatic refresh on tab focus

**New Data Hook (Web):**
- Hook file: `apps/web/src/hooks/useYourData.ts`
- Use `createCachedHook<YourType>(() => api.get<YourType>('/api/your/endpoint'))` pattern

**New Shared Utility:**
- Utility file: `packages/shared/src/utils/your-util.ts`
- Export from: `packages/shared/src/utils/index.ts`

**New Database Migration:**
- Migration file: `supabase/migrations/YYYYMMDD_description.sql`

## Special Directories

**`apps/mobile/.expo/`:**
- Purpose: Expo build cache and generated files
- Generated: Yes
- Committed: No (gitignored)

**`dist/` (root and per-app):**
- Purpose: Build output
- Generated: Yes
- Committed: Partially (some build artifacts appear tracked)

**`supabase/.branches/` and `supabase/.temp/`:**
- Purpose: Supabase CLI local state
- Generated: Yes
- Committed: No

**`docs/`:**
- Purpose: Project documentation and design specs
- Generated: No (manually authored)
- Committed: Yes

**`supabase/services/notebooklm/.venv/`:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: Should not be (contains full Python env)

---

*Structure analysis: 2026-04-02*
