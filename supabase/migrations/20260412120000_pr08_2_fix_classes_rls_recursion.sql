-- PR-08.2: Evitar recursão infinita em RLS da tabela `classes`
--
-- Causa: `mt_class_select_student` fazia EXISTS em `public.enrollments` com RLS ativo;
-- as policies de enrollments chamam `app_rls_class_org_id`, que lê `classes`. Funções
-- SECURITY DEFINER em LANGUAGE sql podem ser inlined no plano e, nesse contexto,
-- o bypass `SET row_security = off` pode não aplicar → PostgreSQL detecta ciclo 42P17.
--
-- Correção:
-- 1) Helpers críticos em plpgsql (não inlined como sql).
-- 2) Checagem de matrícula ativa via `app_rls_user_has_active_enrollment_in_class` (RLS off).
-- 3) Policy de materiais para alunos: mesma checagem sem sub-SELECT direto em enrollments.

CREATE OR REPLACE FUNCTION public.app_rls_class_org_id(
  p_class_id uuid,
  p_require_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_org uuid;
BEGIN
  SELECT c.organization_id INTO v_org
  FROM public.classes c
  WHERE c.id = p_class_id
    AND (NOT p_require_active OR c.is_active = true);

  RETURN v_org;
END;
$$;

CREATE OR REPLACE FUNCTION public.app_rls_is_active_staff_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_org_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = p_org_id
      AND om.status = 'active'
      AND om.role IN ('teacher', 'org_admin', 'owner')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.app_rls_user_has_active_enrollment_in_class(p_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_class_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.class_id = p_class_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION public.app_rls_user_has_active_enrollment_in_class(uuid) IS
'SECURITY-CRITICAL: RLS helper. True se auth.uid() tem enrollment ativo na turma. RLS desligado no corpo.';

REVOKE ALL ON FUNCTION public.app_rls_user_has_active_enrollment_in_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_rls_user_has_active_enrollment_in_class(uuid) TO authenticated;

DROP POLICY IF EXISTS "mt_class_select_student" ON public.classes;

CREATE POLICY "mt_class_select_student"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = classes.organization_id
        AND om.status = 'active'
    )
    AND classes.is_active = true
    AND public.app_rls_user_has_active_enrollment_in_class(classes.id)
  );

DROP POLICY IF EXISTS "mt_material_select_student" ON public.materials;

CREATE POLICY "mt_material_select_student"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = materials.organization_id
        AND om.status = 'active'
    )
    AND public.app_rls_user_has_active_enrollment_in_class(materials.class_id)
  );
