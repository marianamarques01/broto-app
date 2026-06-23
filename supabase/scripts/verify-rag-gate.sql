-- Gate RAG: verificar embeddings indexados e busca semântica.
-- Substituir :class_id por UUID de turma de teste com rag_enabled = true.

-- 1) Contagem de chunks por turma
SELECT count(*) AS chunk_count
FROM public.material_embeddings
WHERE class_id = :'class_id';

-- 2) Busca semântica (requer embedding real — usar via edge function semantic-search em staging)
-- Exemplo RPC direto (service_role), após gerar embedding de teste:
-- SELECT * FROM public.match_material_chunks(
--   query_embedding := '[...]'::extensions.vector(1536),
--   match_class_id := :'class_id'::uuid,
--   match_count := 5,
--   similarity_threshold := 0.5
-- );
