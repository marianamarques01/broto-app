# Prompt: Preparação White Label — Broto Platform

## Contexto do Projeto

O **Broto** é um PWA gamificado de estudos com vínculo afetivo (mascote virtual "Broto"), atualmente voltado para preparação do ENEM. O app está sendo desenvolvido como TCC e tem roadmap de produto para se tornar uma **plataforma white label** — ou seja, o mesmo app poderá ser licenciado para outros contextos (concursos públicos, escolas, certificações técnicas, cursinhos, etc.), com conteúdo e identidade visual configurados por tenant.

**Stack atual:** React (PWA) + Supabase (Auth, DB, Storage) + TypeScript

O conteúdo atual (questões do ENEM) está salvo no Supabase Storage e integrado ao app. O ENEM é o **tenant de demonstração do MVP** — não o único contexto possível.

---

## Objetivo

Fazer as alterações estruturais necessárias para que a codebase **não precise de refatoração profunda** quando o segundo tenant for adicionado. Não estamos construindo o painel admin white label agora — estamos apenas garantindo que a fundação suporte multi-tenancy de forma natural.

---

## Regras Absolutas (Non-Negotiable)

### 1. Nunca referenciar conteúdo específico de tenant no core do app

**Proibido no core:**
```typescript
// ❌ Nunca faça isso no core
type Subject = 'matematica' | 'portugues' | 'historia' | 'biologia'
const ENEM_SUBJECTS = [...]
if (exam === 'ENEM') { ... }
```

**Correto:**
```typescript
// ✅ Sempre genérico
type Topic = {
  id: string
  label: string
  tenant_id: string
  order: number
  metadata?: Record<string, unknown>
}
```

### 2. Todo modelo de dados deve ter `tenant_id`

Toda tabela que contém conteúdo ou configuração de produto deve ter `tenant_id`. Tabelas de sistema puro (auth, logs internos) são exceção.

**Tabelas que precisam de `tenant_id`:**
- `topics` (antes: matérias, disciplinas, áreas)
- `questions`
- `study_plans`
- `study_sessions`
- `achievements` (conquistas podem variar por tenant)
- `materials` (PDFs, vídeos, links)
- `routines`
- `indicators` / `metrics`
- Qualquer futura tabela de conteúdo

**Tabelas que NÃO precisam:**
- `profiles` / `users` (usuário é da plataforma)
- `auth.*` (Supabase auth)

### 3. Separar conteúdo de configuração

O que varia por tenant não pode ser hardcoded. Deve vir sempre do banco ou de config de tenant:
- Nomes dos temas/tópicos
- Quantidade e tipo de questões por sessão
- Estrutura de gamificação (XP por ação, levels)
- Nome e identidade do mascote (o "Broto" pode virar outro nome)
- Paleta de cores e branding

---

## Alterações Requeridas

### Banco de Dados (Supabase)

#### Criar tabela `tenants`
```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- ex: 'enem', 'pcmg', 'cursinho-alfa'
  name text not null,                  -- ex: 'ENEM 2026'
  config jsonb default '{}',           -- branding, features flags, gamification config
  created_at timestamptz default now()
);

-- Seed do tenant ENEM (MVP)
insert into tenants (slug, name, config)
values (
  'enem',
  'ENEM',
  '{
    "mascot_name": "Broto",
    "primary_color": "#4CAF50",
    "features": {
      "audio_overview": true,
      "mind_map": true,
      "flashcards": true
    }
  }'
);
```

#### Adicionar `tenant_id` nas tabelas existentes

Para cada tabela de conteúdo que ainda não tem `tenant_id`:

```sql
-- Exemplo para topics/subjects (adapte ao nome real da tabela)
alter table topics
  add column if not exists tenant_id uuid references tenants(id);

-- Popular com o tenant ENEM para registros existentes
update topics
  set tenant_id = (select id from tenants where slug = 'enem')
  where tenant_id is null;

-- Tornar obrigatório após popular
alter table topics
  alter column tenant_id set not null;

-- RLS: usuário só vê o tenant ao qual pertence
alter table topics enable row level security;

create policy "topics_tenant_isolation"
  on topics for all
  using (
    tenant_id = (
      select tenant_id from profiles
      where id = auth.uid()
    )
  );
```

Repita o padrão para: `questions`, `study_plans`, `study_sessions`, `materials`, `achievements`, `routines`.

#### Adicionar `tenant_id` em `profiles`
```sql
alter table profiles
  add column if not exists tenant_id uuid references tenants(id);

-- Popular com tenant ENEM para usuários existentes
update profiles
  set tenant_id = (select id from tenants where slug = 'enem')
  where tenant_id is null;

alter table profiles
  alter column tenant_id set not null;
```

