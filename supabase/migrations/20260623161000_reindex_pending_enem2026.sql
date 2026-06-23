-- Reindexação RAG: volta materiais da turma ENEM 2026 para pending (disparar material-index no admin).

UPDATE public.materials
SET index_status = 'pending'
WHERE class_id = 'b0c00000-0000-4000-8000-000000000001';
