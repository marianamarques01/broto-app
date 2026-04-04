-- PR-08: RLS multi-tenant com organization_memberships como fonte canónica
--
-- CONTRATO DE ESCRITA — enrollments (authenticated):
--   Não existe política FOR INSERT para role authenticated. Toda criação/reativação
--   de matrícula deve ocorrer via RPCs chamados com service_role:
--   - public.rpc_class_join
--   - public.rpc_onboard_new_user_default_org (trigger de signup)
--   Clientes com anon JWT não devem usar .insert() em enrollments; revisar code review.
--
-- organizations.is_public:
--   A policy mt_org_select_public expõe a linha inteira da tabela a qualquer
--   utilizador autenticado. Manter organizations.config e campos sem dados sensíveis
--   (PII, segredos, chaves API). Evolução: view org_public com colunas mínimas.
--
-- Ordem de predicados (aluno / recursos escolarizados):
--   membership ativo (organization_memberships → organization_id) → turma / vínculo
--   (classes.is_active, class_id coerente) → enrollment ativo onde aplicável.
--   Evita confiar só em enrollment antes de validar vínculo orgânico ao tenant.
--
-- ---------------------------------------------------------------------------
-- SECURITY-CRITICAL: helpers SECURITY DEFINER + row_security = off
-- São o único bypass intencional de RLS para quebrar ciclos de avaliação.
-- Regras: nunca devolver org “inventada”; NULL = fechado (predicados falham);
-- app_rls_class_org_id só quando a turma existe e, se p_require_active, is_active.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.app_rls_class_org_id(uuid);

CREATE OR REPLACE FUNCTION public.app_rls_class_org_id(p_class_id uuid, p_require_active boolean DEFAULT true)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  /* SECURITY-CRITICAL: usado por policies RLS; bypass controlado de row_security */
  SELECT c.organization_id
  FROM public.classes c
  WHERE c.id = p_class_id
    AND (NOT p_require_active OR c.is_active = true);
$$;

COMMENT ON FUNCTION public.app_rls_class_org_id(uuid, boolean) IS
'SECURITY-CRITICAL: RLS helper. Retorna organization_id só se a turma existir; com p_require_active=true (default), só turmas ativas. Sem match => NULL (fail-closed).';

CREATE OR REPLACE FUNCTION public.app_rls_is_active_staff_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  /* SECURITY-CRITICAL: usado por policies RLS; bypass controlado de row_security */
  SELECT p_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = p_org_id
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    );
$$;

COMMENT ON FUNCTION public.app_rls_is_active_staff_in_org(uuid) IS
'SECURITY-CRITICAL: RLS helper. True só com org não nula e membership staff ativo para auth.uid().';

REVOKE ALL ON FUNCTION public.app_rls_class_org_id(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_rls_class_org_id(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.app_rls_is_active_staff_in_org(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_rls_is_active_staff_in_org(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- organization_memberships (RLS novo)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mt_om_select" ON public.organization_memberships;
CREATE POLICY "mt_om_select"
  ON public.organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.app_rls_is_active_staff_in_org(organization_memberships.organization_id)
  );

-- Sem INSERT/UPDATE/DELETE para authenticated: mutações via service_role (RPCs, dashboard jobs)

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin vê sua organização" ON public.organizations;
DROP POLICY IF EXISTS "aluno vê organização da turma" ON public.organizations;
DROP POLICY IF EXISTS "mt_org_select_member" ON public.organizations;
DROP POLICY IF EXISTS "mt_org_select_public" ON public.organizations;

CREATE POLICY "mt_org_select_member"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = organizations.id
        AND om.status = 'active'
    )
  );

CREATE POLICY "mt_org_select_public"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- ---------------------------------------------------------------------------
-- classes (aluno: membership → turma ativa → enrollment ativo)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin vê turmas da organização" ON public.classes;
DROP POLICY IF EXISTS "aluno vê própria turma" ON public.classes;
DROP POLICY IF EXISTS "mt_class_select_student" ON public.classes;
DROP POLICY IF EXISTS "mt_class_staff_all" ON public.classes;

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
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );

