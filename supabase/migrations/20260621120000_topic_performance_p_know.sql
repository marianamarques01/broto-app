-- BKT student model: P(Know) por tópico (Bayesian Knowledge Tracing).
-- Prior 0.3 = cold start alinhado a BKT_DEFAULT_P_KNOW em packages/shared.

ALTER TABLE public.topic_performance
  ADD COLUMN IF NOT EXISTS p_know DOUBLE PRECISION NOT NULL DEFAULT 0.3;

COMMENT ON COLUMN public.topic_performance.p_know IS
  'P(Know) BKT (0–1). Atualizado em answer-question via updatePKnow.';

-- Índice composto desnecessário: consultas filtram por user_id (idx existente).
