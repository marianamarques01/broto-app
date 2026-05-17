# SYSTEM_UNDERSTANDING.md

**Broto EdTech — Diagnóstico arquitetural e de produto**
Data da análise: 2026-05-12
Modo: investigação (sem alterações de código)
Fontes: leitura direta do repositório (`apps/`, `packages/`, `supabase/`), `.planning/codebase/CRITICAL-ANALYSIS.md` (2026-04-02), `BUSINESS_QUESTIONS.md` (260 questões), `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `NEXT-REFACTOR-PLAN.md`, git log + git status atual.

> Este documento descreve **como o sistema realmente funciona hoje**, não como ele deveria funcionar. Nada aqui é proposta de mudança — é diagnóstico.

---

## 1. Visão geral honesta

Broto é hoje **três produtos sobrepostos rodando em um monorepo**:

1. **Plataforma de estudo gamificada para vestibulando** (mobile + web) — pet, XP, streak, missões, rotina, prática de questões, simulado.
2. **EdTech B2B/multi-tenant** (admin) — organizações, turmas, materiais, indicadores de aluno para professores.
3. **Assistente IA por turma** (chat com Broto via NotebookLM) — uma microsserviço Python que faz scraping da API não-oficial do Google NotebookLM.

A camada de **dados e identidade** (Supabase Auth + `users` + `pets` + `organizations` + `classes` + `enrollments` + `organization_memberships` + `practice_sessions` + `user_question_answers` + `topic_performance` + `materials`) **é compartilhada entre os três produtos**, mas cada produto evoluiu por caminhos diferentes, com convenções diferentes, e às vezes pisa nos pés dos outros (ex.: admin lê `users`/`pets` de outros alunos mas as RLS versionadas só permitem `auth.uid()=id`).

O monorepo passou por um **ciclo de consolidação intencional (milestone v1.1, abril/2026)** que resolveu várias dívidas iniciais — race conditions, duplicação byte-a-byte de `study-area-mock`, `daily-missions` com adapter `IStorage`, fetchers e cached store no `@broto/shared`, retry/backoff, CORS fail-closed, testes Vitest, multi-tenant RLS (PR-08), remoção do `packages/ui` morto. Isso **funcionou**: o `@broto/shared` hoje carrega 30+ módulos de domínio (mock-exam, home timeline, missões, prioridade do banco, fetchers de pet/progress/user, runAfterAnswerSubmitted, organização/tenant), e o padrão "store no shared + hook no app" está sólido.

**O problema é que o sistema, depois da consolidação, voltou a crescer "por features" sem que a alma do produto tenha sido decidida.** Os últimos commits (`"dksajdksa"`, `"tentativa (falha) de melhorar pags de progresso e rotina"`, `"o que foi foi"`, `"reposicionar cards da home"`, `"reposicionar card semanal abaixo do Broto"`) e o estado atual do `git status` (cards deletados, novos cards untracked, +1969 linhas em `app.css`) mostram uma equipe **rearranjando a vitrine sem ter decidido o que vende**.

O sintoma do usuário ("confuso, inconsistente, difícil de evoluir, fluxos pouco claros") **é real**, mas a causa-raiz **não é mais duplicação de código** — é falta de modelagem dos conceitos centrais do produto.

---

## 2. Arquitetura atual

### 2.1 Topologia

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  apps/mobile     │   │  apps/web        │   │  apps/admin      │
│  Expo SDK 54     │   │  Vite + React 18 │   │  Vite + React 18 │
│  React 19        │   │  AppShell + RR6  │   │  RR6, sem shell  │
│  NativeWind      │   │  app.css (17k!)  │   │  3 CSS copiados  │
│  expo-router     │   │  Tabs + Sidebar  │   │  do web          │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │  @broto/shared (TS puro, sem React)         │
         │  • types/  • api-client core                │
         │  • cached-store  • mock-exam                │
         │  • daily-missions (IStorage)                │
         │  • home-schedule  • answer-question         │
         │  • organization/tenant utils                │
         │  • runAfterAnswerSubmitted                  │
         └──────────────────────┬───────────────────────┘
                                │
         ┌──────────────────────┴───────────────────────┐
         │   Supabase                                   │
         │   • Auth (email/password, auto-confirm)      │
         │   • Postgres + RLS (PR-08 multi-tenant)      │
         │   • Storage (PDFs públicos!)                 │
         │   • 15 Edge Functions (Deno)                 │
         │     _shared: cors.ts, authz.ts,              │
         │              enem-topic-area.ts              │
         └──────────────────────┬───────────────────────┘
                                │
         ┌──────────────────────┴───────────────────────┐
         │   supabase/services/notebooklm (Python)      │
         │   FastAPI wrapper sobre notebooklm-py        │
         │   • Sessão Google em disco (não-oficial!)    │
         │   • notebook_map.json local                  │
         │   • /notebook/{create, add-source, chat}     │
         │   • /routine/generate (existe e não é usado) │
         └──────────────────────────────────────────────┘
```

### 2.2 Convenções por camada (estado real)

| Camada | Naming hooks | Quotes | Semicolons | Indent |
|--------|--------------|--------|------------|--------|
| `apps/mobile` | camelCase (`useUser.ts`, `usePet.ts`) — TOOL-07 aplicado | mistura | mistura | mistura |
| `apps/web` | camelCase | single | no | 2 |
| `apps/admin` | camelCase | single | no | 2 |
| `packages/shared` | kebab-case (`create-cached-hook.ts`) | single | no | 2 |
| `supabase/functions` | kebab-case | mistura | mistura | mistura |

> Apesar do `CONVENTIONS.md` afirmar "mobile usa kebab-case", o hook rename para camelCase **já aconteceu** (TOOL-07 satisfied). A documentação está desatualizada. O `CLAUDE.md` ainda menciona `@broto/ui` que **não existe mais** no disco — apenas como entrada `"extraneous"` no `package-lock.json`.

### 2.3 Os três apps em detalhe

#### apps/mobile (16.174 linhas)

