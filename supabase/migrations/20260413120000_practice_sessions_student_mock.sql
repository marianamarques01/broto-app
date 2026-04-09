-- Sessões de prática/simulado (aluno autogerido e extensível)
-- SMCK-01: practice_sessions + session_id em user_question_answers

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  kind text NOT NULL DEFAULT 'student_mock',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb,
  CONSTRAINT practice_sessions_kind_check CHECK (kind IN ('student_mock', 'class_assignment'))
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_created
  ON public.practice_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_kind
  ON public.practice_sessions (user_id, kind);

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.practice_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_answers_session_id
  ON public.user_question_answers (session_id)
  WHERE session_id IS NOT NULL;

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mt_ps_select_owner" ON public.practice_sessions;
CREATE POLICY "mt_ps_select_owner"
  ON public.practice_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_ps_insert_owner" ON public.practice_sessions;
CREATE POLICY "mt_ps_insert_owner"
  ON public.practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_ps_update_owner" ON public.practice_sessions;
CREATE POLICY "mt_ps_update_owner"
  ON public.practice_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_ps_select_staff" ON public.practice_sessions;
CREATE POLICY "mt_ps_select_staff"
  ON public.practice_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = practice_sessions.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );
