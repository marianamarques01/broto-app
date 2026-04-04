# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript ^5.4.0 - All frontend apps (web, admin, mobile), shared packages, and Supabase Edge Functions
- SQL (PostgreSQL) - Database migrations and seed files in `supabase/migrations/`

**Secondary:**
- Python 3.12 - NotebookLM AI service at `supabase/services/notebooklm/`
- CSS (Tailwind) - Mobile app styling via NativeWind at `apps/mobile/global.css`

## Runtime

**Environments:**
- Node.js v24.10.0 (detected on host; no `.nvmrc` or `.node-version` file pinning the version)
- Deno - Supabase Edge Functions runtime (imports from `https://deno.land/std@0.168.0/`)
- Python 3.12 - NotebookLM microservice Docker container

**Package Manager:**
- npm 11.6.0
- Lockfiles: Root `package-lock.json` present; mobile app has its own `apps/mobile/package-lock.json`

## Monorepo Structure

**Tool:** Turborepo ^2.0.0 (resolved 2.8.17)
- Config: `turbo.json`
- Workspaces defined in root `package.json`: `apps/*` and `packages/*`

**Workspace packages:**
| Package | Path | Purpose |
|---------|------|---------|
| `@broto/web` | `apps/web/` | Student-facing web app (Vite + React) |
| `@broto/admin` | `apps/admin/` | Admin/teacher dashboard (Vite + React) |
| `broto-mobile` | `apps/mobile/` | Mobile app (Expo + React Native) |
| `@broto/shared` | `packages/shared/` | Shared types, utilities, API client core |
| `@broto/ui` | `packages/ui/` | Shared React UI components (Button, Card, Badge, Spinner) |
| `broto-docs-tools` | `docs/` | Documentation tooling (Playwright) |

**Turbo tasks:**
- `build`: depends on `^build`, outputs `dist/**` and `.expo/**`
- `dev`: no cache, persistent
- `lint`: standalone
- `typecheck`: depends on `^build`

## Frameworks

**Core:**
- React 18.3.x - Web and admin apps
- React 19.1.0 - Mobile app
- React Native 0.81.5 - Mobile native layer
- Expo SDK 54 (`expo@^54.0.0`) - Mobile managed workflow, new architecture enabled
- Expo Router ~6.0.23 - File-based routing for mobile app

**Build/Dev:**
- Vite ^5.4.0 - Web and admin app bundler
- `@vitejs/plugin-react` ^4.3.0 - React Fast Refresh for Vite
- Metro (via Expo) - Mobile bundler, configured in `apps/mobile/metro.config.js`
- Babel (via `babel-preset-expo`) - Mobile transpilation, config at `apps/mobile/babel.config.js`
- Turborepo 2.8.17 - Monorepo orchestration

**Styling:**
- NativeWind ^4.2.1 - Tailwind CSS for React Native (mobile only)
- Tailwind CSS 3.4.17 - devDependency powering NativeWind
- CSS Variables - Web and admin use custom CSS properties (no Tailwind on web)

**Testing:**
- Playwright ^1.49.1 - In `docs/` package only, likely for documentation screenshots
- No unit test framework detected (no Jest, Vitest, or testing-library in any `package.json`)

**Linting/Formatting:**
- ESLint ^9.28.0 - Flat config at `eslint.config.mjs`
- `typescript-eslint` ^8.57.1 - TypeScript linting rules
- `eslint-plugin-react-hooks` ^7.0.1 - React hooks rules
- `eslint-config-prettier` ^10.1.8 - Disables ESLint rules conflicting with Prettier
- Prettier ^3.8.1 - Code formatter, config at `.prettierrc`

## Key Dependencies

**Critical (used across multiple apps):**
- `@supabase/supabase-js` ^2.45.0 (web/admin) / ^2.90.1 (mobile) - Supabase client for auth, database, and edge function invocation
- `react-router-dom` ^6.26.0 - Client-side routing for web and admin apps
- `@broto/shared` (workspace) - Shared types (`Organization`, `Class`, `Material`, `Enrollment`, etc.), API client utilities (`ApiError`, `pathToFunctionName`, `mergeParamsIntoBody`)

**Web app (`apps/web/`):**
- `recharts` ^2.12.0 - Charts for progress/performance visualization
- `lucide-react` ^0.577.0 - Icon library
- `dompurify` ^3.3.3 - HTML sanitization (for rendering HTML content safely)

**Admin app (`apps/admin/`):**
- `recharts` ^2.12.0 - Charts for class indicators dashboard
- `clsx` ^2.1.1 - Conditional classname utility

**Mobile app (`apps/mobile/`):**
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

**Python NotebookLM service (`supabase/services/notebooklm/`):**
- `fastapi` 0.115.x - API framework
- `uvicorn[standard]` 0.34.x - ASGI server
- `notebooklm-py` >=0.3.3 - Google NotebookLM automation client
- `pydantic` >=2.0 - Request/response models
- `python-dotenv` >=1.0 - Environment variable loading

## Configuration

**TypeScript:**
- Web/Admin: ES2020 target, ESNext modules, bundler resolution, strict mode, `@/*` path alias to `./src/*`
  - `apps/web/tsconfig.json`, `apps/admin/tsconfig.json`
- Mobile: extends `expo/tsconfig.base`, strict mode, `@/*` path alias to `./*`
  - `apps/mobile/tsconfig.json`

**Vite:**
- Both web and admin use identical config: React plugin + `@` alias
  - `apps/web/vite.config.ts`, `apps/admin/vite.config.ts`
- Web runs on port 5173, admin on port 5174

**Babel (mobile only):**
- Preset: `babel-preset-expo` with `jsxImportSource: 'nativewind'`
- Plugins: `module-resolver` (alias `@` to `./`), `react-native-reanimated/plugin` (must be last)
- Config: `apps/mobile/babel.config.js`

**Metro (mobile only):**
- Wraps default Expo config with NativeWind integration
- Config: `apps/mobile/metro.config.js`

**Prettier:**
- No semicolons, single quotes, trailing commas everywhere, 100 char width, 2-space indent
- Config: `.prettierrc`

**ESLint:**
- Flat config format, extends recommended + typescript-eslint recommended
- Warns on unused vars (ignoring `_` prefixed args) and `any` usage
- Config: `eslint.config.mjs`

## Build & Run Commands

**Root (via Turborepo):**
```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all packages and apps
npm run lint         # ESLint across apps, packages, and supabase functions
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all TS/TSX files
npm run format:check # Prettier check only
npm run typecheck    # TypeScript type checking
```

**Mobile app (`apps/mobile/`):**
```bash
npx expo start       # Start Expo dev server
npx expo start --ios # Start with iOS simulator
```

**NotebookLM service (`supabase/services/notebooklm/`):**
```bash
docker build -t broto-notebooklm .
docker run -p 8000:8000 broto-notebooklm
```

## Platform Requirements

**Development:**
- Node.js (v24.x detected, no version pin file)
- npm (workspace-aware)
- Expo CLI (for mobile development)
- Xcode / Android Studio (for native mobile builds)
- Python 3.12 + Docker (for NotebookLM service)

**Production:**
- Supabase (hosted) - Database, Auth, Edge Functions
- Docker host for NotebookLM Python service
- Static hosting for web/admin Vite builds (likely Vercel/Netlify - not explicitly configured)
- App stores for mobile distribution (bundle ID: `com.broto.app`)

---

*Stack analysis: 2026-04-02*
