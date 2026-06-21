-- P8 Opção A: versionar colunas que já existem em produção (drift detectado via gen types).
--
-- Decisão: documentar e alinhar schema local/remoto com IF NOT EXISTS — sem DROP neste passe.
-- Edge functions usam apenas: user_id, question_id, acertou, answer_area_key, session_id,
-- created_at, tempo_resposta. Não escrever nas colunas legado abaixo.
--
-- | Coluna        | Status     | Canônico em código      |
-- |---------------|------------|-------------------------|
-- | answer_area_key | versionada | área ENEM do cliente  |
-- | acertou       | versionada | acerto da tentativa     |
-- | area_key      | legado     | usar answer_area_key    |
-- | is_correct    | legado     | usar acertou            |
-- | answer        | legado     | não usado               |
-- | topico_value  | legado     | question_topic_mapping  |

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS area_key TEXT;

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS answer TEXT;

ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS topico_value TEXT;

COMMENT ON COLUMN public.user_question_answers.area_key IS
  'Legado prod (P8). Preferir answer_area_key — não usar em edge functions novas.';

COMMENT ON COLUMN public.user_question_answers.is_correct IS
  'Legado prod (P8). Preferir acertou — não usar em edge functions novas.';

COMMENT ON COLUMN public.user_question_answers.answer IS
  'Legado prod (P8). Resposta textual histórica — não usado pelo runtime atual.';

COMMENT ON COLUMN public.user_question_answers.topico_value IS
  'Legado prod (P8). Preferir question_topic_mapping — não usar em edge functions novas.';
