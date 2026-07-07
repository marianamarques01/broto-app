-- REDA-02: Corpus RAG global da Cartilha INEP — separado de material_embeddings.
-- Referência: docs/redacao-arquitetura-motor.md §3–§4.

CREATE TABLE IF NOT EXISTS public.enem_reference_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  source_url  text,
  version     text NOT NULL DEFAULT '1.0',
  indexed_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.enem_reference_documents IS
  'Documentos normativos ENEM indexados para RAG (ex.: Cartilha do Participante). Escrita via service_role.';

CREATE TABLE IF NOT EXISTS public.enem_reference_embeddings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid NOT NULL REFERENCES public.enem_reference_documents(id) ON DELETE CASCADE,
  chunk_index  int NOT NULL,
  chunk_text   text NOT NULL,
  chunk_tokens int,
  embedding    extensions.vector(1536),
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_enem_reference_embeddings_vector
  ON public.enem_reference_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_enem_reference_embeddings_document
  ON public.enem_reference_embeddings (document_id);

CREATE INDEX IF NOT EXISTS idx_enem_reference_embeddings_metadata_section
  ON public.enem_reference_embeddings ((metadata->>'section'));

CREATE INDEX IF NOT EXISTS idx_enem_reference_embeddings_metadata_competencia
  ON public.enem_reference_embeddings ((metadata->>'competencia'));

COMMENT ON TABLE public.enem_reference_embeddings IS
  'Chunks da Cartilha INEP com embeddings OpenAI (text-embedding-3-small). metadata.section e metadata.competencia filtram retrieval.';

ALTER TABLE public.enem_reference_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enem_reference_embeddings ENABLE ROW LEVEL SECURITY;

-- Fail-closed: sem policies para clientes; acesso via service_role nas edge functions.

CREATE OR REPLACE FUNCTION public.match_enem_reference_chunks(
  query_embedding extensions.vector(1536),
  match_competence text DEFAULT NULL,
  match_section text DEFAULT NULL,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  similarity float,
  metadata jsonb,
  document_id uuid
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    ere.id,
    ere.chunk_text,
    1 - (ere.embedding <=> query_embedding) AS similarity,
    ere.metadata,
    ere.document_id
  FROM public.enem_reference_embeddings ere
  WHERE ere.embedding IS NOT NULL
    AND (match_competence IS NULL OR ere.metadata->>'competencia' = match_competence)
    AND (match_section IS NULL OR ere.metadata->>'section' = match_section)
    AND 1 - (ere.embedding <=> query_embedding) > similarity_threshold
  ORDER BY ere.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE EXECUTE ON FUNCTION public.match_enem_reference_chunks(extensions.vector, text, text, int, float) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_enem_reference_chunks(extensions.vector, text, text, int, float) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_enem_reference_chunks(extensions.vector, text, text, int, float) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.match_enem_reference_chunks(extensions.vector, text, text, int, float) TO service_role;
