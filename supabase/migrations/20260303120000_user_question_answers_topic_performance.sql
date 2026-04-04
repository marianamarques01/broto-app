-- ============================================================
-- Migration: user_question_answers + topic_performance
-- Referenciam users.id (auth)
-- ============================================================

-- Respostas do usuário por questão
CREATE TABLE IF NOT EXISTS public.user_question_answers (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id     TEXT        NOT NULL,
    acertou         BOOLEAN     NOT NULL,
    tempo_resposta  INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bridge: 20260317 cria esta tabela só com (id, user_id, created_at). CREATE TABLE IF NOT EXISTS
-- não acrescenta colunas; sem isto os índices abaixo falham (ex.: question_id ausente).
ALTER TABLE public.user_question_answers ADD COLUMN IF NOT EXISTS question_id TEXT;
ALTER TABLE public.user_question_answers ADD COLUMN IF NOT EXISTS acertou BOOLEAN;
ALTER TABLE public.user_question_answers ADD COLUMN IF NOT EXISTS tempo_resposta INTEGER;

UPDATE public.user_question_answers
SET question_id = '__legacy__'
WHERE question_id IS NULL;

UPDATE public.user_question_answers
SET acertou = false
WHERE acertou IS NULL;

ALTER TABLE public.user_question_answers ALTER COLUMN question_id SET NOT NULL;
ALTER TABLE public.user_question_answers ALTER COLUMN acertou SET NOT NULL;
ALTER TABLE public.user_question_answers ALTER COLUMN acertou SET DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_question_answers_user_id ON public.user_question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_answers_question_id ON public.user_question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_answers_user_created ON public.user_question_answers(user_id, created_at);
-- Mapeamento questão → tópico (para topic_performance)
-- Populado por script a partir de public/data/question-topic-mapping.json
CREATE TABLE IF NOT EXISTS public.question_topic_mapping (
    question_id     TEXT NOT NULL,
    topico_value    TEXT NOT NULL,
    PRIMARY KEY (question_id, topico_value)
);
CREATE INDEX IF NOT EXISTS idx_question_topic_mapping_question ON public.question_topic_mapping(question_id);
-- Desempenho agregado por tópico (para dashboard e rotina)
CREATE TABLE IF NOT EXISTS public.topic_performance (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topico_value    TEXT        NOT NULL,
    total_answered INTEGER     NOT NULL DEFAULT 0,
    total_correct   INTEGER     NOT NULL DEFAULT 0,
    accuracy_pct    NUMERIC(5,2),
    last_practiced  TIMESTAMPTZ,
    mastery_level   TEXT,
    UNIQUE(user_id, topico_value)
);
CREATE INDEX IF NOT EXISTS idx_topic_performance_user_id ON public.topic_performance(user_id);
