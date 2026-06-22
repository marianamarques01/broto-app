# Broto — Documentacao do Sistema Completo

## Visao Geral

**Broto** e uma plataforma educacional focada na preparacao para o ENEM. O sistema combina gamificacao (pet virtual que cresce com o estudo), questoes de provas anteriores, acompanhamento de desempenho e inteligencia artificial para criar uma experiencia de estudo personalizada.

O nome "Broto" vem da metafora de crescimento: o aluno cultiva um broto virtual que evolui conforme ele estuda — de semente a muda, planta, flor e nivel especial.

---

## Arquitetura

O projeto e um **monorepo gerenciado com Turborepo** e npm workspaces, com a seguinte estrutura:

```
enem-mobile/
├── apps/
│   ├── mobile/          # App do aluno (React Native + Expo)
│   ├── web/             # App do aluno para desktop (React + Vite)
│   └── admin/           # Painel do professor/escola (React + Vite)
├── packages/
│   ├── shared/          # Tipos TypeScript compartilhados
│   └── ui/              # Componentes de UI compartilhados
├── supabase/
│   ├── functions/       # Edge Functions (API serverless)
│   ├── migrations/      # Migracoes do banco de dados
│   └── services/        # Servicos auxiliares (notebooklm-py)
└── docs/                # Documentacao por fase
```

### Stack Tecnologico

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native, Expo, Expo Router, NativeWind |
| Web (aluno) | React 18, Vite, React Router, inline styles |
| Admin (professor) | React 18, Vite, React Router, inline styles |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| IA | NotebookLM (chat com materiais da turma); rotina semanal via **`routine-generate`** (edge + `p_know`) com fallback **`gerarRotina`** no client; FastAPI `POST /routine/generate` tentado quando `NOTEBOOKLM_SERVICE_URL`/`FASTAPI_URL` configurados — ver [routine-generate.md](./routine-generate.md) |
| Monorepo | Turborepo, npm workspaces |
| Linguagem | TypeScript em todo o projeto |

### Multi-tenancy e white-label

**Direcao do produto:** plataforma **white-label** — cada cliente (cursinho, faculdade, rede etc.) deve poder ter **identidade propria** (nome, cores, mascote, *features*), configuravel por organizacao.

**Estado atual:** o modelo implementado e **`organizations` + `classes`** (multi-tenancy **institucional**): turmas, alunos, professores, materiais. Serve como **primeira base operacional** e como **cenario de demonstracao** (ex.: escola com turmas preparando ENEM).

**Documentacao de referencia:** `transicao-white-label.md` descreve `tenants` + config por tenant — **nao e descartado**; e o **alvo de arquitetura**. A evolucao planejada e **convergir** explicitamente para esse modelo (formalizar tenant + config) em fases futuras, em cima do que ja existe (`organizations.config` ja antecipa branding por org).

---

## Apps

### 1. App Mobile do Aluno (`apps/mobile/`)

O app original, construido com React Native e Expo. Oferece a experiencia completa do aluno:

**Telas principais:**
- **Home** — Dashboard com pet virtual, estatisticas do dia (streak, questoes respondidas, taxa de acerto), missoes diarias
- **Questoes** — Selecao de area, filtros por ano/topico/idioma, player de questoes com alternativas
- **Estudar** — Visao do Broto (pet) com nivel, XP, fase atual, areas para focar
- **Progresso** — Taxa de acerto geral, desempenho por area (barras), pontos fortes e fracos por topico
- **Rotina** — No **web**: edge `routine-generate` + `gerarRotina`. No **mobile** (legado): apenas algoritmo local

**Telas de autenticacao:**
- Login e Signup com design visual elaborado (gradientes, fireflies animados, broto flutuante)
- Onboarding (hoje: data do ENEM, horas disponiveis por dia; **planejado:** objetivo faculdade/curso, nota-alvo **MVP = entrada manual**, **fase 2 = estimativa generica**, autopercepcao por area — para **primeira rotina personalizada** na entrada)

