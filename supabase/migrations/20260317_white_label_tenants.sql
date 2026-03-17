-- White label foundation: tenants + tenant_id + RLS isolation
-- Date: 2026-03-17

-- 1) Tenants table + seed ENEM
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

insert into public.tenants (slug, name, config)
values (
  'enem',
  'ENEM',
  '{
    "mascot_name": "Broto",
    "primary_color": "#4CAF50",
    "features": {
      "audio_overview": true,
      "mind_map": true,
      "flashcards": true
    }
  }'::jsonb
)
on conflict (slug) do nothing;

-- Helper view to fetch current user's tenant_id (from profiles)
create or replace view public.current_tenant as
select p.tenant_id
from public.profiles p
where p.id = auth.uid();

-- 2) profiles.tenant_id (platform user belongs to a tenant)
alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id);

update public.profiles
  set tenant_id = (select id from public.tenants where slug = 'enem')
  where tenant_id is null;

alter table public.profiles
  alter column tenant_id set not null;

-- 3) Content tables: tenant_id + RLS (run only if table exists)
-- NOTE: adjust table names if your schema differs.
do $$
declare
  t text;
  tables text[] := array[
    'topics',
    'questions',
    'study_plans',
    'study_sessions',
    'materials',
    'achievements',
    'routines'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists tenant_id uuid references public.tenants(id);', t);

      execute format(
        'update public.%I set tenant_id = (select id from public.tenants where slug = %L) where tenant_id is null;',
        t,
        'enem'
      );

      execute format('alter table public.%I alter column tenant_id set not null;', t);
      execute format('alter table public.%I enable row level security;', t);

      -- Create/replace policy: allow access only within current tenant.
      -- Postgres has no "create policy if not exists", so we drop then create.
      execute format('drop policy if exists %I on public.%I;', t || '_tenant_isolation', t);
      execute format(
        'create policy %I on public.%I for all using (tenant_id = (select tenant_id from public.current_tenant));',
        t || '_tenant_isolation',
        t
      );
    end if;
  end loop;
end $$;

