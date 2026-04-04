-- PR-01.1: organization_memberships consistency/maintenance adjustments
-- Date: 2026-04-04
-- Scope: joined_at default, full authz index, updated_at trigger reuse

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'organization_memberships'
  ) then
    alter table public.organization_memberships
      alter column joined_at set default now();
  end if;
end $$;

create index if not exists idx_org_memberships_user_org
  on public.organization_memberships(user_id, organization_id);

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_set_updated_at'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute $fn$
      create function public.fn_set_updated_at()
      returns trigger
      language plpgsql
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$;
    $fn$;
  end if;
end $$;

drop trigger if exists trg_org_memberships_updated_at on public.organization_memberships;
create trigger trg_org_memberships_updated_at
  before update on public.organization_memberships
  for each row
  execute function public.fn_set_updated_at();
