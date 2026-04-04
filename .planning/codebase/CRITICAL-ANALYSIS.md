# Analise Critica da Codebase — Broto EdTech

**Data:** 2026-04-02
**Escopo:** Monorepo completo (apps/mobile, apps/web, apps/admin, packages/shared, supabase/)

---

## Sumario Executivo

O monorepo apresenta uma arquitetura inicial razoavel (Turborepo com 3 apps + shared package + Supabase backend), mas sofre de **duplicacao massiva entre apps**, **inconsistencias de padrao graves**, **acoplamento forte ao Supabase**, e **pontos frageis criticos** em cache e tratamento de erros. O `packages/shared` esta subutilizado — apenas ~30% do codigo compartilhavel esta la.

### Metricas de Saude

| Dimensao | Nota | Justificativa |
|----------|------|---------------|
| Duplicacao | D | ~25% do codigo duplicado entre mobile/web |
| Consistencia | D | Convencoes divergem entre apps (naming, quotes, exports) |
| Acoplamento | C- | Supabase acoplado diretamente em componentes e hooks |
| Fragilidade | D | Race conditions, sem retry, erros silenciosos |
| Arquitetura | C | Boa separacao de apps, mas logica de negocio misturada com UI |
| Codigo morto | C | packages/ui sem uso, onboarding incompleto, .venv no git |
| Testes | F | Zero testes automatizados |

---

## 1. INCONSISTENCIAS DE PADRAO

### 1.1 Nomenclatura de Arquivos [ALTA]

| Convencao | Mobile | Web | Admin |
|-----------|--------|-----|-------|
| Hooks | `kebab-case` (use-pet.ts) | `camelCase` (usePet.ts) | camelCase |
| Componentes | `PascalCase` | `PascalCase` | PascalCase |
| Lib files | `kebab-case` | `kebab-case` | kebab-case |

**Impacto:** Desenvolvedores alternando entre apps precisam lembrar convencoes diferentes. Build tools podem ter problemas com case sensitivity.

### 1.2 Formatacao de Codigo [ALTA]

| Aspecto | Mobile | Web/Admin |
|---------|--------|-----------|
| Aspas | `"double quotes"` | `'single quotes'` |
| Ponto e virgula | Sim (`;`) | Nao |
| Trailing comma | Inconsistente | Consistente |

**Causa raiz:** Nao ha config compartilhada de Prettier/ESLint no root do monorepo que force consistencia.

### 1.3 Padroes de Export [ALTA]

| Padrao | Mobile | Web/Admin |
|--------|--------|-----------|
| Screens/Pages | `export default function` | `export function` (named) |
| Hooks | `export function` | `export function` |
| Utilities | `export const` | `export const` |

**Impacto:** Imports inconsistentes — mobile usa `import X from` vs web usa `import { X } from`.

### 1.4 Inicializacao do Supabase [MEDIA]

- **Mobile:** Factory function com lazy initialization (`createClient()` retorna singleton)
- **Web/Admin:** Export direto de singleton (`export const supabase = createClient(...)`)

### 1.5 Hook Patterns [MEDIA]

- **Mobile:** Hooks incluem `useFocusEffect` para refresh automatico ao voltar a tela
- **Web:** Hooks nao tem equivalente (sem conceito de "focus" na web)
- **Mobile:** Exporta `refreshPet = refresh`
- **Web:** Exporta tanto `refreshPet = refresh` quanto `refreshPetIfStale = refreshIfStale`

### 1.6 Localizacao de Context Hooks [MEDIA]

- **Mobile:** `useAuth` em `hooks/use-auth.ts`, `useClass` em `hooks/use-class.ts` (consistente)
- **Web:** `useAuth` em `contexts/AuthContext.tsx`, `useClass` em `hooks/useClass.ts` (inconsistente)

### 1.7 Type Imports [BAIXA]

- **Mobile:** Uso inconsistente de `import type` — as vezes usa, as vezes nao
- **Web:** Mais consistente com `import { type X }` inline

---

## 2. DUPLICACAO DE LOGICA

