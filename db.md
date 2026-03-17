Documentação completa do banco (todas as schemas)

Abaixo está a documentação do seu banco pronta para enviar à IA que está desenvolvendo o sistema. Inclui: listagem de schemas, tabelas por schema, colunas (tipo, defaults, constraints básicas), chaves primárias, chaves estrangeiras, índices/observações e notas de segurança/RLS. Também inclui DDL sugerida mínima, exemplos de consultas e recomendações de segurança/performance baseadas nos advisors.

OBS: esta documentação foi gerada executando consultas de inspeção no seu banco. Se quiser o DDL completo literal (com CREATE TABLE etc.) eu posso gerar e/ou aplicar via SQL.
Índice rápido

    Schemas incluídos: auth, vault, realtime, storage, public, supabase_migrations, (outros internos listados mas sem objetos relevantes: graphql, graphql_public, extensions, pgbouncer)
    Para cada tabela: descrição, colunas, PK, FKs, observações de RLS/índices
    Sessão final: DDL sugerida, exemplos de queries comuns e recomendações de segurança/performance

Schema: auth

Descrição: esquema padrão do Supabase Auth — gerencia usuários, sessões, tokens, OAuth, MFA, etc.

Tabelas principais:

    auth.users
        RLS: enabled
        Linhas: 3
        Descrição: Armazena dados de login/usuário.
        Colunas (resumo):
            instance_id: uuid
            id: uuid (PK)
            aud: varchar
            role: varchar
            email: varchar
            encrypted_password: varchar
            email_confirmed_at: timestamptz
            recovery_token, confirmation_token, etc.
            raw_app_meta_data, raw_user_meta_data: jsonb
            is_super_admin: boolean
            phone (text, unique)
            confirmed_at: generated (LEAST(email_confirmed_at, phone_confirmed_at))
            banned_until, deleted_at, is_sso_user, is_anonymous, created_at, updated_at
        PK: id
        FKs: usado por várias tables (ex.: public.users.id references auth.users.id)
        Observações:
            RLS habilitado — revisar políticas (advisors apontaram possíveis problemas de RLS reavaliando auth.* por linha; veja recomendações ao final).

    auth.refresh_tokens
        RLS: enabled
        PK: id (bigint)
        Colunas: token (unique), user_id (varchar), session_id (FK -> auth.sessions.id), revoked, timestamps
        FK: session_id -> auth.sessions.id

    auth.instances
        RLS: enabled
        PK: id (uuid)

    auth.audit_log_entries
        RLS: enabled
        PK: id (uuid)
        payload: json

    auth.schema_migrations
        RLS: enabled
        PK: version
        Registra migrações do auth

    auth.identities
        RLS: enabled
        PK: id (uuid)
        FK: user_id -> auth.users.id
        Coluna gerada: email (lower((identity_data ->> 'email')))

    auth.sessions
        RLS: enabled
        PK: id (uuid)
        FK: user_id -> auth.users.id
        Colunas: aal (enum), not_after, refresh_token_hmac_key, refresh_token_counter, scopes (constraint char_length <= 4096)

    auth.mfa_factors, auth.mfa_challenges, auth.mfa_amr_claims
        RLS: enabled
        Relacionados a MFA, com FKs para auth.users / auth.sessions

    auth.oauth_clients, oauth_authorizations, oauth_consents, oauth_client_states, custom_oauth_providers
        Alguns com RLS disabled — revisar exposição se usados por API pública.*

Observações de segurança (advisors):

    Policies que usam auth.() diretamente podem causar reavaliação por linha (performance). Substituir por (SELECT auth.()) nas policies.
    Habilitar leaked password protection em Auth settings.

Schema: vault

Descrição: armazena secrets criptografados.

    vault.secrets
        RLS: disabled
        PK: id (uuid, default gen_random_uuid())
        Colunas: name, description, secret (texto criptografado), key_id (uuid), nonce (bytea default vault._crypto_aead_det_noncegen()), created_at/updated_at
        Observações: contém dados sensíveis — manter RLS/ACLs apertadas e backups seguros. Considere habilitar RLS se acessado via PostgREST._

Schema: realtime

