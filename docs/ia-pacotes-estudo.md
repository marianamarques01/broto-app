# Broto — Módulo de Pacotes de Estudo com IA

**Documento técnico para relatório de investidores**  
**Versão:** 1.0 · **Data:** junho/2026  
**Status:** módulo integrado à plataforma em produção (web aluno + backend Supabase)

---

## 1. Resumo executivo

O Broto implementa **pacotes de estudo personalizados por IA** na Área de Estudo: para cada tópico ENEM, o sistema gera automaticamente **resumo didático**, **flashcards** e **questões de prática originais**, ancorados nos **materiais da instituição** (apostilas, PDFs, links) e calibrados ao **desempenho individual** do aluno.

Diferente de plataformas que apenas empilham um chatbot genérico, o Broto combina:

1. **RAG proprietário** (Recuperação Aumentada por Geração) sobre o conteúdo da turma  
2. **Modelo adaptativo do aluno** (Bayesian Knowledge Tracing — BKT) sem dependência de LLM  
3. **Cache inteligente** e **fallback em camadas** para operação confiável em produção  

O módulo complementa — sem substituir — o **banco de questões ENEM oficial** (corpus estático versionado) e o **chat Broto** (tutor conversacional). Juntos, formam a stack de personalização do produto.

---

## 2. Problema e proposta de valor

### Problema

Instituições de preparação produzem grande volume de material (PDFs, listas, aulas), mas o aluno:

- Não sabe **por onde começar** em cada tópico  
- Estuda de forma **passiva** (só leitura ou só questões)  
- Não recebe conteúdo **adaptado ao seu nível** nem à **identidade pedagógica** do cursinho  

### Solução Broto

Ao selecionar um tópico na Área de Estudo, o aluno recebe um **pacote coeso em três etapas**:

| Etapa | Conteúdo | Objetivo pedagógico |
|-------|----------|---------------------|
| **Resumo** | Texto markdown 300–500 palavras + pontos-chave | Compreensão conceptual |
| **Flashcards** | 5–8 cartões com dificuldade balanceada | Memorização ativa (FSRS) |
| **Questões** | 3 itens originais estilo ENEM com explicação | Aplicação e feedback |

A geração utiliza **trechos recuperados dos materiais da turma** e o **histórico de acertos/erros** do aluno naquele tópico — não conteúdo genérico da internet.

---

## 3. Arquitetura do módulo

### 3.1 Visão em camadas

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/web — Área de Estudo                                      │
│  useStudyPackage → StudyAreaJourneyView                         │
│  (Resumo → Flashcards → Questões → [Mapa mental estático])      │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /api/study-package
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: study-package (Deno / Supabase)                 │
│  Auth → Cache → RAG → LLM → Parse → Persist                   │
└─────┬───────────────────┬───────────────────┬───────────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌───────────┐    ┌────────────────┐    ┌─────────────────────┐
│ PostgreSQL│    │ OpenAI API     │    │ material_embeddings │
│ study_    │    │ gpt-4o-mini    │    │ (pgvector)          │
│ packages  │    │ + embeddings   │    │ RPC match_material_ │
│ topic_    │    │                │    │ chunks              │
│ performance│   └────────────────┘    └─────────────────────┘
└───────────┘
```

### 3.2 Componentes

| Componente | Responsabilidade | Tecnologia |
|------------|------------------|------------|
| **Web — `useStudyPackage`** | Orquestra fetch, loading, erro e fallback offline | React 18, `@broto/shared` |
| **Edge — `study-package`** | Authz, cache, RAG, geração LLM, persistência | Deno, Supabase Functions |
| **Shared — parser/ tipos** | Contrato JSON, validação, fallback estático | TypeScript strict, Vitest |
| **RAG — `semantic-search-core`** | Recuperação de trechos relevantes por turma | OpenAI embeddings + pgvector |
| **Modelo aluno — BKT** | `p_know` por tópico para calibrar complexidade | `@broto/shared/ai/student-model` |
| **FSRS — `flashcard-review`** | Agendamento de revisões dos cards gerados | ts-fsrs 5.x |
| **Storage — `study_packages`** | Cache por usuário + turma + tópico | PostgreSQL JSONB + RLS |

### 3.3 Integração com IA existente

O módulo **reutiliza a infraestrutura RAG** já operacional no chat Broto (`broto-chat`, `material-index`, `semantic-search`), garantindo:

- Mesma base de embeddings (`text-embedding-3-small`, 1536 dimensões)  
- Mesmo isolamento multi-tenant (`class_id`, `organization_id`)  
- Mesma flag `classes.rag_enabled` para opt-in por turma  
- Mesmos secrets server-side (`OPENAI_API_KEY` — nunca exposta ao client)  

Isso reduz custo de manutenção e acelera time-to-market em relação a um pipeline paralelo.

---

## 4. Fluxo de geração (detalhado)

### 4.1 Request

```http
POST /api/study-package
Authorization: Bearer <JWT Supabase>

