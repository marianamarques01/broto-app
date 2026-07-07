# Contexto — Módulo de Redação ENEM (Broto)

Documento técnico para ancorar prompts de desenvolvimento. Consolida `docs/redacao.md`, mapeamento contra o monorepo (jul/2026), modelo de dados proposto e spec da área de repertórios.

---

## 1. Produto e tese

O Broto precisa de um módulo de **redação dissertativo-argumentativa ENEM** cujo valor não é "corrigir rápido", mas o ciclo pedagógico:

**escrever → feedback específico (nota por competência + marcações inline) → reescrever → ver evolução → alimentar rotina de estudo**

Redação não tem gabarito. A nota oficial vem de 2 corretores humanos (média aritmética), 5 competências × 0–200 pts (múltiplos de 40), total até 1.000. Fatores de nota zero: fuga ao tema, texto < 7 linhas, cópia integral dos motivadores, língua estrangeira, identificação do candidato, desrespeito à estrutura dissertativa.

**Fonte de verdade da correção:** Cartilha do Participante INEP 2025 (Matriz de Referência) — via RAG, NÃO conhecimento genérico da LLM.

**Competências:**

- **I** — norma culta
- **II** — compreensão do tema + repertório + estrutura dissertativa
- **III** — argumentação (seleção, relação, organização, interpretação)
- **IV** — coesão (mecanismos linguísticos da argumentação)
- **V** — proposta de intervenção (estrutura: agente, ação, meio, finalidade, detalhamento + direitos humanos) — avaliar **ESTRUTURA**, não posição política

Documento de produto: [`docs/redacao.md`](./redacao.md)

**Plano de execução (agente):**

- Arquitetura aprovada: [`docs/redacao-arquitetura-motor.md`](./redacao-arquitetura-motor.md)
- Phase GSD: [`.planning/phases/redacao-enem/PLAN.md`](../.planning/phases/redacao-enem/PLAN.md)

---

## 2. Estado atual do monorepo (jul/2026)

### O que JÁ existe e deve ser REAPROVEITADO

| Peça | Onde | Uso para redação |
|------|------|------------------|
| RAG (embeddings + busca semântica) | `supabase/migrations/20260626120000_material_embeddings_rag.sql`, `supabase/functions/_shared/semantic-search-core.ts`, `openai-embeddings.ts` | Padrão de chunking + pgvector + RPC — mas corpus DIFERENTE (ver §4) |
| Formatação de contexto RAG | `supabase/functions/_shared/rag-context.ts` (`formatRagContext`, `buildRagSystemPrompt`) | Adaptar prompts para correção (não chat) |
| OpenAI Chat | `supabase/functions/_shared/openai-chat.ts` (`createChatCompletion`, temp 0.3 default) | Motor de correção — usar temp baixa (0–0.2), `response_format: json` |
| Authz multi-tenant | `supabase/functions/_shared/authz.ts` (`requireUser`, `requireClassAccess`, `requireMembership`) | Toda edge function nova |
| CORS | `supabase/functions/_shared/cors.ts` | Padrão obrigatório |
| API client web | `apps/web/src/lib/api-client.ts` + `@broto/shared` (`withExponentialBackoff`, `withJwtRefreshRetry`) | Chamadas às novas edges |
| Tipos edge functions | `packages/shared/src/types/edge-functions.ts` | Adicionar request/response de redação |
| Rotina inteligente | `routine-generate` edge + `packages/shared/src/routine/generate-routine.ts` + `useRoutinePlan` | Integrar competência fraca → recomendação |
| BKT / desempenho | `topic_performance` (via `answer-question`), `p_know` | Modelo análogo para competências de redação |
| Admin materiais | `apps/admin` (`MaterialUpload`, `MaterialsList`, `useMaterials`) | Padrão para repertórios do professor |
| Perfil aluno | `users.meta_redacao`, `users.nivel_redacao` em `database.types.ts` | Já existem campos soltos — integrar no onboarding/rotina |

### O que NÃO existe ainda

- Nenhuma tabela `tema`, `redacao`, `correcao_redacao`
- Nenhuma edge function de redação
- Nenhuma rota `/redacao` no `apps/web/src/router.tsx`
- Redação **não** está em `EnemAreaKey` (`packages/shared/src/enem-area-key.ts` — só 4 áreas objetivas)
- Redação **não** está em `.planning/STATE.md` nem `PRODUCTION-ROADMAP.md`
- Corpus RAG da Cartilha INEP **não** indexado