Descrição: objetos do Realtime (subscriptions, messages, schema_migrations).

    realtime.schema_migrations
        RLS: false
        PK: version (bigint)
    realtime.subscription
        RLS: false
        PK: id (bigint identity)
        Colunas: subscription_id (uuid), entity (regclass), filters (array user_defined_filter), claims (jsonb), claims_role (regrole generated), action_filter (text, default '*'), created_at
    realtime.messages
        RLS: enabled
        PK: inserted_at, id (composite)
        Colunas: topic, extension, payload jsonb, event, private boolean, timestamps
        Observação: típica tabela para broadcast/presence; mantenha policies que limitem SELECT e INSERT a usuários autorizados (topic pattern + membership checks). Advisors sugerem policies específicas (já documentados anteriormente).*

Schema: storage

Descrição: objetos de buckets e arquivos, indexes de vetores.

    storage.migrations
        RLS: true

    storage.buckets
        RLS: true
        PK: id (text)
        Colunas: name, owner (deprecated), owner_id (text), public boolean, file_size_limit, allowed_mime_types (text[])
        foreign keys: s3_multipart_uploads.bucket_id -> storage.buckets.id; objects.bucket_id -> storage.buckets.id

    storage.objects
        RLS: true
        PK: id (uuid default gen_random_uuid())
        Colunas: bucket_id, name, owner (deprecated), owner_id, metadata jsonb, path_tokens (generated string_to_array(name,'/')), last_accessed_at, version, user_metadata
        FK: bucket_id -> storage.buckets.id

    storage.s3_multipart_uploads, storage.s3_multipart_uploads_parts
        RLS: true
        Usadas para uploads S3 multipart

    storage.buckets_analytics, storage.buckets_vectors, storage.vector_indexes
        RLS: true
        Usadas para analytics/vectors (Supabase Vector store)

Observações:

    Policies no storage.objects costumam garantir que apenas usuários vejam seus arquivos — revisar policies existentes.
    index em path_tokens pode ajudar buscas por prefixo.

Schema: public

Descrição: seu esquema de aplicação (tabelas de negócio).

Tabelas identificadas:

    public.users
        RLS: enabled
        Linhas: 2
        PK: id (uuid)
        Colunas:
            id uuid
            email text unique
            nome text
            telefone text
            cpf text unique
            cidade, estado, data_nascimento (date), data_enem (date)
            horas_disponiveis_por_dia int default 2
            image text
            onboarding_done boolean default false
            created_at, updated_at (timestamptz default now())
            streak integer default 0
            last_study_date date
        FKs:
            users.id -> auth.users.id
        Observações:
            RLS habilitado — revisitar policies (advisors indicaram reavaliação auth.* nas policies de users).
            Possui relacionamento com pets, topic_performance, user_question_answers.

    public.pets
        RLS: enabled
        Linhas: 2
        PK: id (text default gen_random_uuid()::text)
        Colunas:
            id text
            user_id uuid (unique)
            nivel int default 1
            xp int default 0
            fase enum pet_fase default 'semente'
            humor int default 100 check 0..100
            energia int default 100 check 0..100
            moedas int default 0
            created_at, updated_at
        FK: user_id -> public.users.id
        Observações:
            user_id tem constraint unique (sugere um pet por usuário)
            RLS habilitado

    public.user_question_answers
        RLS: disabled (advisors flagged as RLS disabled in public)
        Linhas: 11
        PK: id (text default gen_random_uuid()::text)
        Colunas: id, user_id uuid, question_id text, acertou boolean, tempo_resposta integer nullable, created_at timestamp default now()
        FK: user_id -> public.users.id
        Observações:
            RLS não habilitado — se exposto via API pública, isso permite acesso indevido. Habilitar RLS e criar policies.

    public.question_topic_mapping
        RLS: disabled
        PK: (question_id, topico_value)
        Colunas: question_id text, topico_value text
        Observações: mapeamento de questões para tópicos; habilitar RLS se necessário.

    public.topic_performance
        RLS: disabled
        PK: id (text default gen_random_uuid()::text)
        Colunas: user_id uuid, topico_value text, total_answered int default 0, total_correct int default 0, accuracy_pct numeric nullable, last_practiced timestamptz, mastery_level text
        FK: user_id -> public.users.id
        Observações: estatísticas pessoais por tópico — deveria ter RLS habilitado.

    public.tenants
        RLS: disabled
        Linhas: 1
        PK: id uuid default gen_random_uuid()
        Colunas: slug text unique, name text, config jsonb default '{}', created_at
        Observações: se multitenant, obrigatória proteção por RLS ou políticas baseadas em tenant_id.*

Schema: supabase_migrations

    supabase_migrations.schema_migrations
        RLS: false
        PK: version
        Mantém histórico de migrações.

