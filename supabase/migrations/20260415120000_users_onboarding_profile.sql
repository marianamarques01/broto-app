-- Rich onboarding fields (objetivo faculdade/curso, níveis, horários) — JSON para flexibilidade.
alter table if exists public.users
  add column if not exists onboarding_profile jsonb;

comment on column public.users.onboarding_profile is
  'Dados do fluxo de onboarding (faculdade, curso, meta, níveis por área, horários preferidos).';