### Padrões de referência no repo

- Edge function nova: ver template em `.cursor/rules/05-supabase-functions.mdc`
- Exemplo de CRUD + service_role: `practice-session-create/index.ts`
- Exemplo de RAG em produção: `broto-chat/index.ts` (dual path NotebookLM + pgvector)
- Reindexação RAG: `supabase/scripts/reindex-rag-class.ts`

---

## 3. Decisão de arquitetura RAG (CRÍTICA)

O RAG existente é **por turma** (`material_embeddings.class_id` → `match_material_chunks`). Serve para materiais do professor.

A correção de redação precisa de corpus **global e estático**: Cartilha INEP + Matriz de Referência. **Não misturar** com `material_embeddings`.

### Proposta: corpus separado `enem_reference_embeddings`

```
enem_reference_documents  (id, slug, title, source_url, version, indexed_at)
enem_reference_embeddings (id, document_id, chunk_index, chunk_text, embedding vector(1536), metadata jsonb)
match_enem_reference_chunks(query_embedding, match_competence?, match_count, threshold)
```

- Indexar uma vez (script de deploy ou edge `enem-reference-index`)
- Metadata por chunk: `{ competencia: "I"|"II"|..., section: "matriz_referencia"|"fatores_zero"|"criterios_nota" }`
- Na correção: para cada competência, buscar top-K chunks filtrados por `competencia`
- Reusar `embedTexts` + `formatPgvector` de `_shared/openai-embeddings.ts`
- Reusar padrão de `formatRagContext` mas com prompt de **correção**, não chat

**Não duplicar** infra NotebookLM para isso — Cartilha é documento fixo, pgvector é suficiente.

---

## 4. Modelo de dados proposto (migrations)

### 4.1 Temas (`redacao_temas`)

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK nullable | null = tema global Broto; preenchido = tema da org |
| titulo | text | Situação-problema |
| textos_motivadores | jsonb | Array `{ ordem, titulo?, conteudo }` — textos PRÓPRIOS, nunca cópia INEP |
| eixo_tematico | text | educacao, saude, meio_ambiente, tecnologia, trabalho, direitos_humanos, cultura |
| dificuldade | text | facil, medio, dificil |
| ano_referencia | int nullable | Ex.: 2023 se inspirado em prova real (só referência, sem reproduzir motivadores) |
| ativo | boolean | |
| created_by | uuid nullable | professor que criou (se org) |
| created_at | timestamptz | |

### 4.2 Redações (`redacoes`)

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users | |
| organization_id | uuid FK | via turma/org do aluno |
| class_id | uuid FK nullable | turma ativa no envio |
| tema_id | uuid FK → redacao_temas | |
| texto | text | Redação digitada |
| imagem_url | text nullable | Fase 5 (OCR) |
| modo | text | digitado \| foto \| cronometrado |
| linha_count | int | calculado no envio |
| tempo_segundos | int nullable | se cronometrado |
| status | text | rascunho \| enviada \| corrigindo \| corrigida \| erro |
| created_at | timestamptz | |

### 4.3 Correções (`redacao_correcoes`)

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| redacao_id | uuid FK UNIQUE | 1 correção por envio (v1) |
| nota_competencia_i..v | int | 0–200, múltiplos de 40 |
| nota_total | int | soma das 5 |
| justificativa_i..v | text | linguagem acessível |
| marcacoes_inline | jsonb | `[{ start_offset, end_offset, trecho, tipo_problema, comentario, competencia }]` |
| fatores_zero | jsonb | `{ detectado: bool, motivos: string[] }` |
| prompt_version | text | |
| modelo_usado | text | |
| rag_chunks_used | jsonb nullable | audit trail |
| created_at | timestamptz | |

### 4.4 Calibração humana (`redacao_revisoes_humanas`)

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| correcao_id | uuid FK | |
| revisor_id | uuid FK → users | staff Broto |
| nota_humana_i..v | int | preenchida ANTES de revelar nota IA |
| notas_ia_reveladas_em | timestamptz nullable | gate de viés |
| comentario | text nullable | |
| created_at | timestamptz | |

### 4.5 Evolução

View calculada (não tabela): série temporal de `nota_competencia_*` por `user_id` ordenada por `created_at`.

