-- PR-01: Schema base de memberships
-- Date: 2026-04-03
-- Scope: create organization_memberships table + basic constraints/indexes

create extension if not exists pgcrypto;

create table if not exists public.organization_memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role            text not null default 'student',
  status          text not null default 'active',
  invited_by      uuid references public.users(id) on delete set null,
  joined_at       timestamptz,
  left_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_memberships_role_check'
      and conrelid = 'public.organization_memberships'::regclass
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_role_check
      check (role in ('student', 'teacher', 'org_admin', 'owner'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_memberships_status_check'
      and conrelid = 'public.organization_memberships'::regclass
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_status_check
      check (status in ('active', 'inactive', 'invited', 'removed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_memberships_left_after_joined_check'
      and conrelid = 'public.organization_memberships'::regclass
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_left_after_joined_check
      check (left_at is null or joined_at is null or left_at >= joined_at);
  end if;
end $$;

create unique index if not exists idx_org_memberships_user_org_active_unique
  on public.organization_memberships(user_id, organization_id)
  where status = 'active';

create index if not exists idx_org_memberships_user_status
  on public.organization_memberships(user_id, status);

create index if not exists idx_org_memberships_org_status
  on public.organization_memberships(organization_id, status);
