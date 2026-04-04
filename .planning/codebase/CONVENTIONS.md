# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- Mobile app (Expo): **kebab-case** for hooks and lib files (`use-auth.ts`, `use-pet.ts`, `api-client.ts`, `create-cached-hook.ts`, `daily-missions.ts`)
- Mobile app: **PascalCase** for React components (`QuestionPlayer.tsx`, `BrotoChatFab.tsx`, `AnimatedEntry.tsx`, `ListCard.tsx`)
- Mobile app: layout files use underscore prefix convention per expo-router (`_layout.tsx`)
- Web app (Vite): **camelCase** for hooks and lib files (`useUser.ts`, `usePet.ts`, `createCachedHook.ts`, `useQuestionsFilters.ts`)
- Web app: **PascalCase** for React components and pages (`QuestionPlayer.tsx`, `Home.tsx`, `Login.tsx`, `AppShell.tsx`)
- Admin app: follows the same web conventions as the web app
- Shared package: **kebab-case** for all files (`api-client.ts`, `create-cached-hook.ts`, `class-code.ts`)
- Supabase functions: **kebab-case** directory names, always `index.ts` entry (`user-me/index.ts`, `pet-me/index.ts`)

**Functions:**
- Use **camelCase** for all functions and methods
- Hook functions: prefix with `use` (`useAuth`, `useUser`, `usePet`, `useProgress`)
- Factory/creator functions: prefix with `create` (`createCachedHook`, `createCachedStore`, `createClient`)
- Handler functions: prefix with `handle` (`handleSelect`, `handleSubmit`, `handleNext`)
- Refresh functions: prefix with `refresh` (`refreshPet`, `refreshProgress`, `refreshUser`)

**Variables:**
- Use **camelCase** for local variables and state (`currentClass`, `loadingPet`, `questoesHoje`)
- Domain terms kept in Portuguese where they represent user-facing concepts (`nome`, `questoesHoje`, `acertosHoje`, `horasDisponiveisPorDia`)
- Constants: **UPPER_SNAKE_CASE** for module-level constants (`META_QUESTOES_DIA`, `STALE_MS`, `ALLOWED_ORIGINS`, `FASE_EMOJI`, `FASE_LABEL`)

**Types:**
- Use **PascalCase** for types and interfaces (`UserProfile`, `PetData`, `AreaStat`, `ProgressData`)
- Prefer `interface` for object shapes that define component props or API responses
- Prefer `type` for unions, aliases, and database row shapes (`Class`, `Enrollment`, `Material`, `AuthStatus`)
- Suffix `Props` for component prop types (`QuestionPlayerProps`, `ListCardProps`)
- Suffix `Return` for hook return types (`UseAuthReturn`, `CachedHookReturn`)
- Suffix `Type` for context types (`AuthContextType`, `ClassContextType`, `AdminAuthContextType`)

## Code Style

**Formatting:**
- Prettier with config at `/.prettierrc`
- Key settings:
  - `semi: false` (no semicolons)
  - `singleQuote: true`
  - `trailingComma: "all"`
  - `printWidth: 100`
  - `tabWidth: 2`
- **Important inconsistency:** The mobile app (`apps/mobile/`) uses semicolons and 4-space indentation throughout its source files, diverging from the Prettier config. The web and admin apps follow the Prettier config (no semicolons, 2-space indent). When writing new mobile code, follow the existing mobile convention (semicolons, 4-space indent). When writing web/admin code, follow Prettier (no semicolons, 2-space indent).

