-- Diagnóstico RAG: por que material_embeddings está vazio?
-- Rodar no SQL Editor do Supabase (substituir :material_id se quiser um material específico).

-- 1) Turma gate ENEM 2026
SELECT id, name, rag_enabled, notebook_status
FROM public.classes
WHERE id = 'b0c00000-0000-4000-8000-000000000001';

-- 2) Materiais recentes da turma + status de indexação
SELECT id, title, type, index_status, left(source_url, 80) AS source_preview, created_at
FROM public.materials
WHERE class_id = 'b0c00000-0000-4000-8000-000000000001'
ORDER BY created_at DESC
LIMIT 10;

-- 3) Contagem de embeddings por material (substituir UUID)
-- SELECT count(*) FROM public.material_embeddings WHERE material_id = '<material_id>';

-- 4) Resumo por turma
SELECT m.id AS material_id,
       m.title,
       m.index_status,
       c.rag_enabled,
       (SELECT count(*) FROM public.material_embeddings me WHERE me.material_id = m.id) AS chunk_count
FROM public.materials m
JOIN public.classes c ON c.id = m.class_id
WHERE m.class_id = 'b0c00000-0000-4000-8000-000000000001'
ORDER BY m.created_at DESC;

-- Interpretação rápida:
-- rag_enabled = false  → material-index usa NotebookLM (zero rows em material_embeddings)
-- index_status = failed → ver logs da edge function material-index
-- index_status = indexed + chunk_count = 0 + rag_enabled = true → redeploy material-index ou reindexar