**Navegacao:** Tab bar inferior com 5 abas (Home, Questoes, Estudar, Progresso, Rotina)

### 2. App Web do Aluno (`apps/web/`)

Versao desktop do app mobile, adaptada para telas maiores com layout de sidebar:

**Adaptacoes do mobile para web:**
- Layout com sidebar fixa a esquerda + area de conteudo
- Inline styles (sem Tailwind/NativeWind)
- `window.location.href` ao inves de `expo-router` para redirecionamento
- `import.meta.env.VITE_*` para variaveis de ambiente
- Removido `useFocusEffect` (especifico do Expo)
- Removidas missoes diarias (dependem de AsyncStorage)

**Paginas:**
| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/login` | Login | Formulario de email/senha |
| `/signup` | Signup | Criacao de conta com nome |
| `/onboarding` | Onboarding | Data do ENEM, horas/dia, codigo de turma |
| `/` | Home | Pet card, CTA de estudo, areas para focar |
| `/study` | Study | Seletor de area + filtros + player de questoes |
| `/progress` | Progress | Estatisticas gerais, barras por area, topicos fortes/fracos |
| `/routine` | Routine | Calendario semanal + sessoes do dia; prioridade via edge `routine-generate` (fallback local) |
| `/join-class` | JoinClass | Entrar em turma via codigo |
| `/broto` | BrotoPage | Chat com IA (NotebookLM) |

**Porta de desenvolvimento:** `5173`

### 3. Painel Admin (`apps/admin/`)

Dashboard para professores e escolas gerenciarem turmas, materiais e acompanharem alunos:

**Paginas:**
| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/login` | Login | Autenticacao de administrador |
| `/` | Dashboard | Grid de turmas, botao de criar turma |
| `/classes/new` | CreateClass | Formulario de criacao de turma |
| `/classes/:id` | ClassDetail | Abas de Materiais e Indicadores |
| `/classes/:id/students/:id` | StudentDetail | Desempenho individual do aluno |

**Funcionalidades:**
- Criacao e gerenciamento de turmas (nome, codigo de acesso)
- Upload de materiais (alimenta o NotebookLM para gerar conteudo)
- Painel de indicadores da turma (alunos matriculados, XP, streak, desempenho)
- Visualizacao detalhada do progresso de cada aluno

**Porta de desenvolvimento:** `5174`

---

## Packages Compartilhados

### `packages/shared/` (`@broto/shared`)

Tipos TypeScript usados por todos os apps:

- `Organization` — id, name, slug
- `Class` — id, name, code, organization_id
- `Student` — dados do aluno com metricas
- `Question` — questao com alternativas, contexto, disciplina
- `Progress` — estatisticas de desempenho por area e topico
- `Content` — tipos de materiais

### `packages/ui/` (`@broto/ui`)

Componentes de UI compartilhados entre admin e web (inline styles, sem Tailwind):

- `Button` — variantes (primary, secondary, danger), tamanhos (sm, md, lg)
- `Card` — container com padding e hover opcional
- `Badge` — indicadores coloridos (green, yellow, red, blue, gray)
- `Spinner` — loading spinner SVG animado

---

## Backend (Supabase)

### Banco de Dados (PostgreSQL)

**Fonte da verdade do schema:** `supabase/migrations/*.sql` (ver tambem `docs/db.md` — pode refletir snapshot antigo; se divergir do remoto, priorizar migracoes).

**Esclarecimento vs. documentacao legada:** nao ha tabelas `public.profiles`, `public.questions` ou `public.topics` no sentido de “catalogo relacional” descrito em docs antigos. Perfil do aluno = **`public.users`**. Conteudo das questoes = **JSON no Storage** (e indices no repo); no banco entram **respostas**, **desempenho** e **mapeamento** com `question_id` e `topico_value` em **texto** (sem tabela `topics` normalizada).

**Tabelas principais:**

