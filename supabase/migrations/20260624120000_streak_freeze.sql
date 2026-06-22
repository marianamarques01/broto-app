-- ============================================================
-- Streak freeze: proteção anti-churn quando o aluno perde 1 dia
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_freezes_earned INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.users.streak_freezes IS
  'Freezes disponíveis (0-3). Consumido auto quando streak quebraria.';
COMMENT ON COLUMN public.users.total_freezes_earned IS
  'Total histórico para analytics de retenção.';

CREATE TABLE IF NOT EXISTS public.streak_freeze_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  streak_at_time INTEGER NOT NULL,
  freeze_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streak_freeze_events_user_created
  ON public.streak_freeze_events (user_id, created_at DESC);

ALTER TABLE public.streak_freeze_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_freeze_events_select_own"
  ON public.streak_freeze_events
  FOR SELECT
  USING (auth.uid() = user_id);
