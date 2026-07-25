-- INST: verificação automatizada de RLS (estrutural)
-- Executar após migrations INST em staging/produção.
-- Testes cross-tenant com JWT requerem personas — ver inst_rls_cross_tenant.sql e pr08_rls_matrix_manual.sql

do $$
declare
  tbl text;
  rls_on boolean;
begin
  foreach tbl in array array[
    'engagement_snapshots_class',
    'engagement_snapshots_org',
    'student_follow_ups'
  ]
  loop
    select c.relrowsecurity
      into rls_on
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = tbl;

    if not coalesce(rls_on, false) then
      raise exception 'RLS desabilitado em public.%', tbl;
    end if;
  end loop;
end $$;

-- Policies staff esperadas
select count(*) as inst_esc_policies
  from pg_policies
 where schemaname = 'public'
   and tablename = 'engagement_snapshots_class'
   and policyname = 'inst_esc_select_staff';

select count(*) as inst_eso_policies
  from pg_policies
 where schemaname = 'public'
   and tablename = 'engagement_snapshots_org'
   and policyname = 'inst_eso_select_staff';

select count(*) as inst_sfu_policies
  from pg_policies
 where schemaname = 'public'
   and tablename = 'student_follow_ups'
   and policyname in ('inst_sfu_select_staff', 'inst_sfu_insert_staff', 'inst_sfu_update_staff');

-- Esperado: inst_esc_policies = 1, inst_eso_policies = 1, inst_sfu_policies = 3