Observações gerais extraídas (advisors / logs)

    Views/Functions:
        Há uma view pública public.current_tenant marcada como SECURITY DEFINER e exposta ao role anon — risco de exposição de auth.users. Remover exposição ou mover para schema privado.
    RLS:
        Tabelas em public com RLS disabled: user_question_answers, question_topic_mapping, topic_performance, tenants. Habilitar RLS e aplicar políticas.
    Performance:
        Policies em users e pets usam auth.() diretamente — troque para (SELECT auth.()).
        Indexes não usados reportados: idx_user_question_answers_user_id e idx_user_question_answers_question_id.
    Logs:
        Alguns erros de migrations/DDL: "must be owner of table users", "cannot execute CREATE VIEW in a read-only transaction", "syntax error at or near 'create'". Revisar scripts/migrações recentes.

DDL sugerida mínima para as tabelas com RLS disabled (exemplos)

Nota: abaixo são trechos de exemplo para ativar RLS e criar policies básicas. Ajuste a expressão USING/WITH CHECK conforme sua lógica de autenticação (auth.uid(), claims tenant, etc.). Sempre teste em ambiente de staging.

Exemplo (apenas ilustrativo — execute apenas se desejar aplicar mudanças):
SQL Query

-- Habilitar RLS
ALTER TABLE public.user_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topic_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Exemplo de policy para permitir que o dono (user_id) acesse seus próprios registros
CREATE POLICY "user_question_answers_owner_select" ON public.user_question_answers
  FOR SELECT
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

CREATE POLICY "user_question_answers_owner_insert" ON public.user_question_answers
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (SELECT auth.uid())));

CREATE POLICY "topic_performance_owner" ON public.topic_performance
  FOR ALL
  TO authenticated
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

Importante: substitua (SELECT auth.uid()) conforme necessário para desempenho; o advisor recomenda usar (SELECT auth.uid()) (observe que é essa forma que evita reavaliação por linha).
Exemplos de queries comuns por tabela (Markdown-friendly)

    public.users
        SELECT básico: SELECT id, email, nome, telefone FROM public.users WHERE id = '...';
        Insert: INSERT INTO public.users (id, email, nome, horas_disponiveis_por_dia) VALUES (gen_random_uuid(), 'a@b.com [blocked]', 'Nome', 2);
        Update: UPDATE public.users SET onboarding_done = true WHERE id = '...';

    public.pets
        SELECT: SELECT * FROM public.pets WHERE user_id = '...';
        Insert (ex. gerar uuid): INSERT INTO public.pets (id, user_id) VALUES ((gen_random_uuid())::text, '...');

    storage.objects
        Listar objetos de um bucket: SELECT * FROM storage.objects WHERE bucket_id = 'my-bucket' ORDER BY created_at DESC LIMIT 100;

    auth.users (consultas administrativas; cuidado com exposição)
        SELECT id, email, created_at FROM auth.users WHERE email LIKE '%@exemplo.com';

Recomendações de segurança e performance (prioridade)

    Segurança (alta)
        Habilitar RLS nas tabelas do schema public que armazenam dados de usuários e métricas pessoais: user_question_answers, topic_performance, question_topic_mapping, tenants.
        Revisar view public.current_tenant — ela é SECURITY DEFINER e exposta a anon; remova exposição pública e revise necessidade do SECURITY DEFINER.
        Revogar privilégios em views/functions que possam expor auth.users a roles anon/authenticated.
        Habilitar leaked password protection em Supabase Auth (HaveIBeenPwned).

    Performance (médio)
        Ajustar RLS policies para usar (SELECT auth.uid()) em vez de auth.uid() direto nas expressões para evitar reavaliação por linha.
        Revisar índices reportados como não utilizados antes de remover (monitorar por mais tempo).
        Indexar colunas utilizadas em policies e joins (ex.: user_id, tenant_id).

    Edge Functions (observadas nos logs)
        Funções user-me e pet-me estão respondendo 200, mas com alguns picos de latência (logs mostram requests > 9s e 22s). Recomenda-se:
            Adicionar logs detalhados e tracing para identificar trechos lentos (DB queries, chamadas externas).
            Garantir timeouts para chamadas externas e usar EdgeRuntime.waitUntil para tarefas em background.
            Verificar queries que as funções executam e se estão sendo bloqueadas por RLS/lock.

    Migrations / Deploy
        Corrigir erros de permissões: "must be owner of table users" — execute DDL com o owner adequado ou altere ownership de forma controlada.
        Evitar executar CREATE VIEW em transações read-only; ajustar scripts de migração.