### 2.1 Duplicatas Identicas (byte-for-byte)

| Arquivo | Mobile | Web | Linhas | Acao |
|---------|--------|-----|--------|------|
| `study-area-mock.ts` | `lib/study-area-mock.ts` | `src/lib/study-area-mock.ts` | 383 | MOVER para shared |
| `types/questions.ts` | `lib/types/questions.ts` | `src/lib/types/questions.ts` | 2 | Re-export desnecessario — importar direto do shared |
| `useClass` | `hooks/use-class.ts` | `src/hooks/useClass.ts` | 8 | MOVER para shared |
| `createCachedHook` | `hooks/create-cached-hook.ts` | `src/hooks/createCachedHook.ts` | 41 | Intencional (isolamento de React instance), mas poderia ser melhor |

### 2.2 Duplicatas com Divergencia Minima (95% identicas)

| Arquivo | Mobile | Web | Divergencia |
|---------|--------|-----|-------------|
| `usePet` | 47 linhas | 42 linhas | Mobile tem `useFocusEffect`, web exporta `refreshIfStale` extra |
| `useProgress` | 44 linhas | 39 linhas | Idem |
| `useUser` | 31 linhas | 25 linhas | Idem |
| `answer-question.ts` | 26 linhas | 25 linhas | **Web chama `bumpPerformanceDay()`, mobile NAO** — gap de feature |
| `ClassContext.tsx` | 62 linhas | 59 linhas | Mobile usa JOIN otimizado (1 query), web faz 2 queries separadas |

### 2.3 Duplicatas com Divergencia Significativa

#### `useQuestionsFilters` — O MAIOR problema de duplicacao

| Aspecto | Mobile (502 linhas) | Web (230 linhas) |
|---------|---------------------|------------------|
| Base URL | 3 tiers (env var, Supabase + org slug, fallback) | 1 tier (Supabase direto) |
| Error handling | Completo (hints de rede, WiFi, localhost) | Generico |
| Loading strategy | Sequencial (areas primeiro, exams em background) | Paralelo (`Promise.all`) |
| Cache | `topicosRef` explicito | State implicito |

**Risco:** Bug fix em um app nao propaga para o outro. Mobile tem UX superior mas web e mais simples.

#### `daily-missions.ts` — Incompatibilidade de plataforma

| Aspecto | Mobile (74 linhas) | Web (80 linhas) |
|---------|---------------------|-----------------|
| Storage | `AsyncStorage` (async) | `localStorage` (sync) |
| API | Todas funcoes retornam `Promise` | Funcoes sincronas |
| Observer | Nenhum | `subscribe/notify` pattern |
| Erros | `.catch(() => {})` silencioso | Sem tratamento |

#### `api-client.ts` — Invocacao diferente

| Aspecto | Mobile (90 linhas) | Web (65 linhas) |
|---------|---------------------|-----------------|
| Invocacao | `supabase.functions.invoke()` | `fetch()` direto para URL |
| Auth | Via Supabase auth object | Manual `getSession()` + headers |
| 401 handling | `signOut()` + `router.replace` | `window.location.href = '/login'` |

### 2.4 Funcionalidades exclusivas de um app (potencial gap)

| Feature | Mobile | Web | Admin |
|---------|--------|-----|-------|
| Performance history tracking | Nao | Sim (169 linhas) | Nao |
| Study routine generation | Nao | Sim (83 linhas) | Nao |
| Daily missions com observers | Nao | Sim | Nao |
| Onboarding | Incompleto (TODOs) | Incompleto (TODOs) | N/A |

### 2.5 Subutilizacao do packages/shared

**O que esta no shared:**
- Tipos (Class, Organization, Student, Question, Progress, Content, AdminProfile, Material)
- `createCachedStore()` (state management generico)
- `generateClassCode()`
- API client core (`ApiError`, `pathToFunctionName`, `mergeParamsIntoBody`)