{
  "area_key": "ciencias-natureza",
  "topico_value": "genetica",
  "class_id": "<uuid opcional — default: current_class_id>"
}
```

### 4.2 Pipeline server-side

1. **Autenticação** — `requireUser()` via JWT Supabase  
2. **Autorização** — matrícula ativa na turma; `requireClassAccess(..., 'student')`  
3. **Cache** — `SELECT` em `study_packages` WHERE `(user_id, class_id, topico_value)` AND `expires_at > now()` AND `status = 'ready'`  
4. **Contexto pedagógico** — leitura de `topic_performance` (p_know, accuracy, total_answered) + top tópicos fracos/fortes da área  
5. **Contexto RAG** — `searchMaterialChunks(query, class_id)` com threshold adaptativo (0.5 primário, 0.32 fallback)  
6. **Prompt estruturado** — instruções para JSON exclusivo; fonte = trechos RAG; complexidade ∝ p_know  
7. **Geração LLM** — `gpt-4o-mini`, temperature 0.3, max ~2k tokens  
8. **Parse + validação** — schema Zod/TypeScript; **1 retry** se JSON inválido  
9. **Persistência** — UPSERT em `study_packages`; `source: 'rag'`  
10. **Resposta** — pacote completo + flag `cached: true|false`  

### 4.3 Resposta

```json
{
  "package_id": "uuid",
  "status": "ready",
  "cached": false,
  "source": "rag",
  "summary": {
    "title": "Genética: dos genes à hereditariedade",
    "content": "## Conceitos fundamentais\n\n...",
    "key_points": ["DNA e cromossomos", "Leis de Mendel", "..."]
  },
  "flashcards": [
    { "front": "...", "back": "...", "difficulty": "medium" }
  ],
  "practice_questions": [
    {
      "question": "...",
      "alternatives": [
        { "letter": "A", "text": "...", "isCorrect": false }
      ],
      "explanation": "..."
    }
  ],
  "performance": { "accuracy": 41.7, "totalAnswered": 12, "p_know": 0.38 }
}
```

---

## 5. Modelo de dados

### 5.1 Tabela `study_packages`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `class_id` | UUID | FK → classes |
| `organization_id` | UUID | FK → organizations (denormalizado para RLS) |
| `area_key` | text | Área ENEM canônica |
| `topico_value` | text | Slug do tópico |
| `summary` | jsonb | `{ title, content, key_points[] }` |
| `flashcards` | jsonb | `StudyFlashcard[]` |
| `practice_questions` | jsonb | `PracticeQuestion[]` |
| `performance_snapshot` | jsonb | Snapshot no momento da geração |
| `prompt_used` | text | Auditoria / debug (opcional, truncado) |
| `source` | text | `rag` \| `static_fallback` |
| `status` | text | `generating` \| `ready` \| `failed` |
| `expires_at` | timestamptz | Default: now() + 7 dias |
| `created_at` | timestamptz | — |

**Constraint:** `UNIQUE (user_id, class_id, topico_value)` — um pacote ativo por combinação.

**RLS:** aluno acessa apenas `user_id = auth.uid()`; escrita via service_role nas edge functions após authz.

### 5.2 Invalidação de cache

O pacote é regenerado quando:

- `expires_at` expirou (padrão: 7 dias)  
- `topic_performance.p_know` variou mais de **10 pontos percentuais** desde o snapshot  
- Professor reindexou materiais da turma (evento futuro — webhook/manual)  

---

## 6. Personalização: duas inteligências, um produto

### 6.1 RAG — conteúdo institucional

A IA **só pode citar fatos presentes nos trechos recuperados** dos materiais indexados (`material_embeddings`). O system prompt proíbe alucinação e fontes externas — alinhado ao posicionamento B2B2C (“construído sobre **seus** conteúdos”).

Indexação (já existente, reutilizada):

```
PDF / URL / YouTube → extract → chunk → embed → pgvector
```

### 6.2 BKT — calibragem por aluno

Parâmetros default (Corbett & Anderson):

| Parâmetro | Valor | Efeito |
|-----------|-------|--------|
| Prior p_know | 0.30 | Cold start |
| pLearn | 0.10 | Aprendizado por tentativa |
| pGuess | 0.20 | Acerto por chute |
| pSlip | 0.10 | Erro por descuido |

O prompt de geração recebe `p_know` e `accuracy_pct` para ajustar:

- Profundidade do resumo  
- Dificuldade dos flashcards  
- Complexidade das questões de prática  

Atualização contínua via `answer-question` a cada resposta registrada.

### 6.3 FSRS — retenção dos flashcards

O **conteúdo** dos cards vem do pacote IA; o **agendamento** de revisão usa FSRS (`flashcard-review`), persistido em `flashcard_reviews`. Separação clara: LLM gera uma vez; algoritmo determinístico otimiza retenção ao longo do tempo.

---

## 7. Estratégia de fallback (confiabilidade operacional)

O Broto **nunca deixa o aluno sem conteúdo**. Cadeia de fallback:

| Prioridade | Fonte | Quando |
|------------|-------|--------|
| 1 | Cache DB (`study_packages`) | Pacote válido e não expirado |
| 2 | Geração IA (RAG + LLM) | Materiais indexados + OpenAI disponível |
| 3 | Pacote estático curado | ~20 tópicos com conteúdo editorial no repositório |
| 4 | Template genérico | Tópico sem curadoria; UX degradada mas funcional |

Na UI, estados distintos:

- **“Gerando seu pacote personalizado…”** — loading com timeout amigável  
- **“Personalizado com materiais da sua turma”** — badge quando `source: rag`  
- **“Conteúdo padrão”** — quando fallback estático  
- **Botão “Tentar novamente”** — após falha transitória  

Esta arquitetura é crítica para **SLA percebido** em ambientes com latência de LLM ou turmas ainda sem materiais uploadados.

---

## 8. Experiência do aluno (jornada)

```
Área de Estudo → Seleciona tópico
       │
       ▼
  [Loading IA ~3–8s ou cache instantâneo]
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Resumo (markdown renderizado)     │
│ 2. Flashcards (flip + FSRS)          │
│ 3. Questões de prática (3 itens IA)  │
│    OU questões reais ENEM se vier    │
│    do banco adaptativo (prioridade)  │
│ 4. Mapa mental — conteúdo estático │
│    (fora do escopo de geração IA)    │
└──────────────────────────────────────┘
       │
       ▼
  Resposta → answer-question → BKT → XP → streak → missões
