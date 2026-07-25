# Operações — Módulo Instituições

Checklist pós-deploy Wave 1 (staging/produção).

## 1. Migrations

```bash
supabase db push --linked
```

Aplicadas:
- `20260707140000_inst_engagement_snapshots.sql`
- `20260707150000_inst_engagement_cron.sql`
- `20260708120000_inst_network_schema.sql` (rede: `school_units`, role `network_admin`)
- `20260708130000_inst_broto_admin_role.sql` (role `broto_admin`)

## 2. Regenerar tipos

```bash
supabase gen types typescript --linked > supabase/database.types.ts
# Reaplicar aliases: ./scripts/gen-database-types.sh (requer SUPABASE_DB_PASSWORD)
```

## 3. Edge functions

```bash
supabase functions deploy engagement-class-get --no-verify-jwt
supabase functions deploy engagement-org-get --no-verify-jwt
supabase functions deploy engagement-snapshot-refresh --no-verify-jwt
supabase functions deploy student-follow-up-set --no-verify-jwt
supabase functions deploy org-students-import --no-verify-jwt
supabase functions deploy org-onboard-create --no-verify-jwt
supabase functions deploy org-teacher-join --no-verify-jwt
supabase functions deploy engagement-network-get --no-verify-jwt
```

### Onboarding institucional (Wave 4)

- Rota admin: `/onboarding` (allowlist `BROTO_ONBOARDING_STAFF_USER_IDS` / `VITE_BROTO_ONBOARDING_STAFF_USER_IDS`)
- Convite professor: login admin com `?invite=CODIGO` ou campo no formulário

## 4. Cron horário (`engagement-snapshot-refresh`)

1. Gerar secret forte (ex.: `uuidgen`)
2. Configurar na edge function:

```bash
supabase secrets set ENGAGEMENT_CRON_SECRET="<seu-secret>"
```

3. Registrar o **mesmo valor** no Vault (SQL Editor, uma vez):

```sql
select vault.create_secret(
  '<seu-secret>',
  'engagement_cron_secret',
  'Cron módulo Instituições'
);
```

4. Confirmar job:

```sql
select jobid, jobname, schedule, active from cron.job
where jobname = 'engagement-snapshot-refresh-hourly';
```

5. Teste manual imediato (sem header Origin — server-to-server):

```bash
curl -X POST \
  'https://lfhsugwhnjqudqomzegp.supabase.co/functions/v1/engagement-snapshot-refresh' \
  -H "x-engagement-cron-secret: <seu-secret>" \
  -H "Content-Type: application/json"
```

Resposta esperada: HTTP 200 com `success: true`. Se 403 `Origin not allowed`, redeploy `engagement-snapshot-refresh` (fix cron bypass CORS).

Vault: se o secret já existir, use `vault.update_secret` — ver `supabase/scripts/setup-engagement-cron-vault.sql`.

Alternativa: refresh por org (JWT `org_admin`):

```bash
curl -X POST \
  'https://lfhsugwhnjqudqomzegp.supabase.co/functions/v1/engagement-snapshot-refresh?organizationId=<uuid-org>' \
  -H "Authorization: Bearer <jwt-org-admin>"
```

## 5. RLS staging

Automático (estrutura):

```bash
supabase db query --linked -f supabase/tests/inst_rls_verify.sql
```

Manual cross-tenant (personas JWT): seguir
- `supabase/tests/inst_rls_cross_tenant.sql`
- `supabase/tests/pr08_rls_matrix_manual.sql`

## 6. Smoke admin (Wave 2)

1. Login professor no admin
2. Abrir `/classes/:id/painel` → aba **Alunos** (cores engajado/risco/sumido)
3. Clicar **Acompanhar** → persistir via `student-follow-up-set`

## 7. Smoke admin (Wave 3)

1. Login como `org_admin` ou `owner`
2. Abrir `/escola` → aba **Visão geral** (ranking turmas, métricas org)
3. Aba **Alertas** → filtrar críticos/atenção; clicar aluno → drill-down
4. **Exportar PDF** → Salvar como PDF (logo Broto, ranking, alertas)
5. Aba **Turmas** → criar turma, import CSV, vincular professor
6. Login como `teacher` → `/escola` redireciona para `/`

## 8. Deploy admin (Vercel)

Ver `docs/deploy-admin.md`. Resumo:

- Root Directory: `apps/admin`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Incluir domínio admin em `ALLOWED_ORIGINS`
- Smoke: `npm run smoke:network`

## 9. RAG turma demo

1. `OPENAI_API_KEY` configurada nas edge secrets
2. Habilitar RAG na turma demo:

```bash
supabase db query --linked -f supabase/scripts/enable-rag-demo-class.sql
```

3. Reindexar materiais (se houver upload):

```bash
deno run --allow-net --allow-env supabase/scripts/reindex-class-rag.ts
```
