-- INST: role broto_admin — administrador geral (acesso a todas as camadas no admin)

ALTER TABLE public.organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_role_check;

ALTER TABLE public.organization_memberships
  ADD CONSTRAINT organization_memberships_role_check
  CHECK (role IN (
    'student', 'teacher', 'org_admin', 'owner', 'network_admin', 'broto_admin'
  ));
