-- Área ENEM declarada pelo cliente (slug do app) para respostas sem linha em question_topic_mapping.
-- Usada em fetchStudyTodayByArea / pet-me para alinhar missões e UI ao fallback de topic_performance.

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS answer_area_key TEXT;
