-- PR-02: add users.current_organization_id
-- Date: 2026-04-05
-- Scope: add nullable current_organization_id column + performance index

alter table if exists public.users
  add column if not exists current_organization_id uuid;

create index if not exists idx_users_current_organization_id
  on public.users(current_organization_id);