| Tabela | Descricao | RLS |
|--------|-----------|-----|
| `public.users` | Perfis de alunos (nome, email, imagem, data_enem, horas_disponiveis_por_dia, current_class_id, onboarding_done) | Sim |
| `public.pets` | Pet virtual do aluno (nivel, xp, fase, humor, streak, questoesHoje, acertosHoje) | Sim |
| `public.organizations` | Escolas e organizacoes (name, slug) | Sim |
| `public.classes` | Turmas (name, code, organization_id) | Sim |
| `public.enrollments` | Matriculas aluno-turma (user_id, class_id) | Sim |
| `public.materials` | Materiais de estudo por turma | Sim |
| `public.admin_profiles` | Perfis de administradores/professores | Sim |
| `public.user_question_answers` | Historico de respostas | Parcial |
| `public.topic_performance` | Desempenho por topico (topico_value, total_answered, total_correct, accuracy_pct) | Parcial |
| `public.question_topic_mapping` | Mapeamento questao-topico | Parcial |

**Varias turmas por aluno:** `enrollments` permite **varias** matriculas. **`current_class_id`** no usuario hoje aponta **uma** turma e e **sobrescrito** no ultimo join — chat e contexto usam esse id. **Direcao do produto:** todas as turmas do aluno devem ser **ativas** no sentido de experiencia (sem depender so de “ultima turma”); professor e admin devem **ver** matriculas em multiplas turmas. **Evolucao:** UI/API por turma (hub, `class_id` explicito em fluxos, ou revisao do papel de `current_class_id`). Nao ha restricao de “uma matricula so” no modelo de dados.

**Dados fixos de seed:**
- Organizacao ENEM: `a0e00000-0000-4000-8000-000000000001`
- Turma ENEM (publica): `b0c00000-0000-4000-8000-000000000001`, codigo `ENEM26`

**Autenticacao:**
- Supabase Auth (email/password)
- Cada usuario tem registro em `auth.users` (Supabase) + `public.users` (perfil da aplicacao)
- Admins tem registro adicional em `public.admin_profiles`

**Seguranca (RLS):**
- Politicas por papel (aluno ve so seus dados, admin ve dados da sua organizacao)
- Funcoes `SECURITY DEFINER` para evitar recursao infinita entre tabelas relacionadas
- Chave `anon` para apps de browser, `service_role` somente no backend

### Edge Functions

| Funcao | Metodo | Descricao |
|--------|--------|-----------|
| `class-join` | POST | Matricular aluno em turma via codigo |
| `material-index` | POST | Indexar material no NotebookLM |
| `user-me` | GET | Retornar perfil do usuario autenticado |
| `pet-me` | GET | Retornar dados do pet |
| `answer-question` | POST | Registrar resposta e atualizar pet/progresso |
| `user-progress` | GET | Estatisticas de desempenho por area/topico |
| `broto-chat` | POST | Chat com IA usando materiais da turma |
| `routine-generate` | POST | Rotina inteligente: `topic_performance` + perfil → FastAPI ou fallback por `p_know` |

Documentacao detalhada da rotina: [docs/routine-generate.md](./routine-generate.md).

### Storage

- Bucket `static` — Armazena dados estaticos de questoes organizados por ano:
  - `{orgSlug}/areas.json` — Areas de conhecimento
  - `{orgSlug}/exams.json` — Lista de provas por ano
  - `{orgSlug}/topics/{area}.json` — Topicos por area
  - `{orgSlug}/{year}/details.json` — Detalhes da prova (indice de questoes)
  - `{orgSlug}/{year}/questions/{index}/details.json` — Questao individual
  - `{orgSlug}/data/question-topic-mapping.json` — Mapeamento questao-topico

---

## Fluxos Principais

### Fluxo do Aluno

