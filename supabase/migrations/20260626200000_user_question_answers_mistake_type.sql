-- Classificação de erro por tempo_resposta (stuck / guessed / normal)
ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS mistake_type TEXT
    CHECK (mistake_type IS NULL OR mistake_type IN ('stuck', 'guessed', 'normal'));

-- Backfill histórico (tempo_resposta em segundos; thresholds = 45s / 8s)
UPDATE public.user_question_answers
SET mistake_type = CASE
  WHEN acertou = true THEN NULL
  WHEN tempo_resposta IS NULL OR tempo_resposta <= 0 THEN 'normal'
  WHEN tempo_resposta * 1000 > 45000 THEN 'stuck'
  WHEN tempo_resposta * 1000 < 8000 THEN 'guessed'
  ELSE 'normal'
END
WHERE mistake_type IS NULL;
