# Quick Task 260506-sjk: Criar card de progresso semanal no dashboard Broto Web

**Date:** 2026-05-06
**Status:** Completed

## Summary

- Added `HomeWeeklyProgressCard` with isolated mock data for weekly XP, accuracy, streak, study time, and area performance.
- Rendered the weekly progress card beside `HomePetBanner` in the Broto Web home dashboard.
- Added responsive dark/light theme styling for the card, including internal metric cards, mini charts, and area progress bars.

## Verification

- `npm run typecheck --workspace=@broto/web` passed.
- `npm run build --workspace=@broto/web` passed.
- Cursor lints only reported pre-existing CSS `line-clamp` compatibility warnings outside the new card styles.

## Notes

- The "Ver insights" CTA is visually present but disabled until an insights route/action exists.
- The repository already had unrelated local modifications before this quick task; implementation was kept scoped to the dashboard card files and GSD artifacts.