**Linting:**
- ESLint v9 flat config at `/eslint.config.mjs`
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier`
- Plugins: `eslint-plugin-react-hooks`
- Key custom rules:
  - `@typescript-eslint/no-unused-vars: warn` (with `argsIgnorePattern: '^_'` -- prefix unused params with underscore)
  - `@typescript-eslint/no-explicit-any: warn` (prefer typed alternatives, but `any` is tolerated as warning)
- Run lint: `npm run lint` (from root, covers `apps/*/src`, `packages/*/src`, `supabase/functions`)
- Run fix: `npm run lint:fix`

## Import Organization

**Order (observed across web and admin apps):**
1. React / React Native core imports (`react`, `react-dom`, `react-native`)
2. Third-party framework imports (`react-router-dom`, `expo-router`, `react-native-reanimated`)
3. Third-party libraries (`@supabase/supabase-js`, `dompurify`, `lucide-react`, `recharts`)
4. Monorepo shared packages (`@broto/shared`, `@broto/ui`)
5. Path-aliased local imports (`@/contexts/...`, `@/hooks/...`, `@/lib/...`, `@/components/...`, `@/theme/...`)
6. Relative imports (rare, used within same directory like `./OptionButton`)

**Path Aliases:**
- Mobile: `@/*` maps to `./*` (project root) -- configured in `apps/mobile/tsconfig.json`
- Web: `@/*` maps to `./src/*` -- configured in `apps/web/tsconfig.json`
- Admin: `@/*` maps to `./src/*` -- configured in `apps/admin/tsconfig.json`

**Import style:**
- Use named imports exclusively (`import { useState } from 'react'`)
- Use `type` qualifier for type-only imports (`import type { ReactNode } from 'react'`, `import type { Question } from '@/lib/types/questions'`)
- Re-export through barrel files (`packages/shared/src/index.ts`, `apps/mobile/components/ds/index.ts`)

## Component Patterns

**Functional components only:**
- All components are function declarations (never arrow functions for component definitions)
- Use `export function ComponentName()` pattern (named export, not default -- except expo-router layouts which use `export default`)
- Expo Router layouts (`_layout.tsx`) use `export default function`

**Component structure (web apps):**
```tsx
// 1. Imports
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// 2. Types/Interfaces (if needed)
interface Props { ... }

// 3. Helper functions / constants (module-level)
const SOME_CONSTANT = 3

function helperFn() { ... }

// 4. Component
export function MyComponent({ prop1, prop2 }: Props) {
  // hooks
  const [state, setState] = useState(...)
  const { data } = useCustomHook()

  // derived state / memos
  const computed = useMemo(...)

  // handlers
  async function handleAction() { ... }

  // render
  return <div>...</div>
}
```

**Component structure (mobile):**
- Same pattern but uses `View`, `Text`, `Pressable` from `react-native`
- Uses `StyleSheet.create()` for style objects defined after the component
- Uses NativeWind `className` props alongside inline `style` props for styling

**Props pattern:**
- Inline destructured props in function signature: `({ title, onPress }: Props)`
- Default values via destructuring: `({ showChevron = true, disabled = false }: ListCardProps)`

## State Management Patterns

**No external state library.** State management relies on:

1. **React Context + Provider pattern** for auth and class state:
   - `apps/web/src/contexts/AuthContext.tsx` -- wraps app, provides `user`, `loading`, `signIn`, `signUp`, `signOut`
   - `apps/web/src/contexts/ClassContext.tsx` -- provides `currentClass`, `organization`
   - `apps/mobile/contexts/ClassContext.tsx` -- same pattern for mobile
   - `apps/admin/src/contexts/AdminAuthContext.tsx` -- admin-specific auth
   - Each context exports a provider component + a custom hook with guard (`useAuth`, `useAdminAuth`)

2. **Module-level cached store** for API data (custom `createCachedStore` / `createCachedHook` pattern):
   - Core logic in `packages/shared/src/hooks/create-cached-hook.ts` (React-free)
   - React wrapper in each app (`apps/web/src/hooks/createCachedHook.ts`, `apps/mobile/hooks/create-cached-hook.ts`)
   - Each data domain is a self-contained module: `useUser.ts`, `usePet.ts`, `useProgress.ts`
   - Pattern: `const { useHook, refresh, refreshIfStale } = createCachedHook<T>(fetcher)`
   - Exports: `useX()` hook, `refreshX()` imperative refresh, `refreshXIfStale()` conditional refresh
   - 30-second staleness window prevents unnecessary refetches

3. **Local component state** via `useState` for UI state (form inputs, selected items, loading flags)

**Context hook guard pattern:**
```tsx
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

## Error Handling

**API client errors:**
- Custom `ApiError` class in `packages/shared/src/api/api-client.ts` with `status` and `body` properties
- 401 responses trigger automatic sign-out and redirect to login
- Mobile: race-condition guard via `handlingUnauthorized` flag in `apps/mobile/lib/api-client.ts`
- Web: direct `window.location.href = '/login'` redirect in `apps/web/src/lib/api-client.ts`
- Console error logging: `console.error('[api-client]', fnName, res.status, msg)`

**Component-level errors:**
- Catch blocks with silent failures (`catch { // fail silently }`, `catch { // ignore }`)
- No error boundary components detected
- Loading states managed via `loading` boolean in hooks and contexts

**Supabase edge functions:**
- Return structured JSON errors: `{ error: 'message' }` with appropriate HTTP status
- Auth check at top of every function: return 401 if no valid auth header
- Wrap entire handler in try/catch, return 500 with error string on unexpected failures

**Pattern for async operations in components:**
```tsx
async function handleAction() {
  setLoading(true)
  try {
    await api.post('/api/something', payload)
  } catch {
    // silent or set error state
  } finally {
    setLoading(false)
  }
}
```

## Styling

**Web app (`apps/web`):**
- CSS custom properties (CSS variables) defined in `apps/web/src/styles/app.css`
- BEM-like class naming: `broto-` prefix with `__element` and `--modifier` (`broto-card`, `broto-btn-primary`, `broto-auth__title`, `broto-metric-card--stat`)
- Inline `style` props heavily used for one-off styling alongside CSS classes
- Supports light and dark themes via `[data-theme]` attribute on root element
- No CSS-in-JS library; no Tailwind on web

**Mobile app (`apps/mobile`):**
- NativeWind (Tailwind CSS for React Native) via `className` props
- Inline `style` props alongside NativeWind classes, referencing token values from `@/theme/tokens`
- `StyleSheet.create()` for complex, reusable style objects (e.g., in `_layout.tsx`)
- Design system tokens: `apps/mobile/theme/tokens.ts` (colors, fonts, spacing, radii)
- Design system presets: `apps/mobile/theme/ds.ts` (typography, spacing, radius, color presets)

**Admin app (`apps/admin`):**
- CSS files in `apps/admin/src/styles/` (`admin-app.css`, `broto-sidebar.css`, `web-theme.css`)
- Same CSS variable and BEM-like approach as web app

## TypeScript Usage

**Strict mode enabled across all apps:**
- All `tsconfig.json` files set `"strict": true`
- Target: `ES2020` for web/admin/shared; expo base for mobile

**Key patterns:**
- `as const` assertions for immutable objects (tokens, config maps)
- Generic type parameters on API calls: `api.get<UserProfile>('/api/user/me')`
- Type narrowing via optional chaining and nullish coalescing: `data?.nome ?? ''`
- Non-null assertion used sparingly: `Deno.env.get('SUPABASE_URL')!` in edge functions
- Union types for status enums: `type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'`
- `Pick` utility type for partial interfaces: `Pick<Question, 'year' | 'index' | 'language'>`

**Export patterns:**
- Named exports preferred over default exports everywhere except expo-router page/layout components
- Barrel files (`index.ts`) for public APIs of packages and component directories

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- `console.error('[context]', ...)` for API errors (e.g., `console.error('[api-client]', fnName, res.status, msg)`)
- Edge functions: `console.error('function-name:', error)`
- No structured logging, no log levels beyond error

## Comments

**When to comment:**
- JSDoc-style `/** ... */` block comments on exported functions in shared package (`packages/shared/src/api/api-client.ts`, `packages/shared/src/hooks/create-cached-hook.ts`)
- Module-level file description comments at the top of shared/library files
- Inline comments in Portuguese for section headers in components (`/* Coluna 1 -- Broto + rotina de hoje */`)
- TODO comments for unfinished features (found in `apps/mobile/app/onboarding.tsx`, `apps/web/src/pages/Onboarding.tsx`)
- Brief inline comments explaining non-obvious decisions (`// Clear user-scoped localStorage to prevent cross-account leakage`)

**Language:**
- Code identifiers in English (function names, variable names)
- Comments mixed: architectural comments in English, UI section labels in Portuguese
- User-facing strings exclusively in Portuguese

## Module Design

**Exports:**
- Named exports for all public APIs
- Single default export only for expo-router pages/layouts
- Re-exports through barrel files in shared packages

**Barrel Files:**
- `packages/shared/src/index.ts` -- re-exports all types, utils, hooks, api
- `packages/shared/src/types/index.ts` -- (exists based on barrel pattern)
- `apps/mobile/components/ds/index.ts` -- re-exports design system components with type exports
- `apps/web/src/lib/types/questions.ts` -- simple re-export from `@broto/shared`

**Monorepo shared code pattern:**
- Platform-agnostic logic lives in `packages/shared` (types, API helpers, cached store)
- Platform-specific wrappers live in each app (React hooks, API client with platform auth)
- Apps reference shared package via `@broto/shared` (workspace dependency `"*"`)

---

*Convention analysis: 2026-04-02*
