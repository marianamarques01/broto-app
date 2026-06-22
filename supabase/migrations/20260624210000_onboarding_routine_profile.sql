-- Perfil estruturado para rotina pós-onboarding (cold start antes de p_know acumular).
alter table if exists public.users
  add column if not exists hours_per_day float not null default 2.0,
  add column if not exists exam_date date,
  add column if not exists target_score float,
  add column if not exists strong_areas text[] not null default '{}',
  add column if not exists weak_areas text[] not null default '{}',
  add column if not exists onboarding_routine_banner_shown boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.users.hours_per_day is
  'Horas de estudo/dia informadas no onboarding (espelha horas_disponiveis_por_dia).';
comment on column public.users.exam_date is
  'Data alvo do exame (ENEM); pode espelhar data_enem quando definida.';
comment on column public.users.target_score is
  'Meta de nota informada no onboarding.';
comment on column public.users.strong_areas is
  'Slugs de área ENEM declaradas fortes no onboarding (ex.: avançado).';
comment on column public.users.weak_areas is
  'Slugs de área ENEM declaradas fracas no onboarding (ex.: iniciante).';
comment on column public.users.onboarding_routine_banner_shown is
  'Banner explicativo da rotina inicial já visto/dispensado.';
comment on column public.users.onboarding_completed_at is
  'Timestamp da conclusão do fluxo de onboarding.';
