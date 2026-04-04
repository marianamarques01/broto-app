-- PR-10: Sincronizar memberships de staff a partir de admin_profiles (idempotente)
-- Garante login no admin app (gate por organization_memberships) para contas que
-- ainda só tinham linha em admin_profiles ou ficaram com membership invited/inativo/student.
--
-- Regra: admin_profiles continua legado; esta migração apenas fecha buracos de dados.
-- Não remove linhas; não altera org_admin para teacher/owner (preserva org_admin).

-- 1) Inserir membership ativa onde não existe nenhuma linha (user_id, organization_id)
insert into public.organization_memberships (
  user_id,
  organization_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
select
  ap.id,
  ap.organization_id,
  ap.role,
  'active',
  coalesce(ap.created_at, now()),
  now(),
  now()
from public.admin_profiles ap
where ap.organization_id is not null
  and exists (select 1 from public.users u where u.id = ap.id)
  and not exists (
    select 1
    from public.organization_memberships om
    where om.user_id = ap.id
      and om.organization_id = ap.organization_id
  );

-- 2) Ativar e alinhar role ao perfil admin quando a linha já existe
update public.organization_memberships om
set
  status = 'active',
  role = case when om.role = 'org_admin' then 'org_admin' else ap.role end,
  left_at = null,
  updated_at = now()
from public.admin_profiles ap
where om.user_id = ap.id
  and om.organization_id = ap.organization_id
  and ap.organization_id is not null
  and exists (select 1 from public.users u where u.id = ap.id)
  and (
    om.status is distinct from 'active'
    or om.left_at is not null
    or om.role = 'student'
    or (
      om.role is distinct from 'org_admin'
      and om.role is distinct from ap.role
    )
  );
