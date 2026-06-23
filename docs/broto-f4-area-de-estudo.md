# F4 — Area de Estudo (NotebookLM como professor particular)

## Visao geral

Transformar o Broto em uma experiencia de estudo guiada. O aluno escolhe **area + topico** e recebe um **pacote de estudo** gerado pela IA (NotebookLM), baseado nos materiais da turma e no desempenho individual.

**Jornada do aluno:**
```
Escolher area → Escolher topico → Receber pacote de estudo → Estudar → Praticar → Revisar
```

**Conteudos do pacote (na mesma jornada):**
1. Texto explicativo (resumo + aprofundamento)
2. Flashcards (pergunta/resposta com dificuldade)
3. Questoes de pratica (com feedback e explicacao)
4. Mapa mental / estrutura hierarquica de topicos

**Objetivo:** reduzir friccao para "o que estudar agora" e criar um ciclo estudar → praticar → revisar dentro do app.

---

## Diagnostico do estado atual

### O que ja funciona

| Componente | Status | Detalhes |
|---|---|---|
| Upload de materiais (admin) | OK | PDF, URL, YouTube, texto → Supabase Storage |
| Indexacao no NotebookLM | OK | Edge function `material-index` → Python service |
| Chat com IA (broto-chat) | OK | Pergunta/resposta simples, sem historico |
| Servico Python (FastAPI) | OK | `/notebook/create`, `/notebook/add-source`, `/notebook/chat`, `/routine/generate` |
| Tipos `GeneratedContent` | OK | `packages/shared/src/types/content.ts` — flashcards, mind_map, study_guide ja definidos |
| Questoes (JSON no Storage) | OK | Banco de questoes ENEM 2015-2023 organizado por area/ano/topico |
| Filtros de questoes | OK | Por area, ano, topico, idioma |
| Rotina semanal (cliente) | OK | Algoritmo deterministico baseado em areas fracas |

### O que NAO funciona (bloqueios criticos)

#### 1. Edge functions core do aluno NAO EXISTEM

O frontend (web e mobile) chama 4 endpoints que **nao tem implementacao** no Supabase:

| Endpoint | Chamado por | Impacto |
|---|---|---|
| `POST /api/answer/question` | `submitAnswer()` em web e mobile | Respostas NAO sao persistidas no banco |
| `GET /api/user/progress` | `useProgress()` em web e mobile | Progresso NAO e calculado do banco |
| `GET /api/user/me` | `useUser()` em web e mobile | Perfil depende de query direta (fragil) |
| `GET /api/pet/me` | `usePet()` em web e mobile | Pet depende de query direta (fragil) |

**Consequencia:** as tabelas `user_question_answers` e `topic_performance` estao **vazias**. A IA nao tem dados de desempenho para personalizar pacotes de estudo.

**Evidencia:** `supabase/functions/` contem apenas: `class-join/`, `broto-chat/`, `material-index/`.

#### 2. Chat com IA nao gera conteudo estruturado

O fluxo atual:
```
Frontend envia: { messages: [...] }
Edge function extrai: ultima mensagem do usuario
Python service chama: client.chat.ask(notebook_id, question)
Retorna: { message: "texto livre" }
```

Para a Area de Estudo, precisamos:
- Enviar **contexto** (area, topico, desempenho do aluno)
- Receber **JSON estruturado** (flashcards, mapa mental, guia)
- **Cachear** o conteudo gerado (nao regenerar a cada acesso)

#### 3. Mapeamento topico → area nao existe no banco

A tabela `topic_performance` tem `topico_value` (string) mas **nao tem `area`**. A associacao topico→area so existe nos JSONs estaticos do Storage (`topics/{area}.json`). Para a IA saber "o aluno e fraco em Genetica (Ciencias da Natureza)", precisamos dessa relacao no banco ou resolvida no endpoint.

#### 4. Historico de chat persistido (implementado)

Cada turno do `broto-chat` e gravado em `chat_logs` (migration `20260625120000_chat_logs.sql`) via `service_role`. O web restaura a conversa ativa ao recarregar (`useBrotoChat` + `localStorage` por turma) e lista sessoes na pagina `/broto` (sidebar + abas mobile). Endpoints: `broto-chat-sessions`, `broto-chat-session-get`.

### Incoerencias encontradas

| Incoerencia | Onde | Impacto |
|---|---|---|
| Tipos shared vs. banco desalinhados | `TopicPerformance` tem `topic_id` e `area`, tabela so tem `topico_value` | Queries de progresso por area nao funcionam direto |
| `current_class_id` como gargalo | `broto-chat` usa `current_class_id` do usuario | Aluno com multiplas turmas so acessa materiais da ultima |
| Performance salva em localStorage, nao no banco | `bumpPerformanceDay()`, `incrementDailyAreaAnswer()` | Dados perdidos ao limpar browser; banco vazio |
| `GeneratedContent` tipo tem `topic_id` | Topicos nao tem tabela propria, sao strings | FK impossivel, precisa de convencao |
| `timeSpentSec` enviado pelo frontend | `SubmitAnswerPayload` tem o campo | Banco provavelmente nao persiste (edge function nao existe) |

---

## Arquitetura proposta

### Novo fluxo: Area de Estudo

```
┌─────────────────────────────────────────────────────────┐
│ 1. SELECAO (Frontend)                                    │
│    Aluno escolhe: Area → Topico                          │
│    UI mostra: desempenho atual no topico (accuracy, qty) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. GERACAO (Edge Function: study-package)                │
│    Input: { area, topico, class_id }                     │
│    Busca: desempenho do aluno no topico                  │
│    Verifica: cache existente (< 7 dias, mesmo topico)    │
│    Se cache valido → retorna cache                       │
│    Se nao → monta prompt → chama NotebookLM              │
│    Parseia resposta JSON → salva em study_packages       │
│    Retorna: pacote completo                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CONSUMO (Frontend — jornada guiada)                   │
│                                                          │
│    [Resumo]  →  [Flashcards]  →  [Questoes]  →  [Mapa]  │
│       ↓              ↓               ↓             ↓     │
│    Ler texto    Virar cards    Responder +      Visao    │
│    explicativo  e classificar  feedback          geral   │
│                                                          │
│    Progresso da sessao: barra no topo                    │
│    Ao final: resumo da sessao + XP ganho                 │
└─────────────────────────────────────────────────────────┘
```

### Prompt para o NotebookLM

O prompt enviado ao serviço Python sera estruturado assim:

```
Voce e um tutor do ENEM. O aluno esta estudando o topico "{topico}" da area "{area}".

Dados do aluno:
- Acertou {accuracy}% de {total} questoes nesse topico
- Topicos fortes: {strongTopics}
- Topicos fracos: {weakTopics}
- Horas disponiveis: {horasDisponiveisPorDia}h/dia

Com base nos materiais da turma, gere um pacote de estudo em JSON:

{
  "summary": {
    "title": "string",
    "content": "string (markdown, 300-500 palavras)",
    "key_points": ["string", ...]
  },
  "flashcards": [
    { "front": "string", "back": "string", "difficulty": "easy|medium|hard" }
  ],
  "practice_questions": [
    {
      "question": "string",
      "alternatives": [
        { "letter": "A", "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string"
    }
  ],
  "mind_map": {
    "topic": "string",
    "root": { "id": "string", "label": "string", "children": [...] }
  }
}

Regras:
- 5 a 8 flashcards, equilibrando dificuldade
- 3 questoes de pratica no estilo ENEM
- Mapa mental com 2-3 niveis de profundidade
- Adapte a complexidade ao nivel do aluno ({accuracy}% de acerto)
- Use linguagem acessivel para ensino medio
- Responda APENAS com o JSON, sem texto adicional
```

---

## Plano de implementacao

### Fase 0 — Corrigir fundacao (pre-requisito)

> Sem essas edge functions, nao ha dados de desempenho para a IA personalizar.

#### 0.1 Edge function `answer-question`

**Arquivo:** `supabase/functions/answer-question/index.ts`

**Input:**
```json
{
  "questionId": "2023-45",
  "isCorrect": true,
  "areaKey": "ciencias-natureza",
  "timeSpentSec": 120
}
```

**Logica:**
1. Autenticar usuario (JWT)
2. Inserir em `user_question_answers` (user_id, question_id, is_correct, area_key, time_spent_sec, created_at)
3. Upsert em `topic_performance`:
   - Buscar `topico_value` via `question_topic_mapping` (pelo question_id)
   - Incrementar `total_answered`, `total_correct` se acertou
   - Recalcular `accuracy_pct`
4. Atualizar `pets`:
   - +10 XP por resposta, +5 bonus se acertou
   - Recalcular nivel (100 XP = 1 nivel)
5. Atualizar `users.streak` se primeira resposta do dia
6. Retornar `{ success: true, xpGained, newLevel }`

