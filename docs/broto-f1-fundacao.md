# Fase 0 — Fundacao: Turborepo + Novo Schema

## Contexto

O projeto **Broto** e atualmente um app mobile React Native/Expo (`enem-mobile/`).
Esta sendo expandido para uma plataforma com 3 apps:
- `apps/mobile/` — Expo (ja existe, movido)
- `apps/web/` — React + Vite (aluno no desktop) — futuro
- `apps/admin/` — React + Vite (escola/professor) — futuro

Esta fase prepara a fundacao: migracao para monorepo Turborepo, novo schema de banco de dados, e seed do ENEM como organizacao publica.

---

## Status geral

| Parte | Status |
|-------|--------|
| 1 — Migracao Turborepo | **FEITO** |
| 2 — Tipos compartilhados | **FEITO** |
| 3 — Schema Supabase | **FEITO** (migration + seed prontos para executar) |
| 4 — Edge functions existentes | **FEITO** |
| 5 — App mobile | **FEITO** (tenant -> class migrado) |
| 6 — Validacao | **FEITO** |

---

## Parte 1 — Migracao para Turborepo [FEITO]

### Estrutura criada

```
enem-mobile/
├── apps/
│   └── mobile/                 ← todo o conteudo do app movido aqui
├── packages/
│   ├── shared/                 ← @broto/shared — tipos TS compartilhados
│   └── ui/                     ← @broto/ui — placeholder para futuro
├── supabase/
│   ├── migrations/
│   │   ├── 20260317_white_label_tenants.sql
│   │   └── 20260317_foundation_organizations_classes.sql
│   ├── functions/
│   │   └── class-join/index.ts
│   └── seed-enem.sql
├── services/
│   └── notebooklm/
├── package.json                ← workspace root (broto)
├── turbo.json
└── .gitignore
```

### Arquivos de configuracao

- `package.json` (raiz): workspaces `apps/*` + `packages/*`, scripts turbo, devDeps turbo + typescript
- `turbo.json`: tasks build/dev/lint/typecheck
- `apps/mobile/package.json`: adicionado `"@broto/shared": "*"` nas dependencies

---

## Parte 2 — Tipos compartilhados [FEITO]

Todos os tipos criados em `packages/shared/src/`:

| Arquivo | Tipos exportados |
|---------|-----------------|
| `types/organization.ts` | `Organization`, `OrganizationConfig` |
| `types/class.ts` | `Class`, `Enrollment`, `Material` |
| `types/student.ts` | `Student`, `AdminProfile`, `UserRole` |
| `types/question.ts` | `Area`, `Topico`, `Exam`, `Question`, `QuestionsResponse`, `getQuestionId()` |
| `types/progress.ts` | `TopicPerformance`, `StudentProgress`, `ClassIndicators` |
| `types/content.ts` | `GeneratedContent`, `Flashcard`, `FlashcardsData`, `MindMapNode`, `MindMapData` |
| `utils/class-code.ts` | `generateClassCode()`, `normalizeClassCode()` |

---

## Parte 3 — Schema Supabase [FEITO]

### Correcoes aplicadas apos analise do `db.md`

O banco real tem `public.users` (NAO `public.profiles`). As tabelas `topics`, `questions`, `generated_content`, `study_plans` NAO existem no banco. Todas as correcoes foram aplicadas:

| Problema encontrado | Correcao |
|---------------------|----------|
| Documento original referenciava `public.profiles` | Trocado para `public.users` em todos os lugares |
| ALTER TABLE para `topics`, `questions` etc. | Removidos (tabelas nao existem) |
| UUIDs invalidos (`org-enem-...`, `cls-enem-...`) | Substituidos por UUIDs hex validos |
| View `public.current_tenant` exposta a anon | `DROP VIEW IF EXISTS` adicionado |
| Policies usavam `auth.uid()` direto | Trocado para `(SELECT auth.uid())` (performance) |
| Tabelas existentes sem RLS | Habilitado RLS + policies para `user_question_answers`, `topic_performance`, `question_topic_mapping`, `tenants` |

### Arquivos

- **Migration**: `supabase/migrations/20260317_foundation_organizations_classes.sql`
  - Cria: `organizations`, `admin_profiles`, `classes`, `enrollments`, `materials`
  - Adiciona `current_class_id` a `public.users`
  - Remove view `current_tenant`
  - Habilita RLS em todas as tabelas novas e existentes
  - Todas as policies usam `(SELECT auth.uid())`

- **Seed**: `supabase/seed-enem.sql`
  - Owner: `942397fd-bb75-4af0-b0c0-a0c92447071d` (teste@gmail.com)
  - Org ENEM: `a0e00000-0000-4000-8000-000000000001`
  - Classe ENEM 2026: `b0c00000-0000-4000-8000-000000000001`
  - Codigo de acesso: `ENEM26`
  - Matricula todos os users existentes na turma
  - Idempotente (usa `ON CONFLICT ... DO UPDATE`)

### Como executar

1. Abrir **SQL Editor** no Supabase Dashboard
2. Colar e executar `20260317_foundation_organizations_classes.sql`
3. Colar e executar `seed-enem.sql`