- **Entry:** `app/_layout.tsx` (splash + fontes + `OrganizationProvider` > `ClassProvider` + Stack raiz)
- **Auth:** apenas o hook `useAuth` (subscribe em `onAuthStateChange`), **sem `AuthContext`**. `signIn`/`signUp` ficam dentro das telas `login.tsx` (730 linhas) e `signup.tsx` (1160 linhas).
- **Tabs:** `(tabs)/_layout.tsx` redireciona para `/onboarding` se `!user.onboardingDone`. Cinco abas: `index` (home), `study`, `progress`, `routine`, `questions`. `BrotoChatFab` flutua sobre tudo.
- **Rotas extras no stack:** `onboarding`, `broto-chat` (modal), `study-area` (modal — **possivelmente órfã**, nenhum `router.push('/study-area')` foi achado), `mock-exam/*` (nested stack).
- **Cache pattern:** `apps/mobile/hooks/createCachedHook.ts` (camelCase) — 41 linhas IDÊNTICAS ao `apps/web/src/hooks/createCachedHook.ts`. A duplicação é **intencional** (isolar instância React; mobile usa React 19, web React 18), e isso está documentado em comentário. Não é gambiarra — é resposta correta a um problema real.
- **API client:** `lib/api-client.ts` — usa `supabase.functions.invoke()`, retry compartilhado do shared (`withJwtRefreshRetry`, `withExponentialBackoff`), 401 deduplicado com `scheduleUnauthorizedRedirect`.

#### apps/web (33.401 linhas)

- **Entry:** `main.tsx` → `RouterProvider` com `router` em `router.tsx`. Tema via `dataset.theme` no `<html>`.
- **Providers:** `AuthProvider` > `OrganizationProvider` > `ClassProvider`.
- **Auth:** `AuthContext` completo (signIn, signUp, signOut). **Mas** o `AuthContext` busca o perfil direto via `supabase.from('users').select(...)` (com `catch { // ignore }`!), enquanto `useUser` busca via `/api/user/me` (Edge Function). **Duas fontes de verdade para o perfil**, e elas podem divergir.
- **Rotas protegidas:** `<ProtectedRoute>` envolve `<AppShell>` + outlets (`/`, `/study/*`, `/progress`, `/routine`, `/join-class`, `/broto`, `/settings`, `/profile`). **`/onboarding` está FORA do `ProtectedRoute`** — qualquer um pode acessá-la sem sessão.
- **API client:** `lib/api-client.ts` — usa `fetch` direto para `${SUPABASE_URL}/functions/v1/${fnName}`, retry compartilhado, 401 → `signOut + window.location.href = '/login'` (com tolerância a `CLIENT_NO_SESSION` em login recente).
- **CSS:** `app.css` com **17.944 linhas em UM arquivo** (ver §6.1).

#### apps/admin (2.954 linhas)

- **App minimalista:** 5 páginas, sem `AppShell` (cada página remonta Sidebar + Header).
- **Sem `api-client`:** todo dado vai via `supabase.from(...)` direto. Única Edge Function chamada: `material-index` (após upload).
- **Auth:** `AdminAuthContext` autoriza pelo papel em `organization_memberships` (`STAFF_MEMBERSHIP_ROLES = ['teacher','org_admin','owner']`).
- **Não usa `createCachedHook`** — confirma o que `CLAUDE.md` afirma.
- **CSS triplicado:** `web-theme.css`, `broto-sidebar.css` (cópias literais do `app.css` web), `admin-app.css` (parity manual). Comentários no topo dos arquivos admitem isso explicitamente.

### 2.4 Backend

#### Edge Functions (15 ao todo)

| Função | Quem chama | Padrão de auth |
|--------|------------|----------------|
| `user-me` | mobile/web `useUser` | manual getUser + service role |
| `pet-me` (GET/PATCH) | mobile/web `usePet` | manual (GET) + `requireUser` (PATCH) — **inconsistente** |
| `user-progress` | mobile/web `useProgress` | manual + fallback silencioso para coluna `area_key` |
| `user-performance-series` | web `usePerformanceSeries` | manual |
| `user-recent-mistakes` | web `useRecentMistakes` | manual |
| `user-onboarding` | mobile/web `onboarding.tsx` | `requireUser` |
| `auth-signup` | mobile/web signup | **sem JWT** (cria conta) |
| `class-join` | web `JoinClass` | `requireUser` + RPC `rpc_class_join` |
| `material-index` | admin `useMaterials` | `requireUser` + `requireClassAccess('teacher')` |
| `broto-chat` | mobile/web `BrotoChat` | manual + valida enrollment, **não** revalida org membership |
| `answer-question` | mobile/web `submitAnswer` | `requireUser` |
| `practice-session-create` | mock-exam config | `requireUser` |
| `practice-session-get` | mock-exam play | `requireUser` |
| `practice-session-list` | mock-exam history | `requireUser` |
| `practice-session-complete` | mock-exam result | `requireUser` |

**Padrões de auth inconsistentes** (`_shared/authz.ts` existe mas só 7 das 15 funções usam): GETs antigos fazem `auth.getUser()` manual + admin client; functions criadas depois usam `requireUser()`. Resultado: bug fixes em auth precisam ser feitos em N lugares.

**Shared utilities:**
- `_shared/cors.ts` — fail-closed, **usado por todas** (SECR-01/02 satisfeito).
- `_shared/authz.ts` — `requireUser`, `requireMembership`, `requireClassAccess`, `resolveActiveContext`, `createServiceRoleClientUnsafe`.
- `_shared/enem-topic-area.ts` — mapa tópico→área, **só `pet-me` usa**; `user-progress` reimplementa inline.

**4 functions para practice-session** poderiam ser uma. Sem prejuízo prático imediato (são pequenas), mas indica padrão "1 verb = 1 function" sem revisão.

#### Schema / Migrations (20 arquivos)

Período: `20260222` a `20260422`. Sinais de churn:
- `pets_broto_nome` + `pets_broto_nome_retry` (mesma migração duas vezes).
- `pr08_rls_membership_core` + `pr08_2_fix_classes_rls_recursion` (correção de recursão).
- `handle_new_user` foi reescrita 3 vezes (foundation → PR-07 ENEM26 → PR-07.1 UUID default).
- `tenants` (tabela legada) **ainda existe** ao lado de `organizations` — RLS leitura aberta para `authenticated`.
- `pets.fase`, `humor`, `energia`, `moedas` em DB **mas `pet-me` re-deriva tudo de `nivel`/`streak`** — coluna e API divergem.
- `topic_performance.area_key` é lida no código de `user-progress`, **mas não há migração** versionada que crie a coluna. Há fallback silencioso (`select` sem `area_key` se falhar). Significa que o **banco prod diverge das migrações versionadas**.

