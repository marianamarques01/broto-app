-- flashcard_reviews: estado FSRS por (user_id, card_id)
-- card_id = '<topic_key>-<índice_do_card_no_deck>'
-- ex: 'matematica-funcoes-2', 'linguagens-interpretacao-0'

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  card_id text NOT NULL,
  topic_key text NOT NULL,
  area_key text NOT NULL,

  -- Estado interno do algoritmo FSRS
  due timestamptz NOT NULL DEFAULT now(),
  stability float NOT NULL DEFAULT 0,
  difficulty float NOT NULL DEFAULT 0.3,
  elapsed_days int NOT NULL DEFAULT 0,
  scheduled_days int NOT NULL DEFAULT 0,
  reps int NOT NULL DEFAULT 0,
  lapses int NOT NULL DEFAULT 0,
  state int NOT NULL DEFAULT 0,
  -- State enum: 0=New, 1=Learning, 2=Review, 3=Relearning

  last_review timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, card_id)
);

-- Index principal: buscar cards do usuário com due <= now()
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_due
  ON public.flashcard_reviews(user_id, due)
  WHERE state > 0;

-- Index para filtrar por tópico (drill-down)
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_topic
  ON public.flashcard_reviews(user_id, topic_key);

COMMENT ON TABLE public.flashcard_reviews IS
  'Estado FSRS por (user, card). due = próxima revisão recomendada pelo algoritmo.';
COMMENT ON COLUMN public.flashcard_reviews.card_id IS
  'Formato: <topic_key>-<índice>. Ex: matematica-funcoes-2';
COMMENT ON COLUMN public.flashcard_reviews.state IS
  '0=New (nunca visto), 1=Learning, 2=Review, 3=Relearning';