**Alteracoes no schema necessarias:**
```sql
-- Garantir que user_question_answers tenha as colunas certas
ALTER TABLE public.user_question_answers
  ADD COLUMN IF NOT EXISTS question_id text NOT NULL,
  ADD COLUMN IF NOT EXISTS is_correct boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS area_key text,
  ADD COLUMN IF NOT EXISTS time_spent_sec integer;
```

#### 0.2 Edge function `user-progress`

**Arquivo:** `supabase/functions/user-progress/index.ts`

**Input:** (GET, sem body — usuario vem do JWT)

**Logica:**
1. Autenticar usuario
2. Query `topic_performance` WHERE user_id
3. Agrupar por area (resolver mapeamento topico→area via `question_topic_mapping` ou JSON estatico)
4. Calcular totais gerais (totalAnswered, totalCorrect, accuracyPct)
5. Retornar `ProgressData` conforme tipo existente

**Retorno:**
```json
{
  "totalAnswered": 150,
  "totalCorrect": 98,
  "accuracyPct": 65.3,
  "areas": [
    {
      "key": "ciencias-natureza",
      "label": "Ciencias da Natureza",
      "totalAnswered": 40,
      "totalCorrect": 22,
      "accuracyPct": 55.0,
      "topicos": [
        { "value": "genetica", "label": "Genetica", "totalAnswered": 12, "totalCorrect": 5, "accuracyPct": 41.7 }
      ]
    }
  ]
}
```

#### 0.3 Edge function `user-me`

**Arquivo:** `supabase/functions/user-me/index.ts`

**Logica:** Autenticar → SELECT de `public.users` WHERE id = auth.uid() → retornar perfil

#### 0.4 Edge function `pet-me`

**Arquivo:** `supabase/functions/pet-me/index.ts`

**Logica:** Autenticar → SELECT de `public.pets` WHERE user_id = auth.uid() → retornar dados do pet

#### 0.5 Adicionar `area_key` na `topic_performance`

```sql
ALTER TABLE public.topic_performance
  ADD COLUMN IF NOT EXISTS area_key text;
```

Popular com base no mapeamento existente. Permite queries de progresso por area sem depender de JSONs externos.

---

### Fase 1 — Infraestrutura da Area de Estudo

#### 1.1 Nova tabela `study_packages`

```sql
CREATE TABLE public.study_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id        uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  area_key        text NOT NULL,
  topico_value    text NOT NULL,

  -- Conteudo gerado
  summary         jsonb,          -- { title, content, key_points[] }
  flashcards      jsonb,          -- Flashcard[]
  practice_questions jsonb,       -- Question[] com alternativas e explicacao
  mind_map        jsonb,          -- MindMapData

  -- Contexto da geracao
  performance_snapshot jsonb,     -- { accuracy, totalAnswered } no momento
  prompt_used     text,           -- prompt enviado a IA (debug/auditoria)

  -- Estado
  status          text NOT NULL DEFAULT 'generating'
                  CHECK (status IN ('generating', 'ready', 'failed')),
  error_message   text,

  -- Timestamps
  created_at      timestamptz DEFAULT now(),
  expires_at      timestamptz DEFAULT (now() + interval '7 days'),

  -- Indice para cache: mesmo usuario + topico + turma
  UNIQUE (user_id, class_id, topico_value)
);

-- RLS
ALTER TABLE public.study_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno ve seus pacotes"
  ON public.study_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema insere pacotes"
  ON public.study_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_study_packages_user ON public.study_packages(user_id);
CREATE INDEX idx_study_packages_lookup ON public.study_packages(user_id, class_id, topico_value);
CREATE INDEX idx_study_packages_expires ON public.study_packages(expires_at);
```

**Estrategia de cache:** a constraint UNIQUE garante 1 pacote por (user, class, topico). Ao gerar novo, faz UPSERT. `expires_at` de 7 dias — se expirado, regenera.

#### 1.2 Tabela `study_sessions` (progresso na sessao)

```sql
CREATE TABLE public.study_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id      uuid NOT NULL REFERENCES public.study_packages(id) ON DELETE CASCADE,

  -- Progresso por secao
  summary_read    boolean DEFAULT false,
  flashcards_completed integer DEFAULT 0,    -- quantos cards revisou
  flashcards_total     integer DEFAULT 0,
  questions_correct    integer DEFAULT 0,
  questions_total      integer DEFAULT 0,
  mind_map_viewed boolean DEFAULT false,

  -- Resultados
  xp_earned       integer DEFAULT 0,
  completed_at    timestamptz,               -- NULL = em andamento

  -- Timestamps
  started_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno ve suas sessoes"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_study_sessions_user ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_package ON public.study_sessions(package_id);
```