**O que DEVERIA estar no shared mas NAO esta:**
1. `study-area-mock.ts` (383 linhas duplicadas)
2. Core logic de `useQuestionsFilters` (search, filter, cache)
3. `daily-missions` com adapter pattern para storage
4. `answer-question` logic
5. `area-config` (schema de configuracao de areas)
6. `ClassContext` query logic
7. Hooks `usePet`, `useProgress`, `useUser` (core sem platform-specific)
8. `performance-history` (para futuro uso no mobile)

**Estimativa:** Mover 5-8 arquivos economizaria ~500 linhas e reduziria manutencao em ~30%.

---

## 3. ACOPLAMENTO

### 3.1 Acoplamento Direto ao Supabase [CRITICO]

Todos os apps importam e usam `@supabase/supabase-js` diretamente:
- Componentes chamam `.from('table').select()` diretamente
- Hooks assinam `supabase.auth.onAuthStateChange()` sem abstracacao
- ClassContext faz queries Supabase inline
- AdminAuthContext query `admin_profiles` diretamente

**Consequencia:** Impossivel migrar para outro backend sem reescrever todos os apps.

**Arquivos afetados:**
- `apps/mobile/lib/supabase/client.ts`
- `apps/web/src/lib/supabase.ts`
- `apps/admin/src/lib/supabase.ts`
- `apps/mobile/contexts/ClassContext.tsx`
- `apps/web/src/contexts/ClassContext.tsx`
- `apps/admin/src/contexts/AdminAuthContext.tsx`
- `apps/mobile/hooks/use-auth.ts`
- `apps/web/src/contexts/AuthContext.tsx`

### 3.2 Logica de Negocio nos Componentes [ALTA]

Componentes React fazem chamadas de API, tratamento de erro e navegacao inline:
- `apps/mobile/app/(auth)/login.tsx` — flow de login completo com navegacao hardcoded
- `apps/mobile/app/broto-chat.tsx` — chamadas API, error mapping, state updates inline
- `apps/mobile/lib/api/answer-question.ts` — acopla refresh de dados a submissao

**Consequencia:** Nao da pra testar logica de negocio sem montar componente React.

### 3.3 Edge Functions Acopladas a Data Shapes do Frontend [MEDIA]

- `broto-chat/index.ts` espera `{ messages?: ChatMessage[] }` (shape rigido)
- Sem versionamento de API ou negociacao de contrato
- Se frontend muda shape, backend quebra silenciosamente

### 3.4 Mapeamentos Hardcoded [MEDIA-ALTA]

- `use-questions-filters.ts` linha 13: `const IDIOMAS_TOPIC_ID = '__idiomas'` hardcoded
- `supabase/functions/user-progress/index.ts`: 20+ mapeamentos de topico hardcoded
- Sem single source of truth para taxonomia de questoes

---

## 4. PONTOS FRAGEIS

### 4.1 Race Condition no Cache [CRITICO]

**Arquivo:** `packages/shared/src/hooks/create-cached-hook.ts`

```
Cenario:
1. Request A inicia, salva gen = 1
2. refresh() chamado → generation = 2, novo fetchData() (Request B)
3. Request A completa → checa gen(1) !== generation(2) → nao atualiza cache ✓
4. MAS: timing ruim pode fazer inflight = null APOS Request B iniciar → requests duplicados
```

O `inflight` flag usa boolean check que nao e atomico. Precisa de Promise-based lock.

### 4.2 Race Condition no 401 Handling [CRITICO]

**Arquivo:** `apps/mobile/lib/api-client.ts`

```typescript
let handlingUnauthorized = false;
async function handleUnauthorizedOnce() {
    if (handlingUnauthorized) return;
    handlingUnauthorized = true;
    // ... signOut + navigate
    handlingUnauthorized = false; // ← RACE CONDITION
}
```

Se multiplas chamadas retornam 401 simultaneamente, flag boolean nao garante execucao unica.

### 4.3 Sem Retry Logic [ALTA]

Nenhum dos API clients (mobile, web) implementa retry em falha de rede:
- Unica tentativa, depois throw
- `useQuestionsFilters` retorna array vazio `[]` silenciosamente em falha
- Usuario ve resultados vazios sem indicacao de erro de rede

