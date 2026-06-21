-- Eventos de qualidade de dados (ex.: p_know não atualizado por tópico indefinido).
-- Escrita via service_role nas edge functions; sem policies para clientes (fail-closed).

CREATE TABLE IF NOT EXISTS public.data_quality_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT        NOT NULL,
  question_id TEXT,
  user_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_quality_events_type_created
  ON public.data_quality_events (event_type, created_at DESC);

COMMENT ON TABLE public.data_quality_events IS
  'Auditoria de gaps de dados (ex.: answer-question sem tópico resolvível para BKT).';

ALTER TABLE public.data_quality_events ENABLE ROW LEVEL SECURITY;