#### 1.3 Nova edge function `study-package`

**Arquivo:** `supabase/functions/study-package/index.ts`

**Endpoints:**

`POST /api/study/package` — Gerar ou buscar pacote
```json
// Request
{
  "area_key": "ciencias-natureza",
  "topico_value": "genetica",
  "class_id": "uuid (opcional, usa current_class_id se omitido)"
}

// Response
{
  "package_id": "uuid",
  "status": "ready",
  "summary": { "title": "...", "content": "...", "key_points": [...] },
  "flashcards": [...],
  "practice_questions": [...],
  "mind_map": { ... },
  "performance": { "accuracy": 41.7, "totalAnswered": 12 },
  "cached": true
}
```

**Logica:**
1. Autenticar usuario, resolver class_id
2. Verificar cache: SELECT de `study_packages` WHERE user + class + topico + expires_at > now()
3. Se cache valido e status = 'ready' → retornar
4. Se nao:
   a. Buscar desempenho do aluno (topic_performance)
   b. Buscar topicos fortes/fracos (top 3 de cada)
   c. Montar prompt estruturado (ver secao "Prompt para o NotebookLM")
   d. Chamar Python service: `POST /notebook/chat` com o prompt
   e. Parsear resposta JSON
   f. UPSERT em study_packages
   g. Retornar pacote
5. Se parse falhar → status = 'failed', retornar erro amigavel

`POST /api/study/session` — Registrar progresso da sessao
```json
// Request
{
  "package_id": "uuid",
  "summary_read": true,
  "flashcards_completed": 5,
  "questions_correct": 2,
  "questions_total": 3,
  "mind_map_viewed": true,
  "completed": true
}

// Response
{ "success": true, "xp_earned": 50, "session_id": "uuid" }
```

#### 1.4 Endpoint no servico Python (opcional)

Alternativa: criar endpoint dedicado `POST /notebook/study-package` no FastAPI que ja faz o prompt engineering e parsing, ao inves de usar o `/notebook/chat` generico.

**Vantagem:** prompt mais controlado, retry se JSON invalido, logica de fallback.
**Desvantagem:** mais um endpoint para manter.

**Recomendacao:** comecar usando `/notebook/chat` com prompt bem estruturado. Se a taxa de falha de parsing for alta (>10%), migrar para endpoint dedicado.

---

### Fase 2 — UI da Area de Estudo

#### 2.1 Estrutura de arquivos (web)

```
apps/web/src/
├── pages/
│   └── StudyArea.tsx              # Pagina principal (area → topico → pacote)
├── components/
│   └── study-area/
│       ├── AreaTopicSelector.tsx   # Seletor de area e topico com indicadores
│       ├── StudyPackageView.tsx    # Container do pacote (tabs ou scroll)
│       ├── SummarySection.tsx      # Texto explicativo em markdown
│       ├── FlashcardDeck.tsx       # Cards com flip animation
│       ├── PracticeQuestions.tsx   # Questoes com feedback inline
│       ├── MindMapView.tsx        # Arvore hierarquica (expandir/colapsar)
│       ├── SessionProgress.tsx    # Barra de progresso da sessao
│       └── SessionSummary.tsx     # Tela final (XP, acertos, proximos passos)
└── hooks/
    ├── useStudyPackage.ts         # Fetch/cache do pacote via API
    └── useStudySession.ts         # Estado local da sessao + sync com backend
```

#### 2.2 Estrutura de arquivos (mobile)

```
apps/mobile/
├── app/
│   └── study-area.tsx             # Tela principal
├── components/
│   └── study-area/
│       ├── AreaTopicSelector.tsx
│       ├── StudyPackageView.tsx
│       ├── SummarySection.tsx
│       ├── FlashcardDeck.tsx      # Swipe left/right + flip
│       ├── PracticeQuestions.tsx
│       ├── MindMapView.tsx
│       ├── SessionProgress.tsx
│       └── SessionSummary.tsx
└── hooks/
    ├── use-study-package.ts
    └── use-study-session.ts
```

#### 2.3 Fluxo de telas

