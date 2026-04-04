-- ============================================================
-- Migration: streak e last_study_date em users
-- streak: dias consecutivos de estudo
-- last_study_date: data do último dia em que o usuário respondeu pelo menos 1 questão
-- Atualizado pela Edge Function answer-question a cada resposta
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS streak          INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_study_date DATE;
