-- INST-15: Schema rede — school_units + role network_admin
-- Wave 5 — Painel multi-escola

-- ---------------------------------------------------------------------------
-- 1. Estender roles de membership
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_role_check;

ALTER TABLE public.organization_memberships
  ADD CONSTRAINT organization_memberships_role_check
  CHECK (role IN ('student', 'teacher', 'org_admin', 'owner', 'network_admin'));

-- ---------------------------------------------------------------------------
-- 2. school_units — vínculo rede → escolas filhas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.school_units (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_org_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name     text,
  regional_label   text,
  grade_label      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_units_network_org_fk CHECK (network_org_id IS NOT NULL),
  CONSTRAINT school_units_child_org_fk CHECK (organization_id IS NOT NULL),
  CONSTRAINT school_units_unique_child UNIQUE (network_org_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_school_units_network_org
  ON public.school_units (network_org_id);

CREATE INDEX IF NOT EXISTS idx_school_units_child_org
  ON public.school_units (organization_id);

COMMENT ON TABLE public.school_units IS
  'Hierarquia rede → escolas. Gestor network_admin vê agregados das orgs filhas.';

-- ---------------------------------------------------------------------------
-- 3. RLS helper — network_admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_rls_is_network_admin_of(p_network_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_network_org_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = p_network_org_id
      AND om.status = 'active'
      AND om.role = 'network_admin'
  );
END;
$$;

COMMENT ON FUNCTION public.app_rls_is_network_admin_of(uuid) IS
  'SECURITY-CRITICAL: true se auth.uid() é network_admin ativo da org rede.';

REVOKE ALL ON FUNCTION public.app_rls_is_network_admin_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_rls_is_network_admin_of(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS school_units
-- ---------------------------------------------------------------------------

ALTER TABLE public.school_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mt_school_units_select" ON public.school_units;
CREATE POLICY "mt_school_units_select"
  ON public.school_units
  FOR SELECT
  TO authenticated
  USING (
    public.app_rls_is_network_admin_of(network_org_id)
    OR public.app_rls_is_active_staff_in_org(organization_id)
  );