### 4.6 Repertórios (complemento do doc de produto)

**`redacao_repertorios`** — conteúdo pedagógico adicionado pelo professor:

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | escopo da org |
| class_id | uuid FK nullable | null = toda org; preenchido = turma específica |
| tipo | text | `dica` \| `repertorio` \| `modelo_estrutura` \| `conectivos` \| `proposta_intervencao` |
| titulo | text | |
| conteudo | text | markdown permitido |
| eixo_tematico | text nullable | filtro opcional |
| competencia_alvo | text nullable | I–V — para recomendação |
| tags | text[] | |
| ativo | boolean | |
| created_by | uuid FK | professor |
| created_at, updated_at | timestamptz | |

**Fluxo:**

- Professor cria/edita no **admin** (`apps/admin`, página nova ou aba em `ClassDetail`)
- Aluno consulta na **tela de escrita** (sidebar/painel lateral) e na **tela pós-correção** (sugestões por competência fraca)
- Rotação de temas deve considerar eixos pouco treinados (Competência II)

---

## 5. Edge functions novas (proposta)

| Function | Método | Responsabilidade |
|----------|--------|------------------|
| `redacao-tema-list` | GET/POST | Listar temas (global + org do aluno); recomendação por eixo |
| `redacao-submit` | POST | Validar (≥7 linhas, ≤30), persistir `redacoes`, disparar correção |
| `redacao-correct` | POST (interno ou sync) | Motor: fatores zero → 5 competências → JSON estruturado |
| `redacao-get` | GET | Redação + correção para tela de feedback |
| `redacao-history` | GET | Histórico do aluno + evolução por competência |
| `redacao-repertorio-list` | GET | Repertórios visíveis ao aluno (org/turma) |
| `redacao-repertorio-manage` | POST/PATCH/DELETE | CRUD professor (authz `teacher+`) |
| `redacao-revisao-humana` | POST | Calibração cega (nota IA oculta até submit) |
| `enem-reference-index` | POST | Indexar Cartilha (deploy/admin only) |

**Padrão de implementação:** `requireUser` → validar UUIDs → `requireClassAccess` se `class_id` → `createServiceRoleClientUnsafe` só após authz → JSON response.

**Correção — pipeline do prompt:**

1. Checar fatores de nota zero (passo dedicado, pode zerar/nota especial)
2. Para cada competência I–V em sequência (ou paralelo com merge):
   - RAG: `match_enem_reference_chunks` filtrado por competência
   - Injetar: tema + motivadores + texto do aluno + trechos da cartilha
   - Output JSON: `{ nota, justificativa, marcacoes: [...] }`
3. Agregar → persistir `redacao_correcoes`
4. Temperatura 0–0.2; testar variância (mesma redação N vezes)

---

## 6. Frontend (apps/web)

### Rotas propostas (`router.tsx`)

```
/redacao                    → lista de temas + histórico
/redacao/tema/:temaId       → editor (folha ENEM, contador de linhas 7–30, timer opcional)
/redacao/resultado/:redacaoId → feedback (notas, inline marks, reescrever)
/redacao/evolucao           → gráfico por competência
```

Considerar entrada no `MobileTabBar` ou card na `Home` (redação é módulo transversal, não sub-rota de `/study/:areaKey`).

### Telas

1. **Lista de temas** — eixo, dificuldade, "continuar rascunho", histórico recente
2. **Editor** — sem autocorreção agressiva; tema fixo visível; painel lateral de repertórios
3. **Feedback** — 5 competências com destaque da mais fraca; texto com highlights clicáveis; fatores zero em banner; CTAs "reescrever tema" / "praticar competência fraca"
4. **Evolução** — gráfico de linha por competência (últimas N redações)

### Admin (apps/admin)

- Aba "Redação" em `ClassDetail` ou página dedicada:
  - CRUD repertórios
  - (futuro) temas customizados da org
  - (futuro) visão agregada competências da turma

---

## 7. Integração com motor de rotina / BKT

**Novo sinal de desempenho:** competências de redação (não cabe em `EnemAreaKey` nem `topic_performance` hoje).

### Opção recomendada: tabela `redacao_competence_snapshots`

```
user_id, competencia (I–V), nota, redacao_id, created_at
```

**Gatilho de recomendação** (Fase 4):

- Se média da competência X < limiar (ex. 120) nas últimas 3 redações:

| Competência | Conteúdo sugerido |
|-------------|-------------------|
| I | Ortografia, concordância, regência (flashcards linguagens) |
| II | Repertório sociocultural, atualidades, temas |
| III | Tese, argumentos, contra-argumentos |
| IV | Conectivos, coesão referencial, progressão |
| V | Estrutura de proposta de intervenção, direitos humanos |

- Alimentar `routine-generate` com novo campo `redacao_weak_competences` no payload OU criar hook dedicado `useRedacaoRecommendations` que sugere temas/repertórios — **não duplicar** lógica BKT de `topic_performance`; redação é domínio paralelo que converge na rotina.

Usar `users.meta_redacao` e `users.nivel_redacao` no onboarding/rotina como meta do aluno.

---

## 8. Multi-tenant e RLS

Seguir [`docs/multi-tenant/multi-tenant-permissions-matrix.md`](./multi-tenant/multi-tenant-permissions-matrix.md):

| Recurso | Quem lê | Quem escreve |
|---------|---------|--------------|
| `redacao_temas` (global) | todos autenticados | só service_role / admin Broto |
| `redacao_temas` (org) | alunos da org | teacher+ da org |
| `redacoes` | próprio aluno + teacher+ da turma | próprio aluno |
| `redacao_correcoes` | mesmo que redação | service_role (edge) |
| `redacao_repertorios` | alunos da org/turma | teacher+ |
| `redacao_revisoes_humanas` | staff Broto | staff Broto |
| `enem_reference_*` | service_role only | deploy script |

Edge functions são a camada primária de authz; RLS fail-closed como backup.

---

## 9. Requisitos não-funcionais (gates de lançamento)

Antes de aluno real usar correção:

- [ ] RAG ancorado na Cartilha INEP (não LLM genérica)
- [ ] Consistência: mesma redação N vezes, variância documentada e aceitável
- [ ] Calibração humana com taxa de concordância IA vs. humano
- [ ] Fatores de nota zero testados
- [ ] Competência V avalia estrutura, não política
- [ ] Sem reprodução de redações nota 1000 do INEP
- [ ] Marcações inline validadas com aluno real
- [ ] Conteúdo sensível: sinalização interna (sem diagnosticar/alarmar aluno)
- [ ] Direitos autorais: motivadores próprios; temas históricos só como referência de eixo

---

## 10. Fases de desenvolvimento (ordem)

| Fase | Entregável | Prazo |
|------|------------|-------|
| **1** | Migrations + `redacao_temas` seed + editor + listagem temas + repertórios (CRUD admin + consulta aluno) | 1–2 sem |
| **2** | Indexar Cartilha INEP + `redacao-correct` + `redacao-submit` + tela feedback | 3–4 sem |
| **3** | Calibração humana (painel interno) | paralelo |
| **4** | Evolução + integração rotina | 2 sem |
| **5** | OCR manuscrito | adiável pós-MVP |
| **6** | Painel institucional (agregação turma) | 1–2 sem |

---

## 11. O que NÃO construir no MVP

- Vestibulares outros (FUVEST, UNICAMP)
- OCR/foto manuscrito (adiar)
- Peer review entre alunos
- "Redação modelo perfeita" sem fricção pedagógica
- Novo pipeline RAG duplicando `material_embeddings` para a Cartilha

---

## 12. Instrução para o agente (usar em todo prompt)

Antes de implementar:

1. Ler [`docs/redacao.md`](./redacao.md) (produto)
2. Ler [`docs/redacao-arquitetura-motor.md`](./redacao-arquitetura-motor.md) (arquitetura aprovada)
3. Seguir a wave/tarefa atual em [`.planning/phases/redacao-enem/PLAN.md`](../.planning/phases/redacao-enem/PLAN.md)
4. Ler `supabase/functions/_shared/rag-context.ts`, `semantic-search-core.ts`, `openai-chat.ts`, `authz.ts`
5. Ler [`docs/multi-tenant/multi-tenant-permissions-matrix.md`](./multi-tenant/multi-tenant-permissions-matrix.md)
6. Reaproveitar padrões de edge functions existentes — não duplicar infra RAG de turma para corpus INEP
7. Tipos novos em `packages/shared`; lógica pura com testes Vitest em `packages/shared`
8. Rodar antes de concluir: `npm run format:check && npm run lint && npm run typecheck && npm run test:shared && npm run build`
