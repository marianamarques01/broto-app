-- flashcard_reviews: RLS fail-closed
-- Cliente (authenticated): SELECT apenas nas próprias linhas (getDueFlashcards).
-- Escrita: edge function flashcard-review via service_role (bypass RLS).

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flashcard_reviews_select_own" ON public.flashcard_reviews;
CREATE POLICY "flashcard_reviews_select_own"
  ON public.flashcard_reviews
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON POLICY "flashcard_reviews_select_own" ON public.flashcard_reviews IS
  'Aluno lê apenas seu estado FSRS. INSERT/UPDATE/DELETE só via service_role na edge flashcard-review.';