CREATE POLICY "mt_class_staff_all"
  ON public.classes
  FOR ALL
  TO authenticated
  USING (public.app_rls_is_active_staff_in_org(classes.organization_id))
  WITH CHECK (public.app_rls_is_active_staff_in_org(classes.organization_id));

-- ---------------------------------------------------------------------------
-- enrollments: leitura autenticada; INSERT só service_role (ver CONTRATO no topo)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "aluno vê próprias matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "admin vê matrículas das turmas" ON public.enrollments;
DROP POLICY IF EXISTS "aluno pode se matricular" ON public.enrollments;
DROP POLICY IF EXISTS "mt_enrollment_select_student" ON public.enrollments;
DROP POLICY IF EXISTS "mt_enrollment_select_staff" ON public.enrollments;
DROP POLICY IF EXISTS "mt_enrollment_update_staff" ON public.enrollments;

CREATE POLICY "mt_enrollment_select_student"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(enrollments.class_id, true)
    )
    AND student_id = (SELECT auth.uid())
    AND enrollments.status = 'active'
  );

CREATE POLICY "mt_enrollment_select_staff"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    public.app_rls_is_active_staff_in_org(
      public.app_rls_class_org_id(enrollments.class_id, false)
    )
  );

CREATE POLICY "mt_enrollment_update_staff"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    public.app_rls_is_active_staff_in_org(
      public.app_rls_class_org_id(enrollments.class_id, false)
    )
  )
  WITH CHECK (
    public.app_rls_is_active_staff_in_org(
      public.app_rls_class_org_id(enrollments.class_id, false)
    )
  );

-- ---------------------------------------------------------------------------
-- materials (aluno: membership org → enrollment na turma do material)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin gerencia materiais" ON public.materials;
DROP POLICY IF EXISTS "aluno vê materiais da turma" ON public.materials;
DROP POLICY IF EXISTS "mt_material_select_student" ON public.materials;
DROP POLICY IF EXISTS "mt_material_staff_all" ON public.materials;

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
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = (SELECT auth.uid())
        AND e.class_id = materials.class_id
        AND e.status = 'active'
    )
  );

CREATE POLICY "mt_material_staff_all"
  ON public.materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = materials.organization_id
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = materials.organization_id
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

-- ---------------------------------------------------------------------------
-- user_question_answers (staff: membership staff org → enrollment ativo na turma)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_question_answers_owner_select" ON public.user_question_answers;
DROP POLICY IF EXISTS "user_question_answers_owner_insert" ON public.user_question_answers;
DROP POLICY IF EXISTS "admin vê respostas dos alunos" ON public.user_question_answers;
DROP POLICY IF EXISTS "mt_uqa_select_owner" ON public.user_question_answers;
DROP POLICY IF EXISTS "mt_uqa_insert_owner" ON public.user_question_answers;
DROP POLICY IF EXISTS "mt_uqa_select_staff" ON public.user_question_answers;

CREATE POLICY "mt_uqa_select_owner"
  ON public.user_question_answers
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "mt_uqa_insert_owner"
  ON public.user_question_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "mt_uqa_select_staff"
  ON public.user_question_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = user_question_answers.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

-- ---------------------------------------------------------------------------
-- topic_performance
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "topic_performance_owner" ON public.topic_performance;
DROP POLICY IF EXISTS "admin vê performance dos alunos" ON public.topic_performance;
DROP POLICY IF EXISTS "mt_tp_student_all" ON public.topic_performance;
DROP POLICY IF EXISTS "mt_tp_staff_select" ON public.topic_performance;

CREATE POLICY "mt_tp_student_all"
  ON public.topic_performance
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "mt_tp_staff_select"
  ON public.topic_performance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = topic_performance.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );
