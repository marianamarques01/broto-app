-- INST-01: Snapshots de engajamento + marcação de acompanhamento
-- Módulo Instituições — Wave 1

-- ---------------------------------------------------------------------------
-- engagement_snapshots_class
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.engagement_snapshots_class (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                 uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  organization_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  computed_at              timestamptz NOT NULL DEFAULT now(),
  total_students           int NOT NULL DEFAULT 0,
  active_7d_count          int NOT NULL DEFAULT 0,
  active_7d_pct            numeric(5, 2) NOT NULL DEFAULT 0,
  streak_broken_count      int NOT NULL DEFAULT 0,
  missing_count            int NOT NULL DEFAULT 0,
  missing_days_threshold   int NOT NULL DEFAULT 7,
  avg_p_know_by_area       jsonb NOT NULL DEFAULT '{}'::jsonb,
  weak_topics              jsonb NOT NULL DEFAULT '[]'::jsonb,
  at_risk_student_ids      uuid[] NOT NULL DEFAULT '{}'::uuid[],
  student_engagement       jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT engagement_snapshots_class_org_class_fk
    CHECK (class_id IS NOT NULL AND organization_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_class_class_computed
  ON public.engagement_snapshots_class (class_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_class_org_computed
  ON public.engagement_snapshots_class (organization_id, computed_at DESC);

COMMENT ON TABLE public.engagement_snapshots_class IS
  'Snapshot horário de engajamento por turma. Escrita via service_role (job engagement-snapshot-refresh).';

-- ---------------------------------------------------------------------------
-- engagement_snapshots_org
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.engagement_snapshots_org (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  computed_at              timestamptz NOT NULL DEFAULT now(),
  total_classes            int NOT NULL DEFAULT 0,
  total_students           int NOT NULL DEFAULT 0,
  active_7d_pct            numeric(5, 2) NOT NULL DEFAULT 0,
  abandonment_risk_index   numeric(5, 2) NOT NULL DEFAULT 0,
  class_rankings           jsonb NOT NULL DEFAULT '[]'::jsonb,
  at_risk_alerts           jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT engagement_snapshots_org_org_fk CHECK (organization_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_org_org_computed
  ON public.engagement_snapshots_org (organization_id, computed_at DESC);

COMMENT ON TABLE public.engagement_snapshots_org IS
  'Snapshot horário agregado por organização. Escrita via service_role.';

-- ---------------------------------------------------------------------------
-- student_follow_ups
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_follow_ups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  class_id        uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  marked_by       uuid NOT NULL REFERENCES auth.users(id),
  note            text,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'resolved')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS student_follow_ups_one_active_per_student
  ON public.student_follow_ups (class_id, student_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_student_follow_ups_org_status
  ON public.student_follow_ups (organization_id, status);

COMMENT ON TABLE public.student_follow_ups IS
  'Marcação de aluno em acompanhamento pelo professor (sinal para coordenação).';

-- ---------------------------------------------------------------------------
-- RLS — engagement_snapshots_class
-- ---------------------------------------------------------------------------

ALTER TABLE public.engagement_snapshots_class ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inst_esc_select_staff" ON public.engagement_snapshots_class;
CREATE POLICY "inst_esc_select_staff"
  ON public.engagement_snapshots_class
  FOR SELECT
  TO authenticated
  USING (public.app_rls_is_active_staff_in_org(organization_id));

-- INSERT/UPDATE/DELETE: apenas service_role (sem policy authenticated)

-- ---------------------------------------------------------------------------
-- RLS — engagement_snapshots_org
-- ---------------------------------------------------------------------------

ALTER TABLE public.engagement_snapshots_org ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inst_eso_select_staff" ON public.engagement_snapshots_org;
CREATE POLICY "inst_eso_select_staff"
  ON public.engagement_snapshots_org
  FOR SELECT
  TO authenticated
  USING (public.app_rls_is_active_staff_in_org(organization_id));

-- ---------------------------------------------------------------------------
-- RLS — student_follow_ups
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inst_sfu_select_staff" ON public.student_follow_ups;
CREATE POLICY "inst_sfu_select_staff"
  ON public.student_follow_ups
  FOR SELECT
  TO authenticated
  USING (public.app_rls_is_active_staff_in_org(organization_id));

DROP POLICY IF EXISTS "inst_sfu_insert_staff" ON public.student_follow_ups;
CREATE POLICY "inst_sfu_insert_staff"
  ON public.student_follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.app_rls_is_active_staff_in_org(organization_id)
    AND marked_by = (SELECT auth.uid())
    AND organization_id = public.app_rls_class_org_id(class_id, false)
  );

DROP POLICY IF EXISTS "inst_sfu_update_staff" ON public.student_follow_ups;
CREATE POLICY "inst_sfu_update_staff"
  ON public.student_follow_ups
  FOR UPDATE
  TO authenticated
  USING (public.app_rls_is_active_staff_in_org(organization_id))
  WITH CHECK (public.app_rls_is_active_staff_in_org(organization_id));
