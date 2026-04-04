-- PR-10: verificação pós-migração — admins com org devem ter membership staff ativa
-- Executar no SQL editor (staging/prod) após 20260411120000_pr10_*.sql
-- Esperado: 0 linhas.

select
  ap.id as user_id,
  ap.email,
  ap.organization_id,
  ap.role as admin_profile_role
from public.admin_profiles ap
where ap.organization_id is not null
  and exists (select 1 from public.users u where u.id = ap.id)
  and not exists (
    select 1
    from public.organization_memberships om
    where om.user_id = ap.id
      and om.organization_id = ap.organization_id
      and om.status = 'active'
      and om.role in ('teacher', 'org_admin', 'owner')
  )
order by ap.email;
