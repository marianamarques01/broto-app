<!-- GSD:project-start source:PROJECT.md -->
## Project

**Broto EdTech — Codebase Consolidation**

Broto is an EdTech platform for ENEM exam preparation, with a mobile app (React Native/Expo), web app (React/Vite), admin dashboard, and Supabase backend with AI-powered study features via Google NotebookLM. This milestone focuses on consolidating the codebase — eliminating duplication, fixing critical bugs, standardizing patterns, and establishing a healthy foundation for future feature development.

**Core Value:** A maintainable, consistent monorepo where business logic lives in one place (`packages/shared`), bugs are fixed once, and developers can work across apps without friction.

### Constraints

- **Tech stack**: Existing stack is fixed (React Native/Expo, React/Vite, Supabase, TypeScript) — no migrations
- **Incremental**: Changes must be backward-compatible; apps must keep working throughout
- **No feature regression**: All existing functionality must continue working after consolidation
- **Monorepo structure**: Keep Turborepo, apps/*, packages/* structure
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^5.4.0 - All frontend apps (web, admin, mobile), shared packages, and Supabase Edge Functions
- SQL (PostgreSQL) - Database migrations and seed files in `supabase/migrations/`
- Python 3.12 - NotebookLM AI service at `supabase/services/notebooklm/`
- CSS (Tailwind) - Mobile app styling via NativeWind at `apps/mobile/global.css`
## Runtime
- Node.js v24.10.0 (detected on host; no `.nvmrc` or `.node-version` file pinning the version)
- Deno - Supabase Edge Functions runtime (imports from `https://deno.land/std@0.168.0/`)
- Python 3.12 - NotebookLM microservice Docker container
- npm 11.6.0
- Lockfiles: Root `package-lock.json` present; mobile app has its own `apps/mobile/package-lock.json`
## Monorepo Structure
- Config: `turbo.json`
- Workspaces defined in root `package.json`: `apps/*` and `packages/*`
| Package | Path | Purpose |
|---------|------|---------|
| `@broto/web` | `apps/web/` | Student-facing web app (Vite + React) |
| `@broto/admin` | `apps/admin/` | Admin/teacher dashboard (Vite + React) |
| `broto-mobile` | `apps/mobile/` | Mobile app (Expo + React Native) |
| `@broto/shared` | `packages/shared/` | Shared types, utilities, API client core |
| `@broto/ui` | `packages/ui/` | Shared React UI components (Button, Card, Badge, Spinner) |
| `broto-docs-tools` | `docs/` | Documentation tooling (Playwright) |
- `build`: depends on `^build`, outputs `dist/**` and `.expo/**`
- `dev`: no cache, persistent
- `lint`: standalone
- `typecheck`: depends on `^build`
## Frameworks
- React 18.3.x - Web and admin apps
- React 19.1.0 - Mobile app
- React Native 0.81.5 - Mobile native layer
- Expo SDK 54 (`expo@^54.0.0`) - Mobile managed workflow, new architecture enabled
- Expo Router ~6.0.23 - File-based routing for mobile app
- Vite ^5.4.0 - Web and admin app bundler
- `@vitejs/plugin-react` ^4.3.0 - React Fast Refresh for Vite
- Metro (via Expo) - Mobile bundler, configured in `apps/mobile/metro.config.js`
- Babel (via `babel-preset-expo`) - Mobile transpilation, config at `apps/mobile/babel.config.js`
- Turborepo 2.8.17 - Monorepo orchestration
- NativeWind ^4.2.1 - Tailwind CSS for React Native (mobile only)
- Tailwind CSS 3.4.17 - devDependency powering NativeWind
- CSS Variables - Web and admin use custom CSS properties (no Tailwind on web)
- Playwright ^1.49.1 - In `docs/` package only, likely for documentation screenshots
- No unit test framework detected (no Jest, Vitest, or testing-library in any `package.json`)
- ESLint ^9.28.0 - Flat config at `eslint.config.mjs`
- `typescript-eslint` ^8.57.1 - TypeScript linting rules
- `eslint-plugin-react-hooks` ^7.0.1 - React hooks rules
- `eslint-config-prettier` ^10.1.8 - Disables ESLint rules conflicting with Prettier
- Prettier ^3.8.1 - Code formatter, config at `.prettierrc`
## Key Dependencies
- `@supabase/supabase-js` ^2.45.0 (web/admin) / ^2.90.1 (mobile) - Supabase client for auth, database, and edge function invocation
- `react-router-dom` ^6.26.0 - Client-side routing for web and admin apps
- `@broto/shared` (workspace) - Shared types (`Organization`, `Class`, `Material`, `Enrollment`, etc.), API client utilities (`ApiError`, `pathToFunctionName`, `mergeParamsIntoBody`)
- `recharts` ^2.12.0 - Charts for progress/performance visualization
- `lucide-react` ^0.577.0 - Icon library
- `dompurify` ^3.3.3 - HTML sanitization (for rendering HTML content safely)
- `recharts` ^2.12.0 - Charts for class indicators dashboard
- `clsx` ^2.1.1 - Conditional classname utility
- `react-native-reanimated` ~4.1.1 - Animation library (Babel plugin loaded last)
- `react-native-screens` ~4.16.0 - Native screen management
- `react-native-safe-area-context` ~5.6.0 - Safe area insets
- `react-native-svg` 15.12.1 - SVG rendering
- `react-native-webview` 13.15.0 - In-app web views
- `react-native-render-html` ~6.3.4 - HTML content rendering
- `@react-native-async-storage/async-storage` 2.2.0 - Persistent storage (used for Supabase session persistence)
- `expo-image-picker` ~17.0.10 - Image selection
- `expo-linear-gradient` ~15.0.8 - Gradient backgrounds
- `expo-splash-screen` ~31.0.13 - Splash screen management
- `lucide-react-native` ^0.577.0 - Icons (native)
- `phosphor-react-native` ^3.0.3 - Additional icon set
- Google Fonts packages: `@expo-google-fonts/outfit`, `@expo-google-fonts/dm-sans`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/raleway`, `@expo-google-fonts/cormorant-garamond`
- `fastapi` 0.115.x - API framework
- `uvicorn[standard]` 0.34.x - ASGI server
- `notebooklm-py` >=0.3.3 - Google NotebookLM automation client
- `pydantic` >=2.0 - Request/response models
- `python-dotenv` >=1.0 - Environment variable loading
## Configuration
- Web/Admin: ES2020 target, ESNext modules, bundler resolution, strict mode, `@/*` path alias to `./src/*`
- Mobile: extends `expo/tsconfig.base`, strict mode, `@/*` path alias to `./*`
- Both web and admin use identical config: React plugin + `@` alias
- Web runs on port 5173, admin on port 5174
- Preset: `babel-preset-expo` with `jsxImportSource: 'nativewind'`
- Plugins: `module-resolver` (alias `@` to `./`), `react-native-reanimated/plugin` (must be last)
- Config: `apps/mobile/babel.config.js`
- Wraps default Expo config with NativeWind integration
- Config: `apps/mobile/metro.config.js`
- No semicolons, single quotes, trailing commas everywhere, 100 char width, 2-space indent
- Config: `.prettierrc`
- Flat config format, extends recommended + typescript-eslint recommended
- Warns on unused vars (ignoring `_` prefixed args) and `any` usage
- Config: `eslint.config.mjs`
## Build & Run Commands
## Platform Requirements
- Node.js (v24.x detected, no version pin file)
- npm (workspace-aware)
- Expo CLI (for mobile development)
- Xcode / Android Studio (for native mobile builds)
- Python 3.12 + Docker (for NotebookLM service)
- Supabase (hosted) - Database, Auth, Edge Functions
- Docker host for NotebookLM Python service
- Static hosting for web/admin Vite builds (likely Vercel/Netlify - not explicitly configured)
- App stores for mobile distribution (bundle ID: `com.broto.app`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Mobile app (Expo): **kebab-case** for hooks and lib files (`use-auth.ts`, `use-pet.ts`, `api-client.ts`, `create-cached-hook.ts`, `daily-missions.ts`)
- Mobile app: **PascalCase** for React components (`QuestionPlayer.tsx`, `BrotoChatFab.tsx`, `AnimatedEntry.tsx`, `ListCard.tsx`)
- Mobile app: layout files use underscore prefix convention per expo-router (`_layout.tsx`)
- Web app (Vite): **camelCase** for hooks and lib files (`useUser.ts`, `usePet.ts`, `createCachedHook.ts`, `useQuestionsFilters.ts`)
- Web app: **PascalCase** for React components and pages (`QuestionPlayer.tsx`, `Home.tsx`, `Login.tsx`, `AppShell.tsx`)
- Admin app: follows the same web conventions as the web app
- Shared package: **kebab-case** for all files (`api-client.ts`, `create-cached-hook.ts`, `class-code.ts`)
- Supabase functions: **kebab-case** directory names, always `index.ts` entry (`user-me/index.ts`, `pet-me/index.ts`)
- Use **camelCase** for all functions and methods
- Hook functions: prefix with `use` (`useAuth`, `useUser`, `usePet`, `useProgress`)
- Factory/creator functions: prefix with `create` (`createCachedHook`, `createCachedStore`, `createClient`)
- Handler functions: prefix with `handle` (`handleSelect`, `handleSubmit`, `handleNext`)
- Refresh functions: prefix with `refresh` (`refreshPet`, `refreshProgress`, `refreshUser`)
- Use **camelCase** for local variables and state (`currentClass`, `loadingPet`, `questoesHoje`)
- Domain terms kept in Portuguese where they represent user-facing concepts (`nome`, `questoesHoje`, `acertosHoje`, `horasDisponiveisPorDia`)
- Constants: **UPPER_SNAKE_CASE** for module-level constants (`META_QUESTOES_DIA`, `STALE_MS`, `ALLOWED_ORIGINS`, `FASE_EMOJI`, `FASE_LABEL`)
- Use **PascalCase** for types and interfaces (`UserProfile`, `PetData`, `AreaStat`, `ProgressData`)
- Prefer `interface` for object shapes that define component props or API responses
- Prefer `type` for unions, aliases, and database row shapes (`Class`, `Enrollment`, `Material`, `AuthStatus`)
- Suffix `Props` for component prop types (`QuestionPlayerProps`, `ListCardProps`)
- Suffix `Return` for hook return types (`UseAuthReturn`, `CachedHookReturn`)
- Suffix `Type` for context types (`AuthContextType`, `ClassContextType`, `AdminAuthContextType`)
## Code Style
- Prettier with config at `/.prettierrc`
- Key settings:
- **Important inconsistency:** The mobile app (`apps/mobile/`) uses semicolons and 4-space indentation throughout its source files, diverging from the Prettier config. The web and admin apps follow the Prettier config (no semicolons, 2-space indent). When writing new mobile code, follow the existing mobile convention (semicolons, 4-space indent). When writing web/admin code, follow Prettier (no semicolons, 2-space indent).
- ESLint v9 flat config at `/eslint.config.mjs`
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier`
- Plugins: `eslint-plugin-react-hooks`
- Key custom rules:
- Run lint: `npm run lint` (from root, covers `apps/*/src`, `packages/*/src`, `supabase/functions`)
- Run fix: `npm run lint:fix`
## Import Organization
- Mobile: `@/*` maps to `./*` (project root) -- configured in `apps/mobile/tsconfig.json`
- Web: `@/*` maps to `./src/*` -- configured in `apps/web/tsconfig.json`
- Admin: `@/*` maps to `./src/*` -- configured in `apps/admin/tsconfig.json`
- Use named imports exclusively (`import { useState } from 'react'`)
- Use `type` qualifier for type-only imports (`import type { ReactNode } from 'react'`, `import type { Question } from '@/lib/types/questions'`)
- Re-export through barrel files (`packages/shared/src/index.ts`, `apps/mobile/components/ds/index.ts`)
## Component Patterns
- All components are function declarations (never arrow functions for component definitions)
- Use `export function ComponentName()` pattern (named export, not default -- except expo-router layouts which use `export default`)
- Expo Router layouts (`_layout.tsx`) use `export default function`
- Same pattern but uses `View`, `Text`, `Pressable` from `react-native`
- Uses `StyleSheet.create()` for style objects defined after the component
- Uses NativeWind `className` props alongside inline `style` props for styling
- Inline destructured props in function signature: `({ title, onPress }: Props)`
- Default values via destructuring: `({ showChevron = true, disabled = false }: ListCardProps)`
## State Management Patterns
## Error Handling
- Custom `ApiError` class in `packages/shared/src/api/api-client.ts` with `status` and `body` properties
- 401 responses trigger automatic sign-out and redirect to login
- Mobile: race-condition guard via `handlingUnauthorized` flag in `apps/mobile/lib/api-client.ts`
- Web: direct `window.location.href = '/login'` redirect in `apps/web/src/lib/api-client.ts`
- Console error logging: `console.error('[api-client]', fnName, res.status, msg)`
- Catch blocks with silent failures (`catch { // fail silently }`, `catch { // ignore }`)
- No error boundary components detected
- Loading states managed via `loading` boolean in hooks and contexts
- Return structured JSON errors: `{ error: 'message' }` with appropriate HTTP status
- Auth check at top of every function: return 401 if no valid auth header
- Wrap entire handler in try/catch, return 500 with error string on unexpected failures
## Styling
- CSS custom properties (CSS variables) defined in `apps/web/src/styles/app.css`
- BEM-like class naming: `broto-` prefix with `__element` and `--modifier` (`broto-card`, `broto-btn-primary`, `broto-auth__title`, `broto-metric-card--stat`)
- Inline `style` props heavily used for one-off styling alongside CSS classes
- Supports light and dark themes via `[data-theme]` attribute on root element
- No CSS-in-JS library; no Tailwind on web
- NativeWind (Tailwind CSS for React Native) via `className` props
- Inline `style` props alongside NativeWind classes, referencing token values from `@/theme/tokens`
- `StyleSheet.create()` for complex, reusable style objects (e.g., in `_layout.tsx`)
- Design system tokens: `apps/mobile/theme/tokens.ts` (colors, fonts, spacing, radii)
- Design system presets: `apps/mobile/theme/ds.ts` (typography, spacing, radius, color presets)
- CSS files in `apps/admin/src/styles/` (`admin-app.css`, `broto-sidebar.css`, `web-theme.css`)
- Same CSS variable and BEM-like approach as web app
## TypeScript Usage
- All `tsconfig.json` files set `"strict": true`
- Target: `ES2020` for web/admin/shared; expo base for mobile
- `as const` assertions for immutable objects (tokens, config maps)
- Generic type parameters on API calls: `api.get<UserProfile>('/api/user/me')`
- Type narrowing via optional chaining and nullish coalescing: `data?.nome ?? ''`
- Non-null assertion used sparingly: `Deno.env.get('SUPABASE_URL')!` in edge functions
- Union types for status enums: `type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'`
- `Pick` utility type for partial interfaces: `Pick<Question, 'year' | 'index' | 'language'>`
- Named exports preferred over default exports everywhere except expo-router page/layout components
- Barrel files (`index.ts`) for public APIs of packages and component directories
## Logging
- `console.error('[context]', ...)` for API errors (e.g., `console.error('[api-client]', fnName, res.status, msg)`)
- Edge functions: `console.error('function-name:', error)`
- No structured logging, no log levels beyond error
## Comments
- JSDoc-style `/** ... */` block comments on exported functions in shared package (`packages/shared/src/api/api-client.ts`, `packages/shared/src/hooks/create-cached-hook.ts`)
- Module-level file description comments at the top of shared/library files
- Inline comments in Portuguese for section headers in components (`/* Coluna 1 -- Broto + rotina de hoje */`)
- TODO comments for unfinished features (found in `apps/mobile/app/onboarding.tsx`, `apps/web/src/pages/Onboarding.tsx`)
- Brief inline comments explaining non-obvious decisions (`// Clear user-scoped localStorage to prevent cross-account leakage`)
- Code identifiers in English (function names, variable names)
- Comments mixed: architectural comments in English, UI section labels in Portuguese
- User-facing strings exclusively in Portuguese
## Module Design
- Named exports for all public APIs
- Single default export only for expo-router pages/layouts
- Re-exports through barrel files in shared packages
- `packages/shared/src/index.ts` -- re-exports all types, utils, hooks, api
- `packages/shared/src/types/index.ts` -- (exists based on barrel pattern)
- `apps/mobile/components/ds/index.ts` -- re-exports design system components with type exports
- `apps/web/src/lib/types/questions.ts` -- simple re-export from `@broto/shared`
- Platform-agnostic logic lives in `packages/shared` (types, API helpers, cached store)
- Platform-specific wrappers live in each app (React hooks, API client with platform auth)
- Apps reference shared package via `@broto/shared` (workspace dependency `"*"`)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Three independent frontend apps sharing types and utilities via `@broto/shared`
- Supabase Edge Functions serve as the API layer (Deno runtime)
- No REST API server -- clients invoke Edge Functions directly via Supabase SDK (mobile) or raw `fetch` (web/admin)
- Python FastAPI microservice wraps Google NotebookLM for AI chat and study routine generation
- Module-level cached data stores (React-free) with thin React hook wrappers per app to avoid dual-React issues
## Apps
- Framework: React Native + Expo SDK 54 (expo-router for file-based routing)
- Purpose: Primary student-facing app for ENEM exam preparation
- Styling: NativeWind (TailwindCSS for RN) + React Native StyleSheet with design tokens
- Navigation: File-based via expo-router with tab layout and modal screens
- Entry: `apps/mobile/app/_layout.tsx`
- Framework: React 18 + Vite + react-router-dom
- Purpose: Web version of the student app (same feature set as mobile)
- Styling: CSS with CSS custom properties (light/dark theme)
- Port: 5173
- Entry: `apps/web/src/main.tsx`
- Framework: React 18 + Vite + react-router-dom
- Purpose: Teacher/admin dashboard for managing classes, students, materials
- Styling: CSS with CSS custom properties
- Port: 5174
- Entry: `apps/admin/src/main.tsx`
## Layers
- Purpose: Cross-app types, utilities, and platform-agnostic business logic
- Location: `packages/shared/src/`
- Contains: TypeScript types (Organization, Class, Student, Question, Progress, Content), API client core (ApiError, pathToFunctionName, mergeParamsIntoBody), cached store factory (createCachedStore), class code utilities
- Depends on: Nothing (zero dependencies)
- Used by: All three apps import as `@broto/shared`
- Purpose: Shared React UI components for web apps
- Location: `packages/ui/src/`
- Contains: Button, Card, Badge, Spinner components
- Depends on: React (peer dependency)
- Used by: `apps/web` (imported as `@broto/ui`). Not used by mobile or admin currently.
- Purpose: Serverless API endpoints (Deno runtime)
- Location: `supabase/functions/`
- Contains: 6 functions, each in its own directory with `index.ts`
- Depends on: Deno standard library, Supabase JS client (ESM imports)
- Used by: All frontend apps via API client
- Purpose: Python microservice wrapping Google NotebookLM for AI features
- Location: `supabase/services/notebooklm/main.py`
- Contains: FastAPI app with endpoints for notebook creation, source indexing, chat, routine generation
- Depends on: `notebooklm-py`, FastAPI, Pydantic
- Used by: Edge Functions `broto-chat` and `material-index` proxy to this service
## Data Flow
- Frontend uses REST-like paths: `/api/user/me`, `/api/pet/me`, `/api/user/progress`
- `pathToFunctionName()` in `@broto/shared` strips `/api/` prefix and replaces `/` with `-`
- Result maps to Supabase Edge Function name: `user-me`, `pet-me`, `user-progress`
- Mobile uses `supabase.functions.invoke()` (SDK); Web uses raw `fetch` to `${SUPABASE_URL}/functions/v1/${fnName}`
- **Mobile:** Module-level `CachedStore` instances (from `@broto/shared`) with React hook wrappers. Each domain entity (user, pet, progress) has its own store with 30-second staleness window, deduplication, and generation counters to prevent stale data races. Stores refresh on tab focus via `useFocusEffect`.
- **Web:** Same `CachedStore` pattern with `createCachedHook` wrapper using web React.
- **Admin:** Direct Supabase client queries (no shared cached store pattern). Uses React Context for auth.
- **Cross-tab cache invalidation:** After mutations (e.g., answering a question), explicit calls to `refreshPet()` / `refreshProgress()` trigger re-fetches across all consuming components.
- **Daily missions:** Local-only state persisted in AsyncStorage (mobile) or localStorage (web), keyed by date. Not server-synced.
## Navigation Structure
```
```
```
```
```
```
## Key Abstractions
- Purpose: Module-level singleton data cache with automatic deduplication, staleness detection, and race condition protection via generation counters
- Location: `packages/shared/src/hooks/create-cached-hook.ts` (store), `apps/mobile/hooks/create-cached-hook.ts` (React wrapper), `apps/web/src/hooks/createCachedHook.ts` (React wrapper)
- Pattern: Factory function `createCachedStore(fetcher)` returns store object. Each app wraps with its own React `useEffect`/`useState` to avoid dual-React issues in monorepo.
- Staleness window: 30 seconds (`STALE_MS`)
- Purpose: Unified API layer that maps REST-like paths to Supabase Edge Function invocations
- Location: `packages/shared/src/api/api-client.ts` (shared core), `apps/mobile/lib/api-client.ts` (mobile impl), `apps/web/src/lib/api-client.ts` (web impl)
- Pattern: Platform-specific `invoke()` implementations wrap the shared `pathToFunctionName()` and `mergeParamsIntoBody()`. Mobile uses `supabase.functions.invoke()`, web uses raw `fetch`. Both export identical `api.get()`, `api.post()`, `api.patch()`, `api.getWithParams()` interface.
- Purpose: Provides current class and organization context throughout the app
- Location: `apps/mobile/contexts/ClassContext.tsx`, `apps/web/src/contexts/ClassContext.tsx`
- Pattern: React Context that loads user's `current_class_id`, fetches class with joined organization, and provides both to child components
- Purpose: Single source of truth for ENEM study area metadata (icons, colors, labels)
- Location: `apps/mobile/theme/area-config.ts`, `apps/web/src/lib/area-config.ts`
- Pattern: Static `Record<string, AreaConfig>` mapping area slugs to display configuration
## Entry Points
- Triggers: App startup
- Responsibilities: Font loading, animated splash screen, auth state monitoring, navigation routing, wraps app in ClassProvider
- Triggers: HTTP requests from frontend clients
- Responsibilities: Auth verification, CORS handling, database operations, proxying to Python service
- Functions: `user-me`, `pet-me`, `user-progress`, `broto-chat`, `class-join`, `material-index`
- Triggers: HTTP requests from Edge Functions
- Responsibilities: Google NotebookLM integration -- notebook lifecycle, source indexing, AI chat, study routine generation
## Error Handling
- Edge Functions return structured JSON errors `{ error: string }` with appropriate HTTP status codes
- `ApiError` class in `@broto/shared` wraps HTTP errors with `status`, `message`, and `body` fields
- Mobile API client: 401 errors trigger automatic sign-out and redirect to login (debounced via `handlingUnauthorized` flag)
- Web API client: 401 errors trigger `supabase.auth.signOut()` and `window.location.href = '/login'`
- Edge Functions use two Supabase clients: one authed (validates JWT) and one admin (service role key for actual DB operations)
- Network errors on mobile get user-friendly messages (detects localhost vs IP issues for development)
## Cross-Cutting Concerns
## Database Schema
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
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
