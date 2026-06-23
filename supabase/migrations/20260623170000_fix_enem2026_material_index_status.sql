-- Corrige status quando embeddings RAG já existem (indexação parcial / retry).

UPDATE public.materials m
SET index_status = 'indexed'
WHERE m.class_id = 'b0c00000-0000-4000-8000-000000000001'
  AND m.title = 'Livro_MAT_Matematica_V1'
  AND EXISTS (
    SELECT 1 FROM public.material_embeddings me WHERE me.material_id = m.id
  );