```
Tab "Estudar" (existente)
  └── Botao "Area de Estudo" ou card de CTA
        │
        ▼
  AreaTopicSelector
  ┌──────────────────────────────────┐
  │ Area: [Ciencias da Natureza ▼]   │
  │                                  │
  │ Topicos:                         │
  │ ┌────────────┐ ┌────────────┐   │
  │ │ Genetica   │ │ Ecologia   │   │
  │ │ 41% ██░░░  │ │ 67% ████░  │   │
  │ └────────────┘ └────────────┘   │
  │ ┌────────────┐ ┌────────────┐   │
  │ │ Citologia  │ │ Evolucao   │   │
  │ │ -- sem dados│ │ 55% ███░░  │   │
  │ └────────────┘ └────────────┘   │
  │                                  │
  │ [Sugerido: Genetica - seu ponto  │
  │  mais fraco nessa area]          │
  └──────────────────────────────────┘
        │ clica no topico
        ▼
  StudyPackageView (loading → conteudo)
  ┌──────────────────────────────────┐
  │ ████████░░░░ 60% concluido       │  ← SessionProgress
  │                                  │
  │ [Resumo] [Cards] [Quiz] [Mapa]  │  ← Tabs ou scroll
  │                                  │
  │ ┌──────────────────────────────┐ │
  │ │ ## Genetica                  │ │
  │ │                              │ │
  │ │ A genetica estuda...         │ │
  │ │                              │ │
  │ │ **Pontos-chave:**            │ │
  │ │ - DNA e RNA                  │ │
  │ │ - Leis de Mendel             │ │
  │ │ - Heranca ligada ao sexo     │ │
  │ └──────────────────────────────┘ │
  │                                  │
  │       [Continuar → Cards]        │
  └──────────────────────────────────┘
        │ completa todas as secoes
        ▼
  SessionSummary
  ┌──────────────────────────────────┐
  │        Sessao concluida!         │
  │                                  │
  │    +50 XP   3/3 questoes         │
  │    5 flashcards revisados        │
  │                                  │
  │ Proximo passo sugerido:          │
  │ → Ecologia (67% - quase la!)     │
  │                                  │
  │  [Estudar outro topico]  [Home]  │
  └──────────────────────────────────┘
```

#### 2.4 Navegacao

**Web:**
- Rota: `/study-area` (nova pagina)
- Rota: `/study-area/:area/:topico` (deep link para topico especifico)
- Acessivel via: sidebar + CTA na Home + link na Rotina

**Mobile:**
- Tela: `study-area` (nova, fora das tabs)
- Acessivel via: botao na tab "Estudar" + CTA na Home + link na Rotina

---

### Fase 3 — Refinamentos

#### 3.1 Cache inteligente

- Pacote expira em 7 dias OU se `topic_performance` mudou significativamente (>10% de variacao na accuracy)
- Background refresh: se pacote esta perto de expirar e aluno abriu a area, regenerar silenciosamente

#### 3.2 Feedback nos flashcards

- Aluno pode marcar card como "facil", "ok", "dificil"
- Proximo pacote ajusta distribuicao de dificuldade
- Salvar em `study_sessions` como JSON: `flashcard_ratings: [{ index, rating }]`

#### 3.3 Integracao com rotina

- Rotina semanal sugere topico do dia → link direto para Area de Estudo daquele topico
- `DayCard` ganha botao "Estudar este topico" que abre `/study-area/{area}/{topico}`

#### 3.4 Integracao com gamificacao

- XP por sessao completa: 50 base + 10 por questao correta
- Streak: sessao de estudo conta como "dia ativo"
- Pet evolui com sessoes completadas (bonus XP)

#### 3.5 Historico de sessoes

- Tela de historico: "Voce estudou Genetica 3x esta semana, accuracy subiu de 41% para 58%"
- Grafico de evolucao por topico ao longo do tempo

---

## Decisoes tecnicas

### 1. Geracao sincrona vs. assincrona

**Decisao:** sincrona com timeout de 30s + fallback.

**Motivo:** a resposta do NotebookLM geralmente vem em 5-15s. UX de "gerando seu pacote..." com spinner e melhor que polling. Se timeout, mostrar conteudo parcial ou mensagem "tente novamente".

**Fallback:** se NotebookLM falhar, gerar pacote basico com:
- Resumo: "Topico: {nome}. Pratique questoes do banco para melhorar."
- Flashcards: vazio
- Questoes: buscar 3 questoes do banco de questoes do ENEM (ja existem no Storage)
- Mapa mental: estrutura basica com subtopicos do JSON estatico