#### RLS

- **Multi-tenant PR-08 robusto** para `classes`, `materials`, `enrollments`, `user_question_answers`, `topic_performance`, `organization_memberships`, `practice_sessions`. Aluno vê só com membership + enrollment ativos; staff vê com membership na org.
- **`users` e `pets`**: só políticas "_select_own". Mas o admin app faz `supabase.from('users').in('id', studentIds)` e `.from('pets').single()` para alunos de outra `auth.uid()`. **Provável**: ou existem policies só no painel Supabase (não versionadas) ou o admin **sempre vê dados vazios para detalhe de aluno**. É um buraco de versionamento.
- **`question_topic_mapping`, `tenants`**: leitura aberta para `authenticated` — aceitável se não for PII, mas vale documentar.
- **`enrollments` INSERT**: removido para `authenticated`; matrícula só via `rpc_class_join` (service role). Decisão deliberada.

#### NotebookLM Python

- **Endpoints:** `/notebook/create`, `/notebook/add-source`, `/notebook/chat`, `/routine/generate` (este último **órfão** — nenhuma Edge chama).
- **Auth Google:** sessão da CLI `notebooklm login` armazenada **em disco do servidor**. Não é OAuth do usuário Broto. Se a sessão expirar, o serviço retorna 503.
- **API não oficial:** alto risco de quebra com mudança upstream Google.
- **Estado persistente:** `notebook_map.json` no disco — não escala horizontalmente. A tabela `classes.notebook_id` já existe, mas o serviço Python ainda usa o arquivo.
- **Histórico de chat:** **não persistido no Broto**. Vive dentro do NotebookLM.
- **`SERVICE_SECRET`:** opcional. Se vazio, qualquer um que alcance o serviço pode operar.

---

## 3. Fluxos principais

### 3.1 Fluxo de autenticação

**Signup:**
1. Cliente chama Edge `auth-signup` (POST `/api/auth/signup`).
2. Edge: rate-limit in-memory (cold start zera), `auth.admin.createUser({ email_confirm: true })`.
3. Trigger SQL `handle_new_user` cria `public.users` + `pets` + executa `rpc_onboard_new_user_default_org` (membership ativo + enrollment ativo em ENEM26).
4. Cliente faz `supabase.auth.signInWithPassword`.
5. Redirect para `/onboarding`.

**Login:**
1. `supabase.auth.signInWithPassword`.
2. **Mobile:** `api.get('/api/user/me')` → decide entre `/(tabs)` ou `/onboarding`. **Se `/api/user/me` falhar, vai para `/onboarding` por padrão.**
3. **Web:** `AuthContext` busca perfil **via `supabase.from('users')`** (não via Edge) → `ProtectedRoute` decide rota.
4. **Admin:** `fetchAdminProfile` busca `organization_memberships` + `users` — só entra se tiver papel staff.

**Auto-signout em 401:** mobile usa `scheduleUnauthorizedRedirect`; web usa `signOut + window.location`. Comportamento simétrico de funcionalidade, divergente de implementação.

### 3.2 Fluxo de onboarding

`POST /api/user/onboarding` com:
```
{ horasDisponiveisPorDia, metaNota, niveis, horarios, brotoNome }
```
- Persiste em `users.onboarding_profile` (JSONB livre, sem schema).
- Atualiza `users.onboarding_done = true`.
- Renomeia pet em `pets.nome`.
- `"Skip all"` cria `onboarding_done=true` com `niveis={}, horarios=[]` — *tecnicamente onboardado*, na prática sem personalização.

**O CTA "Simulado diagnóstico" no fim do onboarding** cria uma `practice_sessions` de 20 questões e navega para `/mock-exam/play/...`. As respostas do diagnóstico **alimentam `topic_performance` real** — ou seja, o diagnóstico contamina o histórico do aluno desde o dia zero.

### 3.3 Fluxo de prática de questão

1. Cliente envia `submitAnswer({ questionId, isCorrect, areaKey, timeSpentSec, sessionId? })`.
2. Edge `answer-question`:
   - Valida sessão se `sessionId` (sem checar duplicação na sessão).
   - INSERT `user_question_answers`.
   - UPSERT `topic_performance` por `question_topic_mapping LIMIT 1` (um tópico só, mesmo se a questão tem vários).
   - UPDATE `pets`: `xp += 10` (+5 se acertou); `nivel = floor(xp/100)+1`. **NÃO atualiza `pets.fase`.**
   - UPDATE `users.streak` por delta de `last_study_date` (UTC).
3. Cliente: `runAfterAnswerSubmitted` (shared) dispara `bumpPerformanceDay` (localStorage), `incrementDailyAreaAnswer` (IStorage missions), `refreshPet`, `refreshProgress`.

**Trust model: o servidor confia em `isCorrect` enviado pelo cliente.** A questão correta vive no JSON estático que o cliente também lê. **XP farming é trivial** com qualquer cliente customizado.

### 3.4 Fluxo de simulado (SMCK)

`mock-exam/index.tsx` (mobile) ou `MockExamConfig.tsx` (web):
1. Aluno configura `StudentMockExamConfig` (N, áreas, anos, idiomas, modo aleatório).
2. `loadMockExamPool` (shared) lê o corpus estático.
3. `buildMockExamPayload` estratifica por área.
4. `practice-session-create` → recebe `sessionId`.
5. Navega para `play/[sessionId]`.
6. Cada resposta → `submitAnswer` com `sessionId`.
7. Ao terminar: `practice-session-complete` com `summary` JSON livre do cliente (sem validação de shape).

**Lacunas:**
- Sem `currentIndex` ou timer persistido → reload zera estado.
- Sem proteção contra responder a mesma questão duas vezes.
- Sessão sem `completed_at` fica aberta para sempre.
- `summary` é JSON arbitrário do cliente.

### 3.5 Fluxo de chat com Broto

- Cliente envia histórico completo `messages[]`.
- Edge `broto-chat` valida `enrollment.status='active'` na `users.current_class_id`. **Não valida `class.is_active`.** Não valida `organization_memberships`.
- Edge envia **apenas a última mensagem** ao Python (`/notebook/chat`).
- Resposta volta direto pro cliente.
- **Nada é persistido no nosso backend.**