### 4.4 Erros Silenciosos [ALTA]

| Local | Comportamento | Impacto |
|-------|---------------|---------|
| `broto-chat.tsx` catch | Se erro nao e `ApiError`, `detail` fica undefined | Usuario ve mensagem generica, dev nao pode debugar |
| `ClassContext.tsx` `.catch(() => {})` | Swallows erro completamente | Se Supabase esta fora, app renderiza estado vazio sem feedback |
| `daily-missions` mobile `.catch(() => {})` | Incremento falha silenciosamente | Missoes nao atualizam sem que usuario saiba |

### 4.5 Sem Auth Guards no Chat [ALTA]

`apps/mobile/app/broto-chat.tsx`:
- Nao verifica se usuario esta autenticado antes de renderizar
- Nao verifica se usuario esta matriculado em turma
- Edge function verifica, mas cliente faz request desnecessario

### 4.6 Timeout sem Retry no Servico Python [ALTA]

`supabase/functions/broto-chat/index.ts`:
- 55 segundos de timeout com abort
- Se timeout, usuario recebe erro imediatamente
- Sem retry ou fallback
- Se servico Python esta fora, 502 apos 55s de espera

### 4.7 CORS Permissivo [MEDIA]

Todos os edge functions:
```typescript
const allowed = ALLOWED_ORIGINS.length === 0 
  || ALLOWED_ORIGINS.includes(origin)
    ? origin || '*'
    : ALLOWED_ORIGINS[0]
```
Se `ALLOWED_ORIGINS` nao esta configurado, aceita qualquer origem (`*`).

### 4.8 Null Safety [MEDIA]

- `ClassContext.tsx` linha 41: `classRow.organizations as Organization ?? null` — se `organizations` e `undefined`, nao cai no `??`
- `QuestionPlayer.tsx`: `question.alternatives.map(...)` sem null check em `alternatives`
- Edge functions retornam dados sem validar que campos obrigatorios existem

---

## 5. PROBLEMAS DE ARQUITETURA

### 5.1 Ausencia de Service Layer [ALTA]

Nao existe camada de servico entre UI e dados:
```
ATUAL:    Component → Hook → Supabase SDK direto
IDEAL:    Component → Hook → Service → Repository → Supabase
```

Logica de negocio esta espalhada entre componentes, hooks e funcoes utilitarias.

### 5.2 Edge Functions Monoliticas [MEDIA]

`broto-chat/index.ts` (145 linhas) faz tudo: CORS, auth, validacao, enrollment check, proxy para Python, error handling.

Logica de CORS repetida em cada edge function. Sem middleware pattern.

### 5.3 Auth Flow Fragmentado [MEDIA]

Cada app implementa seu proprio flow de autenticacao:
- **Mobile:** Supabase SDK + API call para verificar perfil
- **Web:** Supabase SDK + fetch manual para perfil
- **Admin:** Supabase SDK + query direta na tabela `admin_profiles`

Nenhum endpoint unificado de verificacao (`/api/auth/verify`).

### 5.4 Migrations Basicas [MEDIA]

Apenas 2 arquivos de migracao. Para producao, esperaria 10-20+:
- Sem procedimentos de rollback documentados
- Sem data migrations (apenas schema)
- Triggers usam `security definer` — precisa auditoria

### 5.5 Integracao Fraca com Servico Python [MEDIA]

- Unico ponto de integracao (chat)
- URL hardcoded: `${SERVICE_URL}/notebook/chat`
- Sem health check, circuit breaker, ou service discovery
- Se Python esta fora, usuario espera 55s para erro

---

## 6. CODIGO MORTO OU DESNECESSARIO

### 6.1 Python .venv Commitado [CRITICO]

`supabase/services/notebooklm/.venv/` — 3,305 arquivos (~55 MB) trackados no git.
Inclui `.pyc` compilados e `__pycache__/`.

**Fix:** `git rm -r --cached` + adicionar ao `.gitignore`.