### 2. Um endpoint ou multiplos

**Decisao:** um endpoint `POST /api/study/package` retorna o pacote completo.

**Motivo:** reduz roundtrips. O pacote inteiro (~5-10KB JSON) cabe em uma resposta. Gerar tudo de uma vez e mais eficiente que 4 chamadas separadas.

### 3. Onde fazer prompt engineering

**Decisao:** na edge function (TypeScript), nao no Python service.

**Motivo:** a edge function ja tem acesso ao desempenho do aluno (banco Supabase). Montar o prompt la e enviar ao Python service como uma "pergunta" evita duplicar acesso ao banco.

### 4. Tratamento de JSON malformado

**Decisao:** tentar parse → se falhar, regex para extrair blocos → se falhar, status = 'failed' com retry manual.

**Motivo:** LLMs as vezes adicionam texto fora do JSON. Regex de fallback (`/{[\s\S]*}/`) pode salvar a maioria dos casos.

### 5. Cache por (user, class, topico) com UPSERT

**Decisao:** 1 pacote ativo por combinacao. Novo pacote substitui o anterior.

**Motivo:** evita acumulo de dados. O aluno sempre ve o pacote mais recente e relevante para seu nivel atual.

---

## Estimativa de escopo

| Fase | Itens | Complexidade |
|---|---|---|
| **Fase 0** — Edge functions faltantes | 4 edge functions + 1 migracao | Media |
| **Fase 1** — Infraestrutura IA | 2 tabelas + 1 edge function + prompts | Media-Alta |
| **Fase 2** — UI (web + mobile) | ~10 componentes + 2 hooks + 2 paginas + rotas | Alta |
| **Fase 3** — Refinamentos | Cache, feedback, integracoes | Media |

**Dependencias entre fases:**
```
Fase 0 ──→ Fase 1 ──→ Fase 2 ──→ Fase 3
  (dados)    (IA)       (UI)    (polish)
```

Fase 0 e **bloqueante** — sem ela, as demais nao funcionam corretamente.

---

## Riscos e mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| NotebookLM retorna JSON invalido | Media | Pacote nao gerado | Fallback com questoes do banco + retry |
| Sessao do NotebookLM expira | Media | Todas as chamadas falham | Health check periodico + alerta + auth automatica |
| Latencia alta (>15s) por pacote | Baixa | UX ruim no loading | Cache agressivo (7 dias) + loading skeleton |
| Aluno sem dados de desempenho (novo) | Alta | Pacote generico | Detectar e gerar pacote "introdutorio" sem personalizacao |
| Turma sem materiais indexados | Media | IA sem contexto | Fallback para conteudo generico ENEM |
| Custo de chamadas ao NotebookLM | Media | Limites de API | Cache de 7 dias + deduplicacao |

---

## Checklist de validacao (por fase)

### Fase 0
- [ ] `POST /api/answer/question` persiste resposta e atualiza topic_performance
- [ ] `GET /api/user/progress` retorna ProgressData correto
- [ ] `GET /api/user/me` retorna perfil do usuario
- [ ] `GET /api/pet/me` retorna dados do pet
- [ ] topic_performance tem coluna area_key populada
- [ ] Dados de desempenho aparecem corretamente na tela de Progresso

### Fase 1
- [ ] Tabela study_packages criada com RLS
- [ ] Tabela study_sessions criada com RLS
- [ ] `POST /api/study/package` gera pacote via NotebookLM
- [ ] Pacote retornado tem summary, flashcards, practice_questions, mind_map
- [ ] Cache funciona (segunda chamada retorna do banco, nao chama IA)
- [ ] Fallback funciona quando NotebookLM falha
- [ ] JSON malformado e tratado sem crash

### Fase 2
- [ ] Seletor de area/topico mostra accuracy por topico
- [ ] Loading state enquanto pacote e gerado
- [ ] Resumo renderiza markdown corretamente
- [ ] Flashcards tem animacao de flip
- [ ] Questoes de pratica mostram feedback ao responder
- [ ] Mapa mental renderiza hierarquia
- [ ] Barra de progresso da sessao funciona
- [ ] Tela final mostra XP ganho
- [ ] Funciona em web e mobile
- [ ] Rota acessivel pela sidebar, Home e Rotina

### Fase 3
- [ ] Cache expira e regenera apos 7 dias
- [ ] Rotina linka para Area de Estudo do topico do dia
- [ ] XP da sessao reflete no pet
- [ ] Historico de sessoes acessivel
