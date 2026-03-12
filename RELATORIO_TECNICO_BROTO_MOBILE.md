# Relatório Técnico — Broto Mobile (React Native/Expo)

## 1. Visão Geral

| Item | Valor |
|------|--------|
| Stack | Expo 54 + React 19 + React Native 0.81 |
| Roteamento | Expo Router 6 (file-based) |
| Backend | Supabase (Auth + Edge Functions + RLS) |
| Animações | React Native Reanimated 4.1 |
| Estilo | NativeWind + tokens customizados |
| LOC total | ~8.600 linhas (TS/TSX) |
| Telas | 9 (5 tabs + login + signup + onboarding + splash) |
| Branch | feat/frontend-design |

---

## 2. O Que Está Feito (funcional e integrado)

### Autenticação

- Login/Signup com email + senha via Supabase Auth
- Upload de avatar (expo-image-picker)
- Splash animado com fireflies + logo gradient
- Hook `useAuth` reativo (INITIAL_SESSION + token refresh)
- Logout funcional (HeaderAuth)

### Onboarding

- Data do ENEM (DatePicker) + horas disponíveis por dia (Slider)
- `PATCH /api/user/profile` marca `onboarding_done=true`
- Guard no `(tabs)/_layout.tsx` redireciona se `!onboardingDone`

### Home (/)

- Pet hero card com emoji da fase, nível, XP bar animada
- Stats strip (sequência, questões hoje, % acerto)
- 3 missões diárias (desbloqueio sequencial baseado em `questoesHoje`)
- Dica do Broto (rotação por dia da semana)
- CTA "Começar missões"
- Fireflies animadas no card

### Estudar (/study)

- Hero do Broto (fase, XP, nível)
- Stats do dia + CTA
- "Onde focar" (áreas piores) ou "Por onde começar" (sem dados)

### Questões (/questions)

- **Step 1:** escolha de área (4 cards)
- **Step 2:** hero da área + filtros (ano, tópico, idioma) + CTA "Iniciar treino"
- **Step 3:** QuestionPlayer inline (contexto HTML, 5 alternativas A–E, feedback correto/errado)
- `POST /api/answer/question` com XP tracking
- Filtragem 100% client-side (JSON estáticos em `public/`)

### Progresso (/progress)

- Cards resumo (total questões, acertos, % acerto)
- 4 barras de área (color-coded: teal, amber, green, violet)
- Pontos fortes/fracos (top/bottom 3 tópicos com ≥3 respostas)

### Rotina (/routine)

- Calendário semanal (strip de 7 dias)
- Card "Hoje" com área foco, duração, tópicos sugeridos
- Cards compactos para próximos dias
- Algoritmo de distribuição baseado em `horasDisponiveisPorDia` + áreas fracas
- Card de meta (link para editar no onboarding)

### Edge Functions (6 deployed)

| Função | Método | Status |
|--------|--------|--------|
| auth-signup | POST | OK — cria user + pet |
| user-me | GET | OK — perfil camelCase |
| user-profile | PATCH | OK — atualiza perfil |
| pet-me | GET | OK — nível/xp/fase/streak |
| answer-question | POST | OK — XP +10/+2, streak, topic_performance |
| user-progress | GET | OK — agregação por área (36 tópicos → 4 áreas) |

### Design System

- **tokens.ts:** cores (bg, green, gold, blue, violet, amber, red), fontes (DM Sans, Fraunces, Cormorant Garamond), espaçamento
- **ds.ts:** design system v2 (space, radius, typography, dsColors)
- Componentes reutilizáveis: ListCard, SectionHeader, AnimatedEntry (5 wrappers)

---

## 3. O Que Precisa Ser Feito

### Prioridade Alta (funcionalidade core faltando)

#### A. ~~Dados estáticos (public/) não existem no mobile~~ ✅ Resolvido

Os JSONs (`areas.json`, `exams.json`, `topics/*.json`, questões por ano) estão no Supabase Storage (bucket `static`) e já são consumidos pelo mobile. O `useQuestionsFilters` usa `EXPO_PUBLIC_QUESTIONS_BASE_URL` quando definido; quando vazio, faz fallback para `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/static`. **Estratégia em uso:** servir do Supabase Storage.

