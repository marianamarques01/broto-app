-- Habilita RAG na turma demo institucional (3º A Demo / DEMO3A)
UPDATE public.classes
SET rag_enabled = true
WHERE id = 'b0e00000-0000-4000-8000-000000000211';
