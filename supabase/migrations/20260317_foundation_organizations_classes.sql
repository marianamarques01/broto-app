-- Foundation Phase 0: Organizations, Classes, Enrollments, Materials
-- Date: 2026-03-17
--
-- Banco real tem: public.users, public.pets, public.user_question_answers,
--   public.question_topic_mapping, public.topic_performance, public.tenants
-- NAO tem: public.profiles, public.topics, public.questions

-- 1) Enum de roles (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'user_role'
  ) then
    create type public.user_role as enum ('student', 'admin');
  end if;
end $$;

-- 2) Limpar view antiga que expoe auth.users ao role anon
drop view if exists public.current_tenant;

-- 3) Tabelas novas
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  is_public     boolean not null default false,
  owner_id      uuid references auth.users(id) not null,
  config        jsonb not null default '{
    "mascot_name": "Broto",
    "primary_color": "#4CAF50",
    "features": {
      "chat": true,
      "flashcards": true,
      "mind_map": true,
      "routine": true,
      "audio_overview": false
    }
  }',
  created_at    timestamptz default now()
);

create table if not exists public.admin_profiles (
  id              uuid primary key references auth.users(id),
  full_name       text not null,
  email           text not null,
  organization_id uuid references public.organizations(id),
  role            text not null default 'teacher' check (role in ('owner', 'teacher')),
  created_at      timestamptz default now()
);

create table if not exists public.classes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations(id) not null,
  name             text not null,
  description      text,
  access_code      text unique not null,
  is_active        boolean not null default true,
  notebook_id      text,
  notebook_status  text not null default 'not_configured'
                   check (notebook_status in ('not_configured','indexing','ready','error')),
  created_by       uuid references auth.users(id) not null,
  created_at       timestamptz default now()
);

create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid references public.classes(id) not null,
  student_id   uuid references auth.users(id) not null,
  enrolled_at  timestamptz default now(),
  status       text not null default 'active' check (status in ('active','inactive')),
  unique(class_id, student_id)
);

create table if not exists public.materials (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid references public.classes(id) not null,
  organization_id  uuid references public.organizations(id) not null,
  title            text not null,
  type             text not null check (type in ('pdf','url','youtube','text')),
  source_url       text not null,
  index_status     text not null default 'pending'
                   check (index_status in ('pending','indexing','indexed','failed')),
  uploaded_by      uuid references auth.users(id) not null,
  created_at       timestamptz default now()
);

-- 4) Adicionar current_class_id a public.users (tabela real do banco)
alter table public.users
  add column if not exists current_class_id uuid references public.classes(id);

-- 5) RLS nas tabelas novas
alter table public.organizations enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.materials enable row level security;

-- 6) Policies (usando (SELECT auth.uid()) para performance)

-- organizations
drop policy if exists "admin vê sua organização" on public.organizations;
create policy "admin vê sua organização"
  on public.organizations for select
  using (owner_id = (select auth.uid()));

drop policy if exists "aluno vê organização da turma" on public.organizations;
create policy "aluno vê organização da turma"
  on public.organizations for select
  using (
    is_public = true
    or id in (
      select c.organization_id from public.classes c
      inner join public.enrollments e on e.class_id = c.id
      where e.student_id = (select auth.uid()) and e.status = 'active'
    )
  );

-- admin_profiles
drop policy if exists "admin vê próprio perfil" on public.admin_profiles;
create policy "admin vê próprio perfil"
  on public.admin_profiles for all
  using (id = (select auth.uid()));

-- classes
drop policy if exists "admin vê turmas da organização" on public.classes;
create policy "admin vê turmas da organização"
  on public.classes for all
  using (
    organization_id in (
      select organization_id from public.admin_profiles where id = (select auth.uid())
    )
  );

drop policy if exists "aluno vê própria turma" on public.classes;
create policy "aluno vê própria turma"
  on public.classes for select
  using (
    id in (
      select class_id from public.enrollments
      where student_id = (select auth.uid()) and status = 'active'
    )
  );

-- enrollments
drop policy if exists "aluno vê próprias matrículas" on public.enrollments;
create policy "aluno vê próprias matrículas"
  on public.enrollments for select
  using (student_id = (select auth.uid()));

drop policy if exists "admin vê matrículas das turmas" on public.enrollments;
create policy "admin vê matrículas das turmas"
  on public.enrollments for select
  using (
    class_id in (
      select id from public.classes
      where organization_id in (
        select organization_id from public.admin_profiles where id = (select auth.uid())
      )
    )
  );

drop policy if exists "aluno pode se matricular" on public.enrollments;
create policy "aluno pode se matricular"
  on public.enrollments for insert
  with check (student_id = (select auth.uid()));

-- materials
drop policy if exists "admin gerencia materiais" on public.materials;
create policy "admin gerencia materiais"
  on public.materials for all
  using (
    organization_id in (
      select organization_id from public.admin_profiles where id = (select auth.uid())
    )
  );

drop policy if exists "aluno vê materiais da turma" on public.materials;
create policy "aluno vê materiais da turma"
  on public.materials for select
  using (
    class_id in (
      select class_id from public.enrollments
      where student_id = (select auth.uid()) and status = 'active'
    )
  );

-- 7) Habilitar RLS nas tabelas existentes que estavam sem (recomendacao do advisor)
alter table public.user_question_answers enable row level security;
alter table public.question_topic_mapping enable row level security;
alter table public.topic_performance enable row level security;
alter table public.tenants enable row level security;

-- Policies para tabelas existentes
drop policy if exists "user_question_answers_owner_select" on public.user_question_answers;
create policy "user_question_answers_owner_select"
  on public.user_question_answers for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "user_question_answers_owner_insert" on public.user_question_answers;
create policy "user_question_answers_owner_insert"
  on public.user_question_answers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "topic_performance_owner" on public.topic_performance;
create policy "topic_performance_owner"
  on public.topic_performance for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- question_topic_mapping: leitura publica para authenticated (dados de referencia)
drop policy if exists "question_topic_mapping_read" on public.question_topic_mapping;
create policy "question_topic_mapping_read"
  on public.question_topic_mapping for select
  to authenticated
  using (true);

-- tenants: leitura publica para authenticated (dados de config)
drop policy if exists "tenants_read" on public.tenants;
create policy "tenants_read"
  on public.tenants for select
  to authenticated
  using (true);
