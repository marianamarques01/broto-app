-- RAG próprio: pgvector + embeddings de materiais + feature flag por turma.
-- Coexistência com NotebookLM — rag_enabled opt-in por turma.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.material_embeddings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id      UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  chunk_index      INT NOT NULL,
  chunk_text       TEXT NOT NULL,
  chunk_tokens     INT,
  embedding        extensions.vector(1536),
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (material_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_material_embeddings_vector
  ON public.material_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_material_embeddings_class
  ON public.material_embeddings (class_id);

CREATE INDEX IF NOT EXISTS idx_material_embeddings_material
  ON public.material_embeddings (material_id);

COMMENT ON TABLE public.material_embeddings IS
  'Chunks de materiais com embeddings OpenAI (text-embedding-3-small). Escrita via edge function material-embed.';

ALTER TABLE public.material_embeddings ENABLE ROW LEVEL SECURITY;

-- Fail-closed: sem policies para clientes; acesso via service_role nas edge functions.

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS rag_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.classes.rag_enabled IS
  'Quando true, turma usa RAG próprio (pgvector) em vez de NotebookLM. Opt-in por turma.';

CREATE OR REPLACE FUNCTION public.match_material_chunks(
  query_embedding extensions.vector(1536),
  match_class_id UUID,
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  metadata JSONB,
  material_id UUID
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    me.id,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity,
    me.metadata,
    me.material_id
  FROM public.material_embeddings me
  WHERE me.class_id = match_class_id
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE EXECUTE ON FUNCTION public.match_material_chunks(extensions.vector, UUID, INT, FLOAT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_material_chunks(extensions.vector, UUID, INT, FLOAT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_material_chunks(extensions.vector, UUID, INT, FLOAT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.match_material_chunks(extensions.vector, UUID, INT, FLOAT) TO service_role;
