-- INST: cron horário para engagement-snapshot-refresh
-- Pré-requisitos no projeto Supabase (Dashboard → Database → Extensions):
--   pg_cron, pg_net habilitados
--
-- Antes do push, configure o secret da edge function (valor aleatório forte):
--   supabase secrets set ENGAGEMENT_CRON_SECRET="<uuid-ou-string-longa>"
--
-- Depois, registre o mesmo valor no Vault (SQL Editor, uma vez):
--   select vault.create_secret('<mesmo-valor>', 'engagement_cron_secret', 'Cron INST module');
--
-- Desfazer: select cron.unschedule('engagement-snapshot-refresh-hourly');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'engagement-snapshot-refresh-hourly') then
    perform cron.unschedule('engagement-snapshot-refresh-hourly');
  end if;
end $$;

select cron.schedule(
  'engagement-snapshot-refresh-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://lfhsugwhnjqudqomzegp.supabase.co/functions/v1/engagement-snapshot-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-engagement-cron-secret',
      coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'engagement_cron_secret' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

comment on extension pg_cron is 'Agendamento engagement-snapshot-refresh (módulo Instituições)';