### 3.6 Fluxo de turma (class-join, multi-tenant)

- `OrganizationContext` lê `organization_memberships` e calcula `effectiveActiveOrganizationId`.
- Trocar de org chama `users.update({current_organization_id})` + zera `current_class_id` se a turma anterior for de outra org + `invalidateTenantScopedCaches()`.
- `ClassContext` lê `users` JOIN `classes` JOIN `organizations`, valida coerência com a org ativa.
- `class-join` Edge → RPC `rpc_class_join` (service role) → atualiza enrollment + memberships + `users.current_*`.

**`progress` e `topic_performance` não têm `organization_id`.** Trocar de org **não escopa** o histórico — o aluno vê o mesmo progresso em qualquer turma.

### 3.7 Fluxo do material (admin → aluno)

- Admin sobe PDF via Storage público + insere em `materials` + chama `material-index` Edge.
- Edge cria/atualiza notebook NotebookLM com a fonte.
- `materials.index_status` transita `pending → indexing → indexed`/`failed`.
- Aluno vê `materials` pela RLS `mt_material_select_student` (membership + enrollment ativos).

**Lacunas:**
- PDFs em bucket **público**: qualquer um com a URL lê.
- `material-index` tem timeout client-side de 55s; se o NotebookLM continua trabalhando depois, status volta a `pending` mas o trabalho real continua.
- Sem `cleanup` de arquivos no Storage ao deletar material.

---

## 4. Fontes de verdade — o mapa real do estado

| Conceito | Onde mora | Atualizado por | Lido por |
|----------|-----------|----------------|----------|
| **Identidade Auth** | `auth.users` (Supabase) | Supabase Auth | Edge `getUser` |
| **Perfil aluno** | `public.users` | `auth-signup` trigger; `user-onboarding`; raramente UI | `user-me` Edge **e** AuthContext via Supabase direto (web) — **2 caminhos** |
| **Pet stats (XP, nível)** | `public.pets.xp`/`nivel` | `answer-question` Edge | `pet-me` Edge |
| **Pet fase** | `public.pets.fase` (raramente atualizado) | `handle_new_user` (semente) | **NÃO LIDO** — `pet-me` re-deriva de `nivel` |
| **Pet humor/energia/moedas** | `public.pets.*` | Nunca | **NÃO LIDO** — `pet-me` computa humor de `streak` |
| **Pet nome** | `public.pets.nome` | `user-onboarding`, `pet-me PATCH` | `pet-me` Edge |
| **Streak** | `public.users.streak` + `last_study_date` | `answer-question` (UTC) | `pet-me` |
| **Progresso por tópico** | `public.topic_performance` | `answer-question` upsert | `user-progress` Edge |
| **Histórico de respostas** | `public.user_question_answers` | `answer-question` | `pet-me`, `user-performance-series`, `user-recent-mistakes` |
| **Missões diárias** | `IStorage` cliente (AsyncStorage/localStorage), chave `broto:daily-missions:v1:<localDate>` | Cliente após resposta | Cliente — **server não sabe** |
| **Conquistas (achievements)** | **Nada server-side.** Web: derivadas em runtime de `totalAnswered + accuracyPct` em `lib/achievements.ts` | N/A | Só web |
| **Performance history (heatmap anual)** | localStorage cliente (chave `performance-history`) | Cliente | Componente local |
| **Onboarding profile (JSONB)** | `users.onboarding_profile` (sem schema) | `user-onboarding` | `user-me` |
| **Tópico → área** | Spalhado: `_shared/enem-topic-area.ts` (parcial), `user-progress/index.ts` (TOPICO map, 20 slugs), `apps/*/lib/area-config.ts` (cores+ícones), `packages/shared/src/lib/topico-to-area.ts` | Quem edita o arquivo | Tudo |
| **Áreas** | Cliente: `apps/mobile/theme/area-config.ts` (RN icons) + `apps/web/src/lib/area-config.ts` (web icons). CONS-03 deferido. |
| **Question bank** | JSON estático em Supabase Storage / CDN: `static/{year}/details.json`, `topics/*.json`, `areas.json` | Operador manual | Cliente (`useQuestionsFilters`, `loadMockExamPool` — duplicação documentada) |
| **Rotina** | Cliente: `lib/routine.ts` deriva de `topic_performance` com `PATTERN=[0,1,2,3,0,1,-1]` hardcoded. `horarios` do onboarding **ignorados**. | N/A | Componente |
| **Histórico de chat** | Dentro do NotebookLM (Google). **Não persistido localmente.** | N/A | NotebookLM |
| **Turma ativa** | `users.current_class_id` + `users.current_organization_id` (Postgres) | `rpc_class_join`; troca de org | ClassContext, OrganizationContext |
| **Membership** | `organization_memberships` (canônico) + `admin_profiles` (legado parcialmente sincronizado) | `handle_new_user`, PR-10 sync | AdminAuthContext, RLS |

**Os conceitos com múltiplas fontes de verdade ou nenhuma fonte clara são os que mais geram bugs e confusão futura.**

---

## 5. Conceitos centrais que existem implícitos mas não estão modelados

Estes são os pontos onde o sistema sofre de "falta de modelagem", não de "duplicação":

### 5.1 "Engine de gamificação"
Não existe. Cada mecânica vive sozinha:
- **XP/nível** — `answer-question` Edge.
- **Streak** — `answer-question` Edge.
- **Missões diárias** — cliente, IStorage, **sem persistência server-side**, sem persistência cross-device.
- **Conquistas** — só no web, derivadas em runtime, **sem persistência**.
- **Fase do Broto** — calculada (mas a coluna existe e nunca é atualizada).
- **Humor do Broto** — `45 + min(streak,10)*3`, calculado, coluna no DB ignorada.

Resultado: cada "feature de gamificação" adicionada cria **mais uma fonte de verdade** e **mais um lugar para divergir**. Não há um lugar onde alguém pergunte "o aluno acabou de responder uma questão — o que precisa atualizar?". Cada uma atualiza seu próprio cantinho.