```
1. Signup → Onboarding (data ENEM, horas/dia, codigo turma; futuro: objetivo faculdade/curso, nota-alvo estimada, nivel por area)
2. Home: ve pet, streak, missoes do dia
3. Study: escolhe area → filtros → responde questoes
4. Cada resposta → POST /api/answer/question → atualiza pet (XP) + progresso
5. Progress: ve taxa de acerto por area, topicos fortes/fracos
6. Routine: `useRoutinePlan` chama `routine-generate` → reordena areas por prioridade da edge → `gerarRotina` monta a grade semanal; se a edge falhar, so o algoritmo local
7. Broto Chat: tira duvidas com IA baseada nos materiais da turma
```

### Fluxo do Professor/Admin

```
1. Login (conta de admin)
2. Dashboard: ve todas as turmas da organizacao
3. Criar turma: define nome → recebe codigo de acesso
4. Upload de materiais: PDF/docs → indexados no NotebookLM
5. Indicadores: ve desempenho dos alunos (streak, XP, questoes)
6. Detalhe do aluno: ve performance por topico
```

### Sistema de Pet (Gamificacao)

O pet virtual do aluno evolui com o estudo:

| Fase | Emoji | Descricao |
|------|-------|-----------|
| Semente | 🌱 | Inicio da jornada |
| Muda | 🌿 | Comecando a crescer |
| Planta | 🪴 | Progresso consistente |
| Flor | 🌸 | Floresceu |

- **XP**: Ganho ao responder questoes. 100 XP = 1 nivel
- **Streak**: Dias consecutivos estudando
- **Nivel**: Progride com XP acumulado
- **Fase**: Evolui com marcos de nivel

### Sistema de Questoes

- Banco de questoes do ENEM (2015-2023)
- 4 areas: Linguagens, Ciencias Humanas, Ciencias da Natureza, Matematica
- Filtros: ano, topico, idioma (para Linguagens/Idiomas)
- Questoes armazenadas como JSON no Supabase Storage
- Mapeamento questao-topico para filtrar por assunto

### Geracao de Rotina

**Implementacao atual (web):** fluxo em tres camadas — ver [docs/routine-generate.md](./routine-generate.md).

1. **Edge `routine-generate`** — le `topic_performance` (`p_know`, `topico_value`, `area_key`) e perfil (`hours_per_day`, `exam_date`, `target_score`). Tenta `POST {NOTEBOOKLM_SERVICE_URL}/routine/generate` (timeout 10s, `SERVICE_SECRET`). Se falhar ou URL ausente, fallback local na edge: ate 5 sessoes ordenadas por **menor `p_know`**.
2. **Web `useRoutinePlan`** — `POST /api/routine/generate` via `api-client`. Reordena areas com `applySessionPriorityToAreas` e monta a semana com **`gerarRotina`** (`packages/shared/src/routine/generate-routine.ts`).
3. **Fallback final no client** — se a edge retornar erro/rede, `gerarRotina(areas, horasPorDia)` sozinho (prioridade por menor acerto).

Regras de `gerarRotina` (grade de 7 dias):

- Areas ordenadas por menor taxa de acerto (ou ordem vinda da edge)
- Horas disponiveis por dia do aluno
- Padrao semanal: rotacao de areas Seg-Sab, domingo descanso
- Topicos de foco: menores acertos na area do dia

**Meta diaria na Home:** card “Meta hoje” mede **missões concluidas** (`X / 3`), nao questoes brutas — ver `build-daily-missions.ts` e `DailyStreakCard`.

**Mobile (`apps/mobile/`):** ainda usa apenas `gerarRotina` local (sem `routine-generate`). O app mobile esta em remocao; referencia historica.

**FastAPI Python:** `supabase/services/notebooklm/main.py` expoe `POST /routine/generate` (NotebookLM). **Conectado via edge**, mas o **contrato de payload ainda difere** (Python exige `class_id` + `performance` por area; a edge envia lista de topicos com `p_know`). Enquanto nao alinhar, producao usa fallback local na edge na pratica.

**Evolucao planejada:** alinhar contrato edge ↔ Python para rotina enriquecida por IA; onboarding estendido (meta, nota-alvo, nivel por area) ja parcialmente no perfil (`user-me`).

---

## Integracao com IA (NotebookLM)