---

### TypeScript / Frontend

#### Criar tipos genéricos (substituir tipos hardcoded)

Criar arquivo `src/types/tenant.ts`:
```typescript
export type Tenant = {
  id: string
  slug: string
  name: string
  config: TenantConfig
}

export type TenantConfig = {
  mascot_name: string
  primary_color: string
  features: {
    audio_overview?: boolean
    mind_map?: boolean
    flashcards?: boolean
    [key: string]: boolean | undefined
  }
}

export type Topic = {
  id: string
  tenant_id: string
  label: string
  order: number
  metadata?: Record<string, unknown>
}

export type Question = {
  id: string
  tenant_id: string
  topic_id: string
  content: string
  options: QuestionOption[]
  correct_option: string
  difficulty: 'easy' | 'medium' | 'hard'
  year?: number
  metadata?: Record<string, unknown>
}

export type QuestionOption = {
  id: string
  label: string
}
```

#### Criar hook `useTenant`

Criar `src/hooks/useTenant.ts`:
```typescript
import { useContext } from 'react'
import { TenantContext } from '@/contexts/TenantContext'

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
```

#### Criar `TenantContext`

Criar `src/contexts/TenantContext.tsx`:
```typescript
import { createContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tenant } from '@/types/tenant'

type TenantContextType = {
  tenant: Tenant | null
  loading: boolean
}

export const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) { setLoading(false); return }

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

      setTenant(tenantData)
      setLoading(false)
    }

    loadTenant()
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  )
}
```

#### Envolver o app com `TenantProvider`

Em `src/main.tsx` ou `src/App.tsx`:
```tsx
// Antes
<App />

// Depois
<TenantProvider>
  <App />
</TenantProvider>
```

#### Substituir referências hardcoded a matérias do ENEM

Buscar no projeto por:
- `'matematica'`, `'portugues'`, `'historia'`, `'biologia'`, `'quimica'`, `'fisica'`
- `ENEM`, `enem` (fora de slugs e seeds)
- Arrays de matérias fixas

Substituir por queries dinâmicas:
```typescript
// ❌ Antes
const subjects = ['Matemática', 'Português', 'História']

// ✅ Depois
const { data: topics } = await supabase
  .from('topics')
  .select('*')
  .eq('tenant_id', tenant.id)
  .order('order')
```

---

### Queries Supabase

Toda query de conteúdo deve filtrar por `tenant_id`. Se o RLS estiver configurado corretamente (vide migrations acima), isso é automático — mas seja explícito nas queries críticas:

```typescript
// ✅ Explícito e seguro
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('tenant_id', tenant.id)  // explícito
  .eq('topic_id', topicId)
```

---

## O Que NÃO Fazer Agora

Não construir ainda:
- Painel admin de tenant
- Onboarding de novo tenant
- Upload de materiais por tenant
- Sistema de billing/licenciamento
- Customização de tema por tenant na UI

Esses são problemas de **fase 2**. Agora só garantimos que a fundação suporta.

---

## Critério de Sucesso

Após as alterações, deve ser possível:

1. Inserir um segundo tenant (`insert into tenants (slug, name) values ('pcmg', 'PCMG 2026')`)
2. Criar tópicos para esse tenant (`insert into topics (tenant_id, label) values (...)`)
3. Cadastrar um usuário com `tenant_id` do PCMG
4. O app renderizar corretamente para esse usuário com os tópicos do PCMG — sem nenhuma alteração no código da aplicação

Se o passo 4 funcionar, a fundação está correta.

---

## Status nesta codebase (mobile)

- ✅ **TenantContext / useTenant / TenantProvider** implementados e aplicados no `app/_layout.tsx`
- ✅ `useQuestionsFilters` agora resolve a base URL de conteúdo com `tenant.slug` (suporta `static/<tenant-slug>/...`)
- ⚠️ **Migrations SQL** (tabelas `tenants` + `tenant_id` + RLS) ainda precisam ser aplicadas no Supabase do projeto

---

## Notas para o TCC

O ENEM é o **tenant de demonstração do MVP**. Na defesa, isso é apresentado como decisão arquitetural intencional:

> *"A plataforma foi projetada com arquitetura multi-tenant desde o início. O ENEM é a instância de validação do MVP, demonstrando que o core do produto é agnóstico de conteúdo."*

Isso transforma uma restrição de escopo em diferencial de produto.