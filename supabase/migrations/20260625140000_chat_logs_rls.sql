-- RLS para chat_logs: aluno lê próprios turnos; staff lê logs de alunos matriculados na org.
-- Escrita permanece fail-closed para authenticated (edge functions usam service_role).
-- Espelha mt_ps_select_owner / mt_ps_select_staff (PR-08).

DROP POLICY IF EXISTS "mt_cl_select_owner" ON public.chat_logs;
CREATE POLICY "mt_cl_select_owner"
  ON public.chat_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_cl_select_staff" ON public.chat_logs;
CREATE POLICY "mt_cl_select_staff"
  ON public.chat_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = chat_logs.user_id
        AND e.status = 'active'
        AND (
          chat_logs.class_id IS NULL
          OR e.class_id::text = chat_logs.class_id
        )
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

COMMENT ON POLICY "mt_cl_select_owner" ON public.chat_logs IS
  'Aluno lê apenas turnos do próprio user_id.';

COMMENT ON POLICY "mt_cl_select_staff" ON public.chat_logs IS
  'Professor/admin lê chat_logs de alunos com enrollment ativo na org (class_id coerente quando presente).';
