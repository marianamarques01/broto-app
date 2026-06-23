-- Staff pode ler perfil (nome, etc.) de alunos matriculados em turmas da org.
-- Espelha mt_tp_staff_select / mt_uqa_select_staff (PR-08).

DROP POLICY IF EXISTS "mt_users_select_staff" ON public.users;

CREATE POLICY "mt_users_select_staff"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = users.id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "mt_pets_select_staff" ON public.pets;

CREATE POLICY "mt_pets_select_staff"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = pets.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

COMMENT ON POLICY "mt_users_select_staff" ON public.users IS
  'Professor/admin lê nome e perfil básico de alunos matriculados na org.';

COMMENT ON POLICY "mt_pets_select_staff" ON public.pets IS
  'Professor/admin lê XP/nível do Broto de alunos matriculados na org.';