---

## Parte 4 — Atualizar Edge Functions existentes [FEITO]

As edge functions deployadas usam `tenant_id` e referenciam tabela `profiles`. Precisam ser atualizadas:

### Padrao de atualizacao:

```typescript
// ANTES (edge functions atuais)
const { data: profile } = await supabase
  .from('profiles')         // <-- tabela errada no doc original, real = 'users'
  .select('tenant_id, ...')
  .eq('id', user.id)
  .single()
const tenantId = profile.tenant_id

// DEPOIS
const { data: user } = await supabase
  .from('users')
  .select('current_class_id, ...')
  .eq('id', userId)
  .single()
const classId = user.current_class_id
```

### Funcoes atualizadas:
- [x] `user-me` — retorna `current_class_id` em vez de `tenant_id`
- [x] `user-profile` — aceita `current_class_id` no PATCH, referencia `users`
- `pet-me` — sem alteracao (ja usa `user_id`)
- `answer-question` — sem alteracao (ja usa `user_id`)
- `user-progress` — sem alteracao (ja usa `user_id`)

---

## Parte 5 — App mobile [FEITO]

### Alteracoes realizadas

| Antes | Depois | Arquivo |
|-------|--------|---------|
| `TenantContext.tsx` | `ClassContext.tsx` | `apps/mobile/contexts/` |
| `use-tenant.ts` | `use-class.ts` | `apps/mobile/hooks/` |
| `TenantProvider` | `ClassProvider` | `apps/mobile/app/_layout.tsx` |
| `useTenant()` / `tenant.slug` | `useClass()` / `organization.slug` | `apps/mobile/hooks/use-questions-filters.ts` |
| `.from('profiles')` | `.from('users')` | `ClassContext.tsx` |
| `lib/types/tenant.ts` | Removido (tipos agora em `@broto/shared`) | — |

### Nova edge function criada

- `supabase/functions/class-join/index.ts` — matricula aluno via codigo de acesso
  - Valida codigo, busca turma ativa, faz upsert em enrollments, atualiza `current_class_id` em `users`

---

## Parte 6 — Checklist de validacao

### Monorepo
- [x] Estrutura `apps/mobile` + `packages/shared` + `packages/ui` criada
- [x] `package.json` raiz com workspaces
- [x] `turbo.json` configurado
- [x] `@broto/shared` como dependencia do mobile
- [x] `npm install` na raiz instala tudo sem erros
- [x] `turbo run dev` inicia o app mobile normalmente

### Schema
- [x] Migration criada com todas as tabelas novas
- [x] RLS habilitado em TODAS as tabelas (novas e existentes)
- [x] Policies usando `(SELECT auth.uid())` para performance
- [x] View `current_tenant` removida
- [x] Seed idempotente com UUIDs hex validos
- [x] **Executar migration no Supabase SQL Editor**
- [x] **Executar seed no Supabase SQL Editor**
- [x] Verificar: `SELECT count(*) FROM enrollments` (alunos matriculados)
- [x] Verificar: `SELECT current_class_id FROM users` (populado)

### App mobile
- [x] TenantContext -> ClassContext
- [x] useTenant -> useClass
- [x] Todas as referencias a `tenant_id` / `tenantId` removidas
- [x] Queries apontam para `public.users` (nao `profiles`)
- [x] Login funciona normalmente
- [x] Home carrega pet, missoes e stats
- [x] Tela de questoes funciona
- [x] Progresso carrega corretamente
- [x] Rotina carrega corretamente

### Edge functions
- [x] `class-join` criada
- [x] `user-me` atualizada
- [x] `user-profile` atualizada
- [x] Deploy das edge functions

---

## Proximos passos

**Fase 0 concluida.** Seguir para Fase 1 — Admin Dashboard (`broto-f2-admin.md`).

### Limpeza futura (apos estabilizacao)

1. **Remover coluna `tenant_id`** de `public.users` (se existir, apos confirmar que nada mais usa)
2. **Remover tabela `public.tenants`** (substituida por `organizations`)
3. **Remover migration antiga** `20260317_white_label_tenants.sql` (ja aplicada e substituida)

---

## Observacoes importantes

1. **Nao remover `tenant_id` de `users` nesta fase.** Deixar as duas colunas coexistir ate todas as edge functions estarem atualizadas.

2. **UUIDs fixos do seed** para referenciar em scripts futuros:
   - Org ENEM: `a0e00000-0000-4000-8000-000000000001`
   - Classe ENEM: `b0c00000-0000-4000-8000-000000000001`
   - Owner: `942397fd-bb75-4af0-b0c0-a0c92447071d`

3. **Codigo `ENEM26`** e o acesso padrao a turma aberta. O app pode auto-matricular o aluno nesse codigo durante o onboarding.

4. **Tabela real e `public.users`**, nao `profiles`. O documento original tinha esse erro. Todas as queries no app e edge functions ja foram corrigidas.

5. **`packages/ui`** criado vazio — sera populado quando os apps web forem criados.
