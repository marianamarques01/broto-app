-- Progresso em andamento do simulado (índice atual + questões puladas) para retomar depois.

ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS progress jsonb;
