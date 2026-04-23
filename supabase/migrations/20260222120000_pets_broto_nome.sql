-- Nome de exibição do Broto (mascote), por usuário
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS nome text;

UPDATE public.pets
SET nome = 'Broto'
WHERE nome IS NULL OR btrim(nome) = '';

COMMENT ON COLUMN public.pets.nome IS 'Nome de exibição do Broto (mascote)';