### 5.2 "Plano de estudo / rotina"
Cosmético. `gerarRotina` deriva ordem de áreas piores; `horarios` do onboarding nunca entram; sem persistência de "dia completo"; domingo é -1 hardcoded; `duracaoMin = horasPorDia * 60` (12h/dia em uma única matéria!). Endpoint `/routine/generate` do Python existe e **ninguém chama**.

### 5.3 "Sessão de estudo"
Existe **apenas para simulado** (`practice_sessions`). Estudo solto pelo banco de questões **não tem sessão**: cada resposta vai pra `user_question_answers` sem agrupamento, sem contexto, sem possibilidade de "continuar de onde parei".

### 5.4 "Material de estudo"
`materials.type ∈ {pdf, url, youtube, text}` — sem conceito de "aula", "módulo", "playlist", "trilha". Material é arquivo solto vinculado a turma. Não há ordem, hierarquia, pré-requisito.

### 5.5 "Conhecimento" / catálogo
ENEM tópicos vivem como **slugs spalhados** em 4+ lugares (`_shared/enem-topic-area.ts`, `user-progress` TOPICO map, `area-config.ts` mobile, `area-config.ts` web, `daily-missions/AreaKey`). Não há **uma fonte canônica** do catálogo de matérias/áreas/tópicos com seus metadados (cores, ícones, labels, hierarquia).

### 5.6 "Tenant" vs "Organização" vs "Turma" vs "Aluno"
- `tenants` (legado) coexiste com `organizations` (canônico).
- `admin_profiles` (legado) coexiste com `organization_memberships`.
- `users.current_organization_id` + `users.current_class_id` + `OrganizationContext` + `ClassContext` + `effectiveActiveOrganizationId` formam uma teia. Funciona, mas qualquer dev novo leva horas pra entender qual flag prevalece.

### 5.7 "Identidade do aluno"
- `users.nome` (DB)
- `users.image` (URL livre, sem upload flow)
- `users.cpf`, `telefone`, `cidade`, `estado` (coletados no signup mas **nunca surfaceados**)
- `users.data_enem` (sem validação)
- `users.onboarding_profile` (JSONB livre)
- `pets.nome` (separado, com fallback "Broto")
- `Student` no `@broto/shared` usa `full_name` — **e não é usado pelo admin**, que vai direto em `users.nome`.

**Identidade do aluno não tem um shape unificado**. Cada consumidor define o seu.

### 5.8 "Notificação"
Não existe. Sem push, sem email, sem in-app. Streak vai morrer e ninguém avisa o aluno.

### 5.9 "Conhecimento por turma"
Materiais vivem em `materials` (Postgres) + Storage (PDF). O `notebook_id` da turma vive em `classes` **e** em `notebook_map.json` (arquivo local Python). Sincronização frágil. Se um deletar e outro não, vira fantasma.

### 5.10 "Histórico do aluno"
- `user_question_answers` (respostas)
- `topic_performance` (agregados)
- `practice_sessions` (simulados)
- `pets.xp` (gamificação)
- localStorage `performance-history` (heatmap)
- IStorage `daily-missions` (missões)

Não há um **"histórico unificado do aluno"**. Cada visão (KPI strip, heatmap, conquistas) reconstrói por conta própria, com regras de "hoje", "semana", "mês" diferentes (e timezones diferentes — UTC vs local).

---

## 6. Anti-patterns, gambiarras e pontos frágeis (mapeamento atual)

### 6.1 CSS de 17.944 linhas

`apps/web/src/styles/app.css` é o **maior sintoma visível** de "está crescendo sem direção":

- Organizado por seções comentadas (`/* ── Home dashboard ── */`, etc.), mas tudo em um arquivo.
- Tem **placeholders explícitos**: `.broto-home-metrics-placeholder*` (L3515–3685) — bloco grande de CSS para um componente (`HomeDashboardMetricsPlaceholder.tsx`) **não importado em lugar nenhum**. CSS + TSX órfãos.
- Tem **estilos para componentes deletados** mascarados: `.broto-pet-card-legacy { display: none !important; }` (L3688). O componente foi removido, mas o CSS ficou "para o caso de voltar".
- **Tema light/dark**: bloco em `:root` aplica o tema escuro como default; `:root[data-theme="light"]` sobrescreve. Qualquer HTML sem `data-theme` herda o dark.
- A última mudança não commitada adiciona **+1969 linhas** ao arquivo.
- Admin **copia** três pedaços do CSS (`web-theme.css`, `broto-sidebar.css`, `admin-app.css`) com comentários "parity com web" — **mudança no web não propaga no admin**.

### 6.2 Páginas/componentes monolíticos (top atual)

| Linhas | Arquivo | Diagnóstico |
|--------|---------|-------------|
| 17.944 | `apps/web/src/styles/app.css` | Monólito CSS |
| 1.718 | `apps/web/src/pages/StudyArea.tsx` | Concentra hub do estudo |
| 1.589 | `apps/mobile/app/onboarding.tsx` | Wizard inteiro |
| 1.340 | `apps/mobile/app/(tabs)/questions.tsx` | Quase clone do `study-area.tsx` |
| 1.324 | `apps/mobile/app/study-area.tsx` | Quase clone do `questions.tsx` — **rota órfã?** |
| 1.160 | `apps/mobile/app/(auth)/signup.tsx` | Wizard de 7 passos |
| 991 | `apps/mobile/app/(tabs)/routine.tsx` | Tela inteira de rotina |
| 982 | `apps/mobile/app/enem-questions.tsx` | Player de prática |
| 879 | `apps/web/src/components/study/QuestionBankView.tsx` | Hub do banco |
| 863 | `apps/web/src/pages/Onboarding.tsx` | Wizard web |
| 739 | `apps/web/src/pages/MockExamConfig.tsx` | Config simulado |
| 711 | `apps/mobile/components/home/HomeScheduleRail.tsx` | |

**Duplicação interna mobile descoberta**: `app/(tabs)/questions.tsx` (1340) e `app/study-area.tsx` (1324) são **estruturalmente o mesmo** (mesmos imports, mesmo fluxo `select | loading | study`, mesmos `TABS`). ~1300 linhas duplicadas com manutenção dupla **dentro do mesmo app**.

