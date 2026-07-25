-- Sincroniza Vault com ENGAGEMENT_CRON_SECRET (mesmo valor da edge function).
-- Uso (substitua <SEU-SECRET> pelo valor de supabase secrets set):
--
--   supabase db query --linked -f supabase/scripts/setup-engagement-cron-vault.sql
--
-- Ou inline (one-liner):
--   supabase db query --linked "select vault.create_secret('<SEU-SECRET>', 'engagement_cron_secret', 'Cron INST');"

-- Se o secret já existir, descomente update em vez de create:
-- select vault.update_secret(
--   (select id from vault.secrets where name = 'engagement_cron_secret' limit 1),
--   '<SEU-SECRET>',
--   'engagement_cron_secret',
--   'Cron módulo Instituições'
-- );

select vault.create_secret(
  '<SEU-SECRET>',
  'engagement_cron_secret',
  'Cron módulo Instituições'
) as vault_result;