### 6.2 Assets Binarios Grandes no Git [CRITICO]

| Arquivo | Tamanho | Status |
|---------|---------|--------|
| `Edtech_Brand_Identity_*.png` | 4.7 MB | Duplicata na raiz |
| `2.svg` | 1.1 MB | SVG nao otimizado |
| `new_logo.svg` | 1.1 MB | Duplicado em apps/web/public/ |
| `new_logo_icon.svg` | 740 KB | Duplicado em mobile e web |
| `docs/pitch-tcc-broto-dark.pdf` | 13 MB | Apresentacao — usar LFS ou link externo |

**Fix:** SVGO para otimizar SVGs (1MB → ~30KB), remover duplicatas da raiz.

### 6.3 packages/ui Sem Uso [MEDIA]

`/packages/ui/` existe mas nao aparece em nenhum import dos apps. Provavel codigo morto.

### 6.4 Onboarding Incompleto [ALTA]

Ambos `apps/mobile/app/onboarding.tsx` e `apps/web/src/pages/Onboarding.tsx` tem:
- `// TODO: save data via API`
- `// TODO: navigate to diagnostic quiz`

Onboarding esta nao-funcional. Usuarios nao conseguem definir metas de estudo.

### 6.5 Re-exports Desnecessarios [BAIXA]

`apps/mobile/lib/types/questions.ts` e `apps/web/src/lib/types/questions.ts` sao apenas:
```typescript
export * from '@broto/shared'
```
Apps deveriam importar diretamente do `@broto/shared`.

---

## 7. RECOMENDACOES PRIORIZADAS

### Imediato (1-2 dias)
1. **Remover .venv do git** — `git rm -r --cached` + `.gitignore`
2. **Otimizar SVGs** — SVGO reduz 1MB → ~30KB
3. **Fix race condition no cache** — usar Promise-based lock em `create-cached-hook.ts`
4. **Fix race condition no 401** — usar Promise ao inves de boolean flag

### Curto prazo (1-2 semanas)
5. **Mover duplicatas identicas para shared** — `study-area-mock`, `useClass`, `answer-question`
6. **Padronizar formatacao** — Prettier config compartilhada no root
7. **Padronizar nomenclatura** — escolher camelCase ou kebab-case para hooks
8. **Adicionar retry logic** — exponential backoff no API client
9. **Corrigir CORS** — fail closed (rejeitar origens nao listadas)

### Medio prazo (2-4 semanas)
10. **Extrair hooks para shared** — `usePet`, `useProgress`, `useUser` com platform adapters
11. **Unificar daily-missions** — adapter pattern para storage (AsyncStorage vs localStorage)
12. **Extrair core de useQuestionsFilters** — logica de search/filter para shared
13. **Completar ou remover onboarding** — eliminar TODOs
14. **Auditar e remover packages/ui**

### Longo prazo (1-2 meses)
15. **Criar service layer** — separar logica de negocio de UI
16. **Abstrair Supabase** — adapter pattern para desacoplar
17. **Adicionar testes** — Vitest para shared, Jest para mobile
18. **Refatorar edge functions** — extrair middleware (CORS, auth, validacao)
19. **Circuit breaker** — para integracao com servico Python

---

## Conclusao

A codebase tem uma **fundacao arquitetural adequada** (monorepo, shared package, Supabase backend), mas precisa de **consolidacao urgente**. Os problemas mais criticos sao:

1. **Duplicacao** — ~25% do codigo esta duplicado entre mobile e web
2. **Fragilidade** — race conditions no cache e 401 handling podem causar bugs dificeis de reproduzir
3. **Inconsistencia** — cada app segue convencoes diferentes de naming, formatting e exports
4. **Acoplamento** — Supabase esta hardwired em tudo, impossibilitando testes e migracao

A boa noticia: todos esses problemas sao corrigiveis incrementalmente, sem rewrite. O `packages/shared` ja existe como ponto de consolidacao — so precisa ser alimentado com o codigo que hoje esta duplicado.