**Duplicação cross-platform**: `apps/mobile/app/onboarding.tsx` (1589) vs `apps/web/src/pages/Onboarding.tsx` (863) — wizard com mesmo contrato server-side, duas implementações inteiras. Mudança no fluxo de produto precisa ser feita em dois lugares.

### 6.3 Erros silenciosos remanescentes

Após BUGF-03/04 satisfeitos, ainda há (`grep` real):

- `apps/web/src/components/questions/QuestionPlayer.tsx:112` — `catch { // fail silently }` no submit de resposta.
- `apps/web/src/contexts/AuthContext.tsx:58` — `catch { // ignore }` ao carregar perfil.
- `apps/mobile/app/enem-questions.tsx:262` — `submitAnswer(...).catch(() => {})`.
- `apps/mobile/app/mock-exam/play/[sessionId].tsx:156` — `practice-session-complete .catch(() => {})`.
- `apps/web/src/pages/MockExamPlay.tsx:142` — idem.
- `apps/mobile/app/(auth)/login.tsx:403,406` — `catch {}` duplo.
- `apps/mobile/app/(auth)/signup.tsx:670` — `catch {}`.
- `apps/web/src/hooks/useRecentMistakes.ts:24` — `.catch(() => ({ mistakes: [] }))` — falha de rede vira "nenhum erro".

**O padrão é claro**: erros em **submissão e leitura de dados secundários** ainda são engolidos. O BUGF-05 (`broto-chat`) está aberto.

### 6.4 Pontos onde o admin acopla direto ao schema

- `useClassIndicators.ts` faz `supabase.from('users').in('id', studentIds)` — RLS versionada só permite `auth.uid()=id`. **Provável**: ou existem policies em produção não versionadas, ou o admin só vê placeholders. **Esta é a maior dívida não documentada de RLS.**
- `StudentDetail.tsx` faz `supabase.from('pets').single()` no aluno.
- Tipos `ClassIndicatorsData`/`StudentIndicator` **locais** no admin enquanto `ClassIndicators` e `StudentProgress` existem no `@broto/shared`.

### 6.5 Inconsistências persistentes

- **Dois métodos para perfil no web** (`AuthContext` via Supabase direto vs `useUser` via Edge) — risco real de divergência.
- **`pet-me` GET e PATCH usam padrões de auth diferentes** (manual vs `requireUser`).
- **`/onboarding` no web sem `ProtectedRoute`** — fluxo acessível sem sessão.
- **`/progress` na `MobileTabBar` mas não no `Sidebar` desktop** — usuário desktop não chega ao Progress pelo nav principal.
- **`area_key` lida pelo Edge mas não existe nas migrações versionadas** — fallback silencioso.
- **`pets.fase`, `humor`, `energia`, `moedas` em DB mas ignorados** pela API atual.
- **`tenants` (legado) coexiste com `organizations`**.
- **`admin_profiles` (legado) coexiste com `organization_memberships`**.
- **React 19 (mobile) vs React 18 (web/admin)** — peer dep mismatch latente.
- **Supabase JS 2.90 (mobile) vs 2.45 (web/admin)** — tipos de erro/invoke divergem.
- **Endpoint `/routine/generate` no Python existe mas nenhuma Edge usa**.
- **CSS legado mascarado** (`*-legacy { display:none !important }`) ao invés de removido.
- **`HomeDashboardMetricsPlaceholder.tsx`** existe e não é importado.

### 6.6 Trust model frágil em prática crítica

- **`answer-question` confia em `isCorrect` enviado pelo cliente.** Como a correta está no JSON estático que o cliente lê, **não há fonte servidor-side de verdade**. XP farming trivial.
- **`practice-session-complete` aceita `summary` JSON arbitrário do cliente.**
- **`practice-session-create` aceita `questionIds` arbitrários** (sem checagem de existência).
- **Sem idempotency key em `answer-question`** — retries de rede dobram XP.
- **`broto-chat` envia só `lastUserMsg.content`** ao Python — multi-turno só funciona se o NotebookLM mantiver contexto por sessão (e nada garante isso).
- **Sem rate-limit per-user/day** em `answer-question`, `practice-session-create`, `broto-chat`.

### 6.7 Sinais de "rearranjando vitrine"

Git log dos últimos 20 commits:
- `4b44d642 docs(quick-260508-g04): registrar reposição dos cards`
- `96551b59 feat(web): reposicionar cards da home`
- `cb6e4f89 docs(quick-260506-sjk): registrar card semanal`
- `4695069d feat(web): adicionar card de progresso semanal`
- `0e76ebfc feat(web): banco de questões com priorização e erros recentes`
- `660283a7 config page`
- `d956bbd2 tentativa (falha) de melhorar pags de progresso e rotina`
- `47998810 o que foi foi`
- `70697919 feat(web): unificar Área de Estudo e banco de questões`
- `58798655 feat(web): ajustar landing e remover mini gráfico no banco`
- `87c5943b dksajdksa`

E o `git status` atual (não commitado):
- 2 cards deletados (`HomeAreaPerformanceCard`, `HomeWeeklyProgressCard`)
- 3 arquivos novos não trackeados (`HomePracticeYearHeatmap.tsx`, `RoutineAreaPerformance.tsx`, `lib/achievements.ts`)
- +2229 inserções / −1348 deleções espalhadas pelas pages Home/Progress/Routine
- +1969 linhas em `app.css`

**Diagnóstico:** a equipe está **iterando rapidamente em layout de dashboard** sem ter um modelo de **"o que medir e exibir"**. Cards são introduzidos, removidos, repostos, renomeados. O CSS cresce a cada iteração porque ninguém deleta o legado.

---

## 7. O que está bem pensado

Para ser justo:

- **`@broto/shared` está bem isolado** — sem React, sem fetch específico de plataforma. ESLint guarda isso. **Padrão correto.**
- **`createCachedStore` + wrapper por app** — solução adequada para dual-React, não gambiarra.
- **`_shared/cors.ts` fail-closed** — boa hardenização.
- **Multi-tenant RLS (PR-08)** — política consistente baseada em `organization_memberships` com helpers `SECURITY DEFINER`. Forte para tabelas core.
- **API client com retry + JWT refresh** — `withJwtRefreshRetry`, `withExponentialBackoff` corretos.
- **Vitest em `packages/shared`** — testes existem para `createCachedStore` (race), `daily-missions`, `answer-question`.
- **Stream de bug-fixes recente (BUGF-01..04)** — equipe sabe corrigir quando o problema é técnico.
- **Onboarding agora persiste** (ONBR-01/02).
- **Edge `material-index`** com `requireClassAccess('teacher')` — bom exemplo de auth completa.

