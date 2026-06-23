-- Histórico completo de chats Broto — ativo para RAG e analytics pedagógico.
-- Escrita via service_role nas edge functions; sem policies para clientes (fail-closed).

CREATE TABLE IF NOT EXISTS public.chat_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id         TEXT,
  session_id       UUID        NOT NULL,
  turn_index       INT         NOT NULL DEFAULT 0,
  question         TEXT        NOT NULL,
  answer           TEXT        NOT NULL,
  topic_key        TEXT,
  source           TEXT        NOT NULL DEFAULT 'notebooklm',
  response_time_ms INT,
  was_helpful      BOOLEAN,
  model_used       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_user
  ON public.chat_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_logs_class
  ON public.chat_logs (class_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_logs_session
  ON public.chat_logs (session_id);

COMMENT ON TABLE public.chat_logs IS
  'Histórico completo de chats. Ativo principal para RAG e analytics pedagógico.
   Nunca deletar — dados históricos têm valor crescente.';

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