O sistema integra com o NotebookLM do Google principalmente para:

1. **Broto Chat**: O aluno conversa com uma IA com acesso aos materiais da turma. O professor faz upload → materiais indexados no NotebookLM → perguntas e respostas contextualizadas.

2. **Rotina inteligente:** a edge **`routine-generate`** chama o mesmo FastAPI (`NOTEBOOKLM_SERVICE_URL` ou `FASTAPI_URL` opcional) em `/routine/generate`. A UI web consome a edge em Home e `/routine`. Enquanto o contrato Python nao estiver alinhado, o fallback por **`p_know`** na edge + **`gerarRotina`** no client garantem a grade semanal. Detalhes: [docs/routine-generate.md](./routine-generate.md).

---

## Variaveis de Ambiente

### Apps Web/Admin (`apps/web/.env`, `apps/admin/.env`)
```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave-anon-publica>
```

### Edge Functions (Supabase Secrets — nao vao no Vite)

| Secret | Uso |
|--------|-----|
| `NOTEBOOKLM_SERVICE_URL` | FastAPI Python (chat, materiais, **rotina**) |
| `SERVICE_SECRET` | Bearer nas chamadas ao Python |
| `FASTAPI_URL` | Opcional — override de URL so para `routine-generate` |
| `ALLOWED_ORIGINS` | CORS producao |

Ver [docs/deploy-functions.md](./deploy-functions.md) e [docs/routine-generate.md](./routine-generate.md).

### Mobile (`apps/mobile/`)
Configurado via constantes do Expo.

---

## Como Rodar

```bash
# Instalar dependencias (raiz do monorepo)
npm install

# Rodar app web do aluno
cd apps/web && npm run dev        # http://localhost:5173

# Rodar painel admin
cd apps/admin && npm run dev      # http://localhost:5174

# Rodar app mobile
cd apps/mobile && npx expo start

# Build de producao
npm run build                     # Todos os apps via Turborepo

# Type-check
npm run typecheck                 # Todos os apps
```

**Deploy (visao geral):** no monorepo ainda **nao** ha pipeline fixo (GitHub Actions, `vercel.json`, `eas.json`). A direcao esperada e **mobile** via **Expo EAS** (build + lojas); **web** e **admin** como **sites estaticos** (`vite build`) em hospedagem tipo Vercel/Netlify/Cloudflare Pages; **Supabase** com migracoes e **`supabase functions deploy`**. Recomenda-se **CI minimo** (ex.: `typecheck` em PR) antes de beta amplo; **CD automatico** quando ambientes e secrets estiverem definidos. Antes de **producao** ou beta com usuarios reais, incluir **erros** (ex. Sentry) e, em seguida, **analytics** com cuidado a **LGPD** — ver `QUESTIONS.md` (itens A8/A9) para detalhe.

---

## Fases do Projeto

| Fase | Nome | Status | Descricao |
|------|------|--------|-----------|
| F0 | Fundacao | Completa | Monorepo, schema novo, migracao mobile |
| F1 | Admin Dashboard | Completa | Painel do professor com turmas, materiais, indicadores |
| F2 | Web Aluno | Completa | Versao desktop do app do aluno |
| F3 | IA & Rotina | Em parte | Chat + materiais (NotebookLM); **`routine-generate` no web** com fallback; alinhar contrato FastAPI ↔ edge; onboarding estendido em progresso |

---

## Decisoes Tecnicas Importantes

1. **Tabela `users` (nao `profiles`)**: O projeto usa `public.users` com colunas `nome`, `image` — nao `profiles` com `full_name`, `avatar_url`. Documentacao antiga que cite `profiles` / tabelas `questions` ou `topics` no Postgres deve ser atualizada ou marcada como legado (ver `QUESTIONS.md` A2 e migraoes).

2. **Pet em tabela separada**: XP e nivel ficam em `public.pets`, nao em `users`.

