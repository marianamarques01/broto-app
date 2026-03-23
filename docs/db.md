# Banco de dados — documentação

Referência do PostgreSQL no **Supabase**: schemas internos (`auth`, `storage`, …) e schema de aplicação (`public`). Útil para IAs e devs alinharem queries, RLS e migrações.

> **Nota:** trechos deste arquivo refletem um **snapshot** de inspeção no banco (contagens de linhas, RLS em tabelas específicas). O DDL canônico do monorepo está em [`supabase/migrations/`](../supabase/migrations/). Se o banco remoto divergir, priorize as migrações + `supabase db diff`.

---

## Índice

| Seção | Conteúdo |
|--------|-----------|
| [Fonte da verdade](#fonte-da-verdade) | Onde está o schema “oficial” do Broto |
| [Legenda](#legenda) | RLS, PK, FK |
| [Schema `auth`](#schema-auth) | Supabase Auth |
| [Schema `vault`](#schema-vault) | Secrets |
| [Schema `realtime`](#schema-realtime) | Realtime |
| [Schema `storage`](#schema-storage) | Buckets e objetos |
| [Schema `public`](#schema-public) | Tabelas de negócio |
| [Schema `supabase_migrations`](#schema-supabase_migrations) | Histórico de migrações |
| [Alertas (advisors)](#alertas-advisors--recomendações) | Segurança e performance |
| [RLS — exemplos de DDL](#rls--exemplos-de-ddl-ilustrativos) | SQL ilustrativo |
| [Queries úteis](#queries-úteis) | Exemplos |
| [Checklist](#checklist-segurança--performance) | Prioridades |

---

## Fonte da verdade

| Origem | Uso |
|--------|-----|
| `supabase/migrations/*.sql` | Schema esperado no repo (organizations, classes, materials, RLS, etc.) |
| Dashboard Supabase → Table Editor | Estado real do projeto hospedado |
| Este `db.md` | Visão geral + alertas; pode estar defasado em detalhe |

---

## Legenda

| Símbolo / termo | Significado |
|-----------------|-------------|
| **RLS** | Row Level Security |
| **PK** | Primary key |
| **FK** | Foreign key |

---

## Schema `auth`

Esquema padrão do **Supabase Auth**: usuários, sessões, tokens, OAuth, MFA, etc.

### Tabelas principais (resumo)

| Tabela | RLS | PK | Notas |
|--------|-----|-----|--------|
| `auth.users` | habilitado | `id` (uuid) | Login, `email`, `encrypted_password`, metadados JSON, MFA/OAuth |
| `auth.identities` | habilitado | `id` (uuid) | `user_id` → `auth.users.id` |
| `auth.sessions` | habilitado | `id` (uuid) | `user_id` → `auth.users.id` |
| `auth.refresh_tokens` | habilitado | `id` (bigint) | `session_id` → `auth.sessions.id` |
| `auth.mfa_*` | habilitado | — | Fatores e desafios MFA |
| `auth.oauth_*` | variável | — | Algumas com RLS desabilitado — revisar se expostas |

### `auth.users` (detalhe)

Colunas relevantes (não exaustivo):

| Coluna | Tipo / papel |
|--------|----------------|
| `id` | uuid **PK** |
| `email`, `phone` | login; `phone` pode ser unique |
| `encrypted_password` | hash |
| `email_confirmed_at`, `phone_confirmed_at` | confirmação |
| `raw_app_meta_data`, `raw_user_meta_data` | jsonb |
| `is_anonymous`, `is_sso_user`, `banned_until`, `deleted_at` | flags / moderação |
| `created_at`, `updated_at` | auditoria |

**Relação com o app:** `public.users.id` referencia `auth.users.id`.

### Segurança (auth)

- Policies que chamam `auth.uid()` (e funções `auth.*`) **diretamente** na expressão podem causar **reavaliação por linha**. Preferir `(SELECT auth.uid())` onde o advisor indicar.
- Ativar **leaked password protection** nas configurações de Auth (Have I Been Pwned).

---

## Schema `vault`

Secrets criptografados (Supabase Vault).

| Tabela | RLS | PK | Observação |
|--------|-----|-----|------------|
| `vault.secrets` | desabilitado* | `id` (uuid) | `secret`, `key_id`, `nonce` — dados sensíveis; endurecer acesso e backups |

\*Se a tabela for acessível via PostgREST, considere **RLS** e políticas restritas.

---

## Schema `realtime`

| Tabela | RLS | PK | Função |
|--------|-----|-----|--------|
| `realtime.schema_migrations` | não | `version` | Migrações internas |
| `realtime.subscription` | não | `id` | Assinaturas (entity, filters, claims) |
| `realtime.messages` | sim | `(inserted_at, id)` | Broadcast / presence (`topic`, `payload` jsonb) |

**Dica:** manter policies que limitem `SELECT`/`INSERT` a usuários autorizados (padrão de tópico + membership).

---

## Schema `storage`

Arquivos e buckets.

| Tabela | RLS | PK / destaque |
|--------|-----|----------------|
| `storage.buckets` | sim | `id` (text); `public`, `allowed_mime_types` |
| `storage.objects` | sim | `id` (uuid); `bucket_id` FK → buckets; `path_tokens` gerado |
| `storage.s3_multipart_uploads` (+ parts) | sim | Uploads multipart |
| `storage.buckets_vectors`, `storage.vector_indexes`, … | sim | Vector store / analytics |

**Dica:** policies em `storage.objects` costumam restringir por `owner` / pasta; revisar no projeto. Índice em `path_tokens` ajuda prefix search.

---

## Schema `public`

Schema de **aplicação** (negócio). Abaixo: como estava descrito no snapshot de inspeção; compare com `supabase/migrations/` para colunas novas (ex.: `organizations`, `classes`, `materials`, `current_class_id`).

### `public.users`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | Habilitado |
| **PK** | `id` (uuid) |
| **FK** | `id` → `auth.users.id` |

Colunas (snapshot):

| Coluna | Tipo / default |
|--------|----------------|
| `email` | text, unique |
| `nome`, `telefone`, `cpf` | text (`cpf` unique) |
| `cidade`, `estado` | text |
| `data_nascimento`, `data_enem` | date |
| `horas_disponiveis_por_dia` | int, default `2` |
| `image` | text |
| `onboarding_done` | boolean, default `false` |
| `streak` | int, default `0` |
| `last_study_date` | date |
| `created_at`, `updated_at` | timestamptz |

Relaciona com `pets`, `topic_performance`, `user_question_answers` (e no monorepo: turmas, matrículas, etc., via migrações).

### `public.pets`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | Habilitado |
| **PK** | `id` (text, default `gen_random_uuid()::text`) |
| **FK** | `user_id` → `public.users.id` (**unique** → um pet por usuário) |

Colunas (snapshot): `nivel`, `xp`, `fase` (`pet_fase`), `humor` / `energia` (0–100), `moedas`, timestamps.

### `public.user_question_answers`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | **Desabilitado** no snapshot — risco se exposto ao cliente |
| **PK** | `id` (text) |
| **FK** | `user_id` → `public.users.id` |

Colunas: `question_id`, `acertou`, `tempo_resposta`, `created_at`.

### `public.question_topic_mapping`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | Desabilitado |
| **PK** | `(question_id, topico_value)` |
| **Colunas** | `question_id`, `topico_value` |

### `public.topic_performance`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | Desabilitado — dados pessoais; ideal habilitar RLS |
| **PK** | `id` (text) |
| **FK** | `user_id` → `public.users.id` |

Colunas: `topico_value`, `total_answered`, `total_correct`, `accuracy_pct`, `last_practiced`, `mastery_level`.

### `public.tenants`

| Aspecto | Detalhe |
|---------|---------|
| **RLS** | Desabilitado |
| **PK** | `id` (uuid) |
| **Colunas** | `slug` (unique), `name`, `config` jsonb, `created_at` |

No monorepo, o modelo evoluiu para **organizations** / **classes** — veja migrações.

---

## Schema `supabase_migrations`

| Tabela | RLS | Função |
|--------|-----|--------|
| `supabase_migrations.schema_migrations` | não | Versões aplicadas pelo CLI |

---

## Alertas (advisors) & recomendações

### Segurança (alta prioridade)

| Item | Ação |
|------|------|
| Tabelas `public` sem RLS | Habilitar RLS em `user_question_answers`, `topic_performance`, `question_topic_mapping`, `tenants` (e alinhar com modelo atual do Broto) |
| View `public.current_tenant` | Se ainda existir: era citada como **SECURITY DEFINER** exposta a `anon` — **remover** ou restringir (a migração do repo faz `DROP VIEW IF EXISTS`) |
| `vault.secrets` | Não expor; revisar ACLs |
| Auth | Leaked password protection; revisar policies OAuth com RLS off |

### Performance (média)

| Item | Ação |
|------|------|
| Policies em `users` / `pets` | Usar `(SELECT auth.uid())` em vez de `auth.uid()` “nu” quando indicado pelo advisor |
| Índices não usados | Ex.: `idx_user_question_answers_user_id`, `idx_user_question_answers_question_id` — monitorar antes de dropar |
| Policies / joins | Indexar colunas usadas em `USING` / `WITH CHECK` e FKs frequentes |

### Edge Functions (observação de logs)

Picos de latência em `user-me` / `pet-me`: adicionar tracing, timeouts em chamadas externas, revisar locks e queries sob RLS.

### Migrações

Erros típicos a evitar: `must be owner of table users`, `CREATE VIEW` em transação read-only, DDL com sintaxe quebrada — rodar com role correto e scripts idempotentes.

---

## RLS — exemplos de DDL (ilustrativos)

> **Atenção:** execute apenas após revisar com o modelo real e em **staging**. Ajuste `USING` / `WITH CHECK` (tenant, admin, etc.).

```sql
-- Habilitar RLS
ALTER TABLE public.user_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topic_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Dono do registro = usuário autenticado
CREATE POLICY "user_question_answers_owner_select"
  ON public.user_question_answers
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_question_answers_owner_insert"
  ON public.user_question_answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "topic_performance_owner"
  ON public.topic_performance
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
```

---

## Queries úteis

### `public.users`

```sql
SELECT id, email, nome, telefone
FROM public.users
WHERE id = $1;

UPDATE public.users
SET onboarding_done = true
WHERE id = $1;
```

### `public.pets`

```sql
SELECT *
FROM public.pets
WHERE user_id = $1;
```

### `storage.objects`

```sql
SELECT *
FROM storage.objects
WHERE bucket_id = 'meu-bucket'
ORDER BY created_at DESC
LIMIT 100;
```

### `auth.users` (admin apenas)

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@exemplo.com';
```

---

## Checklist segurança & performance

- [ ] RLS nas tabelas `public` com dados de usuário / métricas
- [ ] Nenhuma view **SECURITY DEFINER** exposta a `anon` sem necessidade
- [ ] Policies com `(SELECT auth.uid())` onde aplicável
- [ ] Auth: leaked password protection
- [ ] Revisar latência das Edge Functions críticas
- [ ] Alinhar este doc com `supabase/migrations` após cada release

---

*Documento reformatado para leitura humana + IA. Snapshot original: inspeção SQL no banco; detalhes finos podem variar por ambiente.*
