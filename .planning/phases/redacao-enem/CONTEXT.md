# Contexto — Fase Redação ENEM

**Phase ID:** `redacao-enem`  
**Tipo:** feature (novo módulo transversal)  
**Status:** planejamento aprovado · execução não iniciada

## Documentos obrigatórios (ler antes de codar)

1. [`docs/redacao.md`](../../../docs/redacao.md) — produto e ciclo pedagógico
2. [`docs/redacao-contexto-dev.md`](../../../docs/redacao-contexto-dev.md) — mapeamento monorepo + modelo de dados
3. [`docs/redacao-arquitetura-motor.md`](../../../docs/redacao-arquitetura-motor.md) — arquitetura RAG + motor de correção
4. [`docs/multi-tenant/multi-tenant-permissions-matrix.md`](../../../docs/multi-tenant/multi-tenant-permissions-matrix.md)

## Código de referência

- RAG: `supabase/functions/_shared/rag-context.ts`, `semantic-search-core.ts`, `openai-embeddings.ts`
- Chat LLM: `supabase/functions/_shared/openai-chat.ts`
- Edge template: `.cursor/rules/05-supabase-functions.mdc`
- Admin materiais (padrão CRUD): `apps/admin/src/hooks/useMaterials.ts`

## Decisões já tomadas

| # | Decisão | Escolha |
|---|---------|---------|
| D1 | Corpus normativo | Tabelas `enem_reference_*` separadas de `material_embeddings` |
| D2 | LLM calls | 6 sequenciais (zero-check + 5 competências) |
| D3 | Submit MVP | Sync (~45s timeout) |
| D4 | Temperatura | 0.1 + JSON mode |
| D5 | NotebookLM | Não usar para Cartilha INEP |

## O que NÃO construir no MVP

- OCR manuscrito (Fase 5)
- Vestibulares não-ENEM
- Peer review
- Redação modelo perfeita sem fricção pedagógica