```

**Nota:** quando o aluno entra pela trilha do **banco adaptativo** (`guidedBankRows`), a etapa “Questões” prioriza **questões oficiais ENEM** do corpus estático — a IA complementa, não substitui o acervo probatório.

---

## 9. Segurança e multi-tenant

| Controle | Implementação |
|----------|---------------|
| Autenticação | Supabase Auth JWT |
| Autorização | `requireUser`, `requireClassAccess`, enrollment ativo |
| Isolamento de dados | RLS + filtros `class_id` / `organization_id` |
| Secrets | `OPENAI_API_KEY` apenas server-side |
| CORS | Origens explícitas em produção (`ALLOWED_ORIGINS`) |
| Input | Validação UUID, limites de payload |
| Conteúdo HTML | DOMPurify no client (questões ENEM oficiais) |
| Auditoria | `prompt_used`, `source`, `chat_logs` (módulo chat) |

Princípio **fail-closed**: dúvida de permissão → negar acesso.

---

## 10. Custos e escalabilidade

### 10.1 Estimativa por geração (RAG)

| Operação | Custo típico |
|----------|--------------|
| Embedding da query | ~$0.00002 |
| Recuperação pgvector | Infra Supabase (marginal) |
| gpt-4o-mini (~1.5k tokens out) | ~$0.001–0.003 |
| **Total por pacote novo** | **< $0.01** |

Com cache de 7 dias, aluno que revisita o mesmo tópico **não gera novo custo LLM**.

### 10.2 Escalabilidade

- Edge Functions **stateless** — escala horizontal automática (Supabase)  
- Embeddings pré-computados na indexação — geração só embedda a query  
- Cache por `(user, class, topico)` limita chamadas repetidas  
- Corpus ENEM estático em CDN/Storage — zero custo LLM para banco oficial  

---

## 11. Diferencial competitivo (moat técnico)

1. **Conteúdo da instituição como fonte de verdade** — RAG sobre materiais do parceiro, não Wikipedia  
2. **Dupla camada de personalização** — BKT (barato, testável) + LLM (rico, contextual)  
3. **Pacote pedagógico fechado** — resumo → fixação → aplicação, não chat solto  
4. **Multi-tenant nativo** — uma plataforma, N organizações, isolamento RLS  
5. **Fallback editorial** — 20+ tópicos curados + templates garantem UX offline  
6. **Feedback loop** — cada resposta alimenta BKT → próximo pacote mais calibrado  

---

## 12. Stack tecnológica (referência)

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Frontend | React 18, Vite, TypeScript strict | Produto web em produção (Vercel) |
| Backend | Supabase Edge Functions (Deno) | Serverless, co-localizado com DB |
| Banco | PostgreSQL + pgvector | Relacional + busca semântica |
| Embeddings | OpenAI text-embedding-3-small | Custo/qualidade |
| Geração | OpenAI gpt-4o-mini | Latência e custo para JSON estruturado |
| Lógica compartilhada | `@broto/shared` + Vitest | Testes, reuso web/edge |
| Repetição espaçada | FSRS (ts-fsrs) | Evidência científica |
| Modelo aluno | BKT puro TypeScript | Zero custo inferência, explicável |
| CI/CD | GitHub Actions | lint → typecheck → test → build |
| Observabilidade | Sentry (web) | Erros em produção |

---

## 13. Métricas de produto (KPIs técnicos sugeridos)

| Métrica | Descrição |
|---------|-----------|
| **Taxa cache hit** | % requests servidos sem LLM |
| **Latência p95 geração** | Tempo edge → pacote ready |
| **Taxa parse success** | JSON válido na 1ª ou 2ª tentativa |
| **Taxa fallback estático** | Turmas sem materiais ou falha IA |
| **Δ p_know pós-sessão** | Eficácia pedagógica por tópico |
| **Completude de jornada** | % alunos que concluem resumo+cards+questões |
| **Custo LLM / MAU** | Unit economics por aluno ativo |

---

## 14. Roadmap — capacidades complementares (fora do escopo imediato)

Itens **planejados** para fases subsequentes, documentados para visão de produto completa:

### 14.1 Mapa mental gerado por IA

- **Status:** etapa “Revisar” usa conteúdo estático hoje  
- **Próximo passo:** estender schema JSON e prompt para incluir `mind_map` hierárquico (2–3 níveis)  
- **Valor:** fechamento visual do ciclo de aprendizagem  

### 14.2 White-label / theming por organização

- **Status:** landing comercial demonstra marca fictícia; app usa identidade Broto  
- **Próximo passo:** `organizations.brand_config` (logo, cores, domínio custom) + CSS variables runtime  
- **Valor:** receita B2B, retenção de parceiros, percepção “nossa plataforma”  

### 14.3 Admin UI — visibilidade de pacotes gerados

- **Status:** admin gerencia turmas e materiais; não expõe pacotes IA por aluno  
- **Próximo passo:** painel em `apps/admin` — amostra de pacotes, taxa de fallback, qualidade (feedback aluno)  
- **Valor:** coordenadores validam alinhamento pedagógico; due diligence institucional  

### 14.4 Path NotebookLM para geração

- **Status:** RAG OpenAI é o caminho preferencial (`rag_enabled=true`)  
- **Próximo passo:** turmas legado (`rag_enabled=false`) gerarem pacotes via FastAPI `/notebook/chat`  
- **Valor:** compatibilidade retroativa; transição gradual  

### 14.5 Sessões server-side (`study_sessions`)

- **Status:** progresso da jornada em localStorage  
- **Próximo passo:** persistir conclusão por etapa, XP de sessão, histórico “estudou Genética 3× esta semana”  
- **Valor:** analytics B2B, gamificação cross-device  

### 14.6 Regeneração proativa (background refresh)

- **Status:** regeneração on-demand ao abrir tópico  
- **Próximo passo:** prefetch quando pacote próximo de expirar + delta p_know significativo  
- **Valor:** UX instantânea sem stale content  

### 14.7 Feedback loop nos flashcards

- **Status:** FSRS agenda revisão; ratings não retroalimentam prompt  
- **Próximo passo:** `flashcard_ratings[]` no pacote seguinte ajusta dificuldade  
- **Valor:** personalização fina sem novo fine-tuning  

### 14.8 Geração em lote para coordenadores

- **Status:** geração sob demanda por aluno  
- **Próximo passo:** professor dispara “gerar pacotes para turma” em tópico X  
- **Valor:** onboarding de turma, campanhas pedagógicas  

---

## 15. Posicionamento para investidores

### O que está operacional hoje (plataforma base)

- Web aluno em produção (`www.brotoenem.com.br`)  
- 26 edge functions deployadas (auth, questões, chat, RAG, rotina, simulados)  
- Multi-tenant com RLS (26+ migrations)  
- Chat IA contextual (RAG + NotebookLM)  
- Modelo adaptativo BKT + banco de questões ENEM oficial  
- CI verde: lint, typecheck, 50+ testes automatizados  

### O que este módulo adiciona

Transforma materiais estáticos do parceiro e dados de desempenho em **produto de estudo estruturado**, não apenas chat. Fecha o loop:

```
Instituição upload → indexação → pacote IA → prática → BKT → próximo pacote
```

### Riscos mitigados

| Risco | Mitigação |
|-------|-----------|
| Alucinação LLM | RAG restritivo + prompt fail-closed |
| Custo LLM | Cache 7d + BKT sem LLM para priorização |
| Turma sem material | Fallback editorial |
| Latência | Cache + loading UX |
| Dependência API não oficial (NotebookLM) | RAG próprio como path principal |

---

## 16. Referências no repositório

| Documento / módulo | Conteúdo |
|------------------|----------|
| `docs/broto-f4-area-de-estudo.md` | Spec original (inclui mapa mental — fase 2) |
| `docs/routine-generate.md` | Padrão de fallback em camadas (referência arquitetural) |
| `packages/shared/src/study-area-mock.ts` | Contrato `StudyPackage` + fallback estático |
| `packages/shared/src/ai/student-model/` | BKT + classificador de erros |
| `supabase/functions/broto-chat/` | RAG + orquestração LLM |
| `supabase/functions/material-index/` | Pipeline de indexação |
| `supabase/migrations/20260626120000_material_embeddings_rag.sql` | pgvector + RPC |
| `docs/multi-tenant/multi-tenant-ground-truth.md` | Isolamento por organização |
| `.planning/STATE.md` | Status de produção e gates de qualidade |

---

## 17. Glossário

| Termo | Definição |
|-------|-----------|
| **Pacote de estudo** | Conjunto resumo + flashcards + questões para um tópico ENEM |
| **RAG** | Retrieval-Augmented Generation — LLM + trechos recuperados do material |
| **BKT** | Bayesian Knowledge Tracing — estimativa P(Know) por tópico |
| **p_know** | Probabilidade (0–1) de domínio do tópico |
| **FSRS** | Free Spaced Repetition Scheduler — algoritmo de revisão |
| **Corpus ENEM** | Questões oficiais em JSON estático (Supabase Storage) |
| **Turma / class** | Unidade pedagógica dentro de uma organização (tenant) |

---

*Documento preparado para inclusão em relatório técnico e due diligence. Para detalhes de implementação linha a linha, consultar o código-fonte e as migrations correspondentes.*