3. **Deadlock do Supabase Auth**: Fazer queries Supabase dentro do callback `onAuthStateChange` causa deadlock. Solucao: salvar `userId` no state, fazer query em `useEffect` separado.

4. **RLS recursao infinita**: Politicas em `classes` que referenciam `enrollments` (e vice-versa) causam recursao. Solucao: funcoes `SECURITY DEFINER` que quebram o ciclo.

5. **API Client pattern**: Edge functions sao chamadas via `supabase.functions.invoke()`. O path `/api/answer/question` e convertido para o nome da funcao `answer-question`.

6. **createCachedHook**: Cache em nivel de modulo com deduplicacao de requests inflight. Evita chamadas duplicadas quando multiplos componentes usam o mesmo hook.

7. **Inline styles**: Os apps web usam inline styles ao inves de Tailwind para manter simplicidade e evitar configuracao adicional.

8. **Chave anon vs service_role**: Apps de browser DEVEM usar a chave `anon`. A chave `service_role` bypassa RLS e so deve ser usada em backend/edge functions.

9. **Rotina inteligente (`routine-generate`)**: Web chama edge → edge tenta FastAPI → fallback por `p_know` → client usa `gerarRotina` se a edge falhar. URL do Python: `FASTAPI_URL` ou `NOTEBOOKLM_SERVICE_URL`. Documentacao: [docs/routine-generate.md](./routine-generate.md).

---

## Planos Futuros

1. **Simulado ENEM (aluno cria e faz)**:
(similar ao simulado de onboarding)
   - Aluno configura um simulado escolhendo **numero de questoes**, **materias/areas**, **topicos**, **dificuldade (opcional)**,
   - O sistema gera a prova a partir do banco de questoes (ex: ENEM por ano/area/topico) 
   - Aluno realiza o simulado
   - Resultados alimentam indicadores: nota/percentual, acertos por area/topico, tempo medio por questao, ranking/percentis (opcional).

  e 

  **Simulado ENEM/Prova (professor cria, aluno faz)**:
   - Professor configura um simulado escolhendo **numero de questoes**, **materias/areas**, **topicos**, **dificuldade (opcional)**, **tempo total**, **regras** (ex: permitir pausar, mostrar gabarito ao final).
   - O sistema gera a prova a partir do banco de questoes (ex: ENEM por ano/area/topico) e publica para uma turma (com janela de disponibilidade).
   - Aluno realiza o simulado com experiencia de prova: cronometro, navegacao por questoes, marcacao para revisao, envio final.
   - Resultados alimentam indicadores: nota/percentual, acertos por area/topico, tempo medio por questao, ranking/percentis (opcional).

2. **Area de Estudo (NotebookLM como “professor particular”)**:
   - O aluno escolhe **materia/area** e **topico** e recebe um “pacote de estudo” gerado/organizado pela IA, baseado nos materiais da turma + conteudos indexados.
   - Conteudos possiveis (na mesma jornada):
     - Texto explicativo (resumo + aprofundamento)
     - Flashcards (pergunta/resposta)
     - Questoes (com feedback e explicacao)
     - Mapa mental / estrutura em topicos (visual ou hierarquico)
   - Objetivo: transformar o app em uma experiencia guiada (estudar -> praticar -> revisar), reduzindo friccao para “o que estudar agora”.

3. **Indicadores do Professor (graficos + “jardim do Broto”)**:
   - Evoluir o painel de indicadores para uma visao mais rica por **turma** e por **aluno**, com graficos de evolucao (tempo, XP, streak, acuracia, distribuicao por topico).
   - Em paralelo, oferecer uma visualizacao ludo-metaforica no estilo **“jardim”**:
     - Cada aluno como um broto/planta no jardim
     - Saude/crescimento refletindo frequencia, consistencia e desempenho
     - Alertas visuais para quem precisa de atencao (ex: estagnado, quedas de acerto)
   - Objetivo: permitir leitura rapida (dashboard) e tambem uma visao “viva”/motivacional alinhada a identidade do Broto.

   4. **IA corrigir questão que o aluno errou**
