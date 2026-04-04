# Testing Landscape

**Date:** 2026-04-02
**Focus:** Quality — Testing

---

## Current State

**This project has zero automated tests.**

- No test framework installed
- No test files found anywhere in the codebase
- No test configuration (jest.config, vitest.config, etc.)
- No test scripts in any package.json

## Quality Gates in Place

The only quality mechanisms currently active:

| Gate | Tool | Scope |
|------|------|-------|
| Type checking | TypeScript (strict mode) | All packages |
| Linting | ESLint | All packages |
| Build verification | Turbo `typecheck` | Monorepo-wide |

## Test Coverage

- **Unit tests:** None
- **Integration tests:** None
- **E2E tests:** None
- **Component tests:** None

## Recommendations (Priority Order)

### 1. Shared Package Pure Functions (Highest Priority)
- `packages/shared` likely contains utilities consumed by multiple apps
- Pure functions are easiest to test and highest ROI
- **Recommended tool:** Vitest

### 2. Supabase Edge Functions
- Edge functions in `supabase/functions/` handle auth and data
- Critical business logic (user-me, pet-me, user-progress)
- **Recommended tool:** Deno.test (native to Supabase edge functions)

### 3. App Hooks and Business Logic
- Custom hooks and state management logic
- **Recommended tool:** Jest + React Native Testing Library (mobile), Vitest (web)

### 4. Component Tests
- UI components with interaction logic
- **Recommended tool:** React Native Testing Library / Testing Library

### 5. E2E Tests
- Critical user flows (onboarding, auth, quiz)
- **Recommended tool:** Detox (mobile) or Maestro

## Suggested Framework Setup

```
# For packages/shared and web apps
pnpm add -D vitest

# For React Native mobile app
pnpm add -D jest @testing-library/react-native

# For Supabase edge functions (built-in)
# Deno.test is available natively
```