#### B. Refresh de dados nos hooks

`usePet`, `useProgress`, `useUser` fazem fetch uma única vez no mount. Após responder questões ou completar onboarding, os dados ficam stale. Falta:

- Refetch ao voltar para a tela (`useFocusEffect`)
- Ou um mecanismo de invalidation (callback de refetch exportado)

#### C. Missões diárias não persistem estado real

As missões na Home são derivadas de `questoesHoje` (total global), mas não há lógica de "3 questões DE Matemática" vs "2 DE Linguagens". A missão 1 se completa com quaisquer 3 questões. **Falta vincular missão → área.**

#### D. Sem tratamento de token expirado

O `api-client.ts` injeta Bearer token, mas não trata 401 (redirect to login). Se o token expirar durante uso, as chamadas falham silenciosamente.

---

### Prioridade Média (UX e polish)

#### E. Pressable function-style bug no native

Já corrigido na Home e Questions, mas falta auditar: `study.tsx`, `progress.tsx`, `routine.tsx`, `login.tsx`, `signup.tsx`. Qualquer `Pressable` com `style={({ pressed }) => ({...})}` que tenha `borderRadius`/`backgroundColor`/`flexDirection` vai quebrar no device.

#### F. Signup.tsx é o maior arquivo (1283 linhas)

Mistura lógica de formulário, animações, upload de imagem, validação. Deveria ser quebrado em componentes menores.

#### G. Sem pull-to-refresh

Nenhuma ScrollView tem `refreshControl`. O usuário não tem como atualizar dados manualmente.

#### H. Sem loading skeleton na Home

O pet card mostra placeholders mínimos, mas as missões e a dica aparecem sem skeleton/shimmer.

#### I. Sem feedback háptico

Nenhum Pressable usa `Haptics.impactAsync()`. Esperado em apps nativos modernos.

---

### Prioridade Baixa (tech debt e melhorias)

#### J. className misturado com style

Algumas Views usam NativeWind `className` (ex: `className="flex-row items-center gap-2"`) enquanto outras usam `style={{}}`. Inconsistente — deveria padronizar em um ou outro.

#### K. gap no style sem verificação de plataforma

`gap` em flexbox funciona no web mas pode ter problemas em Android &lt;API 28. Já migrado para `marginRight` em alguns cards, mas não em todos.

#### L. Sem testes

Zero testes unitários ou E2E. Nenhum `__tests__/`, nenhum jest/vitest config.

#### M. Sem offline support

Se o device perder conexão, tudo falha sem mensagem clara. Sem cache local, sem optimistic updates.

#### N. Sem analytics/tracking

Nenhum evento de analytics (screen views, button taps, funnel). Importante para o TCC.

#### O. Sem push notifications

Sem lembrete diário para manter streak.

---

## 4. Arquivos Maiores (candidatos a refactor)

| Arquivo | Linhas | Ação sugerida |
|---------|--------|----------------|
| signup.tsx | 1283 | Extrair FormStep, AvatarPicker, animações |
| questions.tsx | 989 | Extrair AreaSelector, FilterPanel, QuestionList |
| login.tsx | 920 | Extrair LoginForm, animações compartilhadas com signup |
| index.tsx | 890 | OK — já tem MissionCard e Firefly extraídos |
| routine.tsx | 823 | Extrair WeekStrip, DayCard, RoutineGenerator |

---

## 5. Resumo Executivo

O app está **funcionalmente completo** — todas as 5 tabs, auth, onboarding e 6 Edge Functions estão implementados e integrados. O design system é consistente e as animações são polidas.

Os gaps mais críticos são **operacionais**:

1. Dados estáticos precisam de uma estratégia de distribuição (sem `public/` no mobile).
2. Hooks não refazem fetch quando dados mudam.
3. O bug do Pressable function-style precisa ser auditado nas 5 telas restantes.