---

## 8. O que claramente está "crescendo sem direção"

- **Home / Progress / Routine** (web) — três páginas reorganizadas em paralelo, cards que aparecem, somem, voltam, sem que se decida o que é "Home", o que é "Progress" e o que é "Routine".
- **CSS monolítico** — cresce a cada iteração de layout.
- **Mobile `(tabs)/questions.tsx` vs `study-area.tsx`** — duplicação interna do mesmo conceito sem motivo claro.
- **Gamificação** — XP, streak, fase, humor, missões, conquistas adicionados como features, não como engine.
- **Rotina** — placeholder vendido como feature.
- **Conquistas** — só web, só client-side, derivadas em runtime, sem persistência. Não há plano claro.
- **Chat com Broto** — sem histórico próprio, sem rate-limit, sem quota, sem persistência.
- **Schema de banco** — colunas como `pets.fase/humor/energia/moedas` existem e são ignoradas pela API; `topic_performance.area_key` é usada pelo Edge mas não existe nas migrações.

---

## 9. Riscos arquiteturais e dependências perigosas

| Risco | Probabilidade | Impacto | Mitigação atual |
|-------|---------------|---------|-----------------|
| **NotebookLM API quebrar** (não oficial) | Alta a médio prazo | Chat inteiro morre | Nenhuma — sem fallback |
| **Sessão Google expirar no servidor Python** | Média (recorrente) | Chat 503 silencioso | Nenhuma — operador manual reauthentica |
| **Migrações de banco divergirem do prod** (área `area_key` é evidência) | Alta | Bugs invisíveis | Fallback silencioso (mascara o problema) |
| **RLS `users`/`pets` quebra para admin** se policies prod sumirem | Média | Admin fica cego | Versionamento incompleto |
| **PDFs públicos** no Storage | Confirmada | Vazamento de conteúdo proprietário | Decisão de produto, não bug |
| **XP farming via API** | Trivial de explorar | Gamificação fake | Nenhuma — trust no cliente |
| **Race condition em troca rápida de turma** | Baixa | `current_class_id` inconsistente | `rpc_class_join` lock + `invalidateTenantScopedCaches` |
| **Cliente desatualizado com session expirada** | Média | 401 loop | `scheduleUnauthorizedRedirect` (debounce OK) |
| **Streak/missões em timezone diferentes** (UTC server vs local client) | Alta no fim do dia | Aluno vê estado divergente | Nenhuma — coexistem |
| **`organization_id` ausente em `user_question_answers` e `topic_performance`** | N/A — limitação modelo | Progresso não escopa por org | Decisão pendente |
| **Static JSON do question bank sem versionamento** | Médio | Mudança quebra simulados ativos | Nenhuma |
| **`@broto/ui` ainda em docs e lockfile** mas removido do disco | Confusão de devs novos | Nenhuma técnica | — |
| **React 18 ↔ React 19 entre apps** | Baixa por enquanto | Bug subtle se algum hook compartilhado escapar | ESLint guarda |

---

## 10. Áreas confusas e decisões improvisadas

### 10.1 Auth no web — dois caminhos para o perfil
`AuthContext.fetchProfile` faz `supabase.from('users').select(...)` direto + `catch { // ignore }`.
`useUser` faz `api.get('/api/user/me')` (Edge).
Resultado: **dois shapes possíveis de `UserProfile`**, populados em momentos diferentes, ambos consumidos em paralelo pelo app. Quando começa a diferir, o bug é caríssimo de rastrear.

### 10.2 `/onboarding` sem guard
Sem `ProtectedRoute`. Acessível sem sessão. Submete `api.post('/api/user/onboarding')` que falha sem JWT — mas o usuário viu uma tela inteira primeiro.

### 10.3 Mobile com rota `study-area` órfã
Registrada como modal no stack raiz, mas nenhum `Link`/`router.push('/study-area')` foi encontrado no app. Pode ser deep link reservado ou herança morta.

### 10.4 Mobile sem `class-join`
Nenhum uso de `class-join` ou `accessCode` no mobile. Aluno mobile **não pode entrar em turma** via UI? Depende de outro fluxo, ou só a turma default ENEM26.

### 10.5 Daily missions vs server
Missões existem só no cliente. Apagar localStorage perde tudo. Trocar de device perde tudo. XP das missões **nunca é creditado**. É copy/cosmético.

### 10.6 Achievements
Web: `lib/achievements.ts` deriva em runtime. Sem persistência. Sem evento. Sem celebração explícita. Sem versionamento. **Sinaliza decisão de produto não tomada.**

### 10.7 Rotina
`PATTERN = [0,1,2,3,0,1,-1]` hardcoded. `horarios` do onboarding ignorados. `duracaoMin = horasPorDia * 60` (12h em um único tópico). `Sunday = -1`. **Vendido como feature, é placeholder.**

### 10.8 Pet legado vs API
Quatro colunas em `pets` (`fase`, `humor`, `energia`, `moedas`) que nada lê nem atualiza. **Deveriam ter sido removidas em uma migration**, mas permanecem. Sinaliza falta de coragem de "matar o legado".

### 10.9 Tenants legados
Tabela `tenants` ainda existe com leitura aberta. `admin_profiles` ainda existe com sync parcial para `organization_memberships`. **Dois sistemas multi-tenant coexistindo**.

### 10.10 Frase reveladora em `study-area-mock.ts`
> "substituir por API real quando disponível"

Vive em `@broto/shared` (foi consolidado!) — mas continua **mock**. A área de estudos (`StudyArea` web, `study-area`/`questions` mobile) é a maior tela do app **e ainda usa dados sintéticos**.

---

## 11. Inconsistências entre web e mobile (delta atual)

Após consolidação, a duplicação byte-a-byte foi resolvida. O que **ainda diverge significativamente**:

| Tópico | Mobile | Web |
|--------|--------|-----|
| Auth | só hook `useAuth` | `AuthContext` + Supabase direto |
| Onboarding | 1589 linhas | 863 linhas — mesma feature, dois códigos |
| Home (banner pet) | `HomePetBanner` não existe; usa hero customizado | `HomePetBanner` + `PetCard` legacy oculto |
| Schedule | `HomeScheduleRail` | `HomeRightSidebar` — mesma `buildHomeTimelineEvents`, UIs diferentes |
| Achievements | não existe | `lib/achievements.ts` derivado em runtime |
| Heatmap anual | não existe | `HomePracticeYearHeatmap.tsx` (untracked) |
| Performance series | não existe | `usePerformanceSeries` + Edge |
| Recent mistakes | não existe | `useRecentMistakes` + Edge |
| Routine UI | `(tabs)/routine.tsx` 991 linhas | `Routine.tsx` 350 + componentes |
| Question bank | `(tabs)/questions.tsx` 1340 + `study-area.tsx` 1324 (duplicados internos) | `QuestionBankView.tsx` 879 + `StudyArea.tsx` 1718 |
| Mock exam config | `mock-exam/index.tsx` 482 | `MockExamConfig.tsx` 739 |
| Class join | **inexistente na UI** | `/join-class` |
| Settings | inexistente como tela dedicada | `Settings.tsx` 390 |

**Implicação produto:** *o web é o app de referência hoje*. O mobile está em delay de features importantes (achievements, heatmap, mistakes, performance series). Decisão tácita, nunca declarada.

---

## 12. Mapa "o que ler primeiro para entender o sistema"

Se um arquiteto novo entrasse hoje, leitura sugerida em ordem:

### Visão de produto
1. `BUSINESS_QUESTIONS.md` (47KB, 260 questões já catalogadas)
2. `.planning/PROJECT.md`
3. `.planning/codebase/CRITICAL-ANALYSIS.md` (2026-04-02 — vários itens resolvidos, mas o framing está correto)

### Backend (entender o que é fonte de verdade)
4. `supabase/migrations/20260317_foundation_organizations_classes.sql`
5. `supabase/migrations/20260303000000_create_users_pets.sql`
6. `supabase/migrations/20260410120000_pr08_rls_membership_core.sql`
7. `supabase/migrations/20260407_pr06_rpc_class_join.sql`
8. `supabase/migrations/20260409120000_pr07_1_signup_default_onboard.sql`
9. `supabase/functions/_shared/authz.ts`
10. `supabase/functions/_shared/cors.ts`
11. `supabase/functions/answer-question/index.ts`
12. `supabase/functions/pet-me/index.ts`
13. `supabase/functions/user-progress/index.ts`
14. `supabase/functions/broto-chat/index.ts`
15. `supabase/services/notebooklm/main.py`

### Shared (entender o vocabulário)
16. `packages/shared/src/index.ts`
17. `packages/shared/src/hooks/create-cached-hook.ts`
18. `packages/shared/src/api/api-client.ts`
19. `packages/shared/src/answer-question/after-submit.ts`
20. `packages/shared/src/daily-missions/core.ts`
21. `packages/shared/src/mock-exam/index.ts`
22. `packages/shared/src/types/user-profile.ts` + `pet.ts` + `class.ts` + `organization.ts`

### Web (referência principal de UX hoje)
23. `apps/web/src/router.tsx`
24. `apps/web/src/contexts/AuthContext.tsx`
25. `apps/web/src/contexts/OrganizationContext.tsx`
26. `apps/web/src/contexts/ClassContext.tsx`
27. `apps/web/src/lib/api-client.ts`
28. `apps/web/src/pages/Home.tsx`
29. `apps/web/src/components/home/HomeRightSidebar.tsx`
30. `apps/web/src/pages/StudyArea.tsx`
31. `apps/web/src/pages/Progress.tsx`
32. `apps/web/src/pages/Routine.tsx`

### Mobile (entender divergências)
33. `apps/mobile/app/_layout.tsx`
34. `apps/mobile/app/(tabs)/_layout.tsx`
35. `apps/mobile/app/(tabs)/index.tsx`
36. `apps/mobile/app/(tabs)/questions.tsx` vs `apps/mobile/app/study-area.tsx`

### Admin (entender o B2B)
37. `apps/admin/src/contexts/AdminAuthContext.tsx`
38. `apps/admin/src/hooks/useClasses.ts`
39. `apps/admin/src/hooks/useClassIndicators.ts`
40. `apps/admin/src/hooks/useMaterials.ts`

---

## 13. Diagnóstico-resumo

**O sistema funciona — mas o que está doendo no usuário é falta de modelagem, não falta de código.**

O ciclo de consolidação v1.1 fez o que prometia: cortou duplicação byte-a-byte, corrigiu race conditions, padronizou ferramental, blindou CORS e RLS. **Esse trabalho foi correto e está entregue.**

Depois disso, o time voltou a desenvolver features (simulado SMCK, novos cards na home, achievements, heatmap, mistakes, performance series) **sem ter parado para responder perguntas-chave de produto**:

1. **O que é a "alma" do Broto** — um app de prática gamificada, um plano de estudo personalizado, ou uma plataforma escolar?
2. **Como gamificação se conecta** — XP, streak, fase, humor, missões, conquistas são uma engine ou seis features soltas?
3. **O que é uma "sessão de estudo"** — só simulado, ou também banco de questões?
4. **Como o aluno percebe progresso** — heatmap, ranking, gráfico de área, missões, fase do Broto?
5. **O que o admin/professor pode fazer** — vê apenas indicadores, ou assigna conteúdo, autora questões, comunica com aluno?
6. **Qual o papel real do Broto Chat** — coach, tira-dúvidas de matéria, FAQ institucional?

Sem essas decisões, **toda iteração visual repete a mesma confusão estrutural**: cards são adicionados, removidos, repostos; conceitos como "rotina" e "conquistas" existem como placeholders; o schema do banco carrega colunas zumbis (`pets.humor`, `pets.moedas`); a área de estudos roda em **dados mock no `@broto/shared`** dois meses depois do início.

**A próxima fase não deveria ser "mais consolidação técnica" — deveria ser "definir os conceitos centrais e modelá-los explicitamente"**. Esse é o input que falta para refatoração ter direção.

As perguntas que esse documento sugere estão em `QUESTIONS.md`.

---

*Última atualização: 2026-05-12. Investigação somente leitura.*
