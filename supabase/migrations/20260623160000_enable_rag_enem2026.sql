-- Habilita RAG próprio na turma ENEM 2026 (opt-in; substitui NotebookLM para chat/indexação).

UPDATE public.classes
SET rag_enabled = true
WHERE id = 'b0c00000-0000-4000-8000-000000000001';
